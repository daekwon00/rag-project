"use client";

import { useChat } from "ai/react";
import { useRef, useState, useEffect, useCallback, type FormEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// ReactMarkdown 플러그인/컴포넌트를 컴포넌트 외부에 상수로 선언 (리렌더 방지)
const mdRemarkPlugins = [remarkGfm];
const mdRehypePlugins = [rehypeHighlight];
const mdComponents: Components = {
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300"
      {...props}
    >
      {children}
    </a>
  ),
};

interface SourceItem {
  index: number;
  source: string;
  content: string;
  similarity: number;
}

function getSources(annotations?: unknown[]): SourceItem[] | null {
  if (!annotations) return null;
  for (const a of annotations) {
    if (typeof a === "object" && a !== null && "sources" in a) {
      const sources = (a as { sources: SourceItem[] }).sources;
      if (Array.isArray(sources) && sources.length > 0) return sources;
    }
  }
  return null;
}

type UploadStatus =
  | { type: "idle" }
  | { type: "uploading"; fileName: string }
  | { type: "success"; fileName: string; chunks: number }
  | { type: "error"; message: string };

interface ChatProps {
  conversationId: string | null;
  initialMessages?: { id: string; role: "user" | "assistant"; content: string }[];
  onConversationCreated?: (id: string) => void;
}

async function saveMessage(conversationId: string, role: string, content: string) {
  await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, content }),
  });
}

async function createConversation(title: string): Promise<string> {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  return data.id;
}


export function Chat({ conversationId, initialMessages = [], onConversationCreated }: ChatProps) {
  const convIdRef = useRef(conversationId);
  const isFirstMessage = useRef(!conversationId);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
    reload,
    stop,
  } = useChat({
    initialMessages,
    onFinish: async (message) => {
      // 어시스턴트 응답 완료 시 DB 저장
      if (convIdRef.current) {
        await saveMessage(convIdRef.current, "assistant", message.content);
      }
    },
  });

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    type: "idle",
  });
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    convIdRef.current = conversationId;
  }, [conversationId]);

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 업로드 성공 메시지 3초 후 자동 숨김
  useEffect(() => {
    if (uploadStatus.type === "success") {
      const timer = setTimeout(
        () => setUploadStatus({ type: "idle" }),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [uploadStatus]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const userMessage = input.trim();
      if (!userMessage) return;

      try {
        // 첫 메시지: 대화 생성
        if (isFirstMessage.current) {
          isFirstMessage.current = false;
          const title = userMessage.length > 30
            ? userMessage.slice(0, 30) + "..."
            : userMessage;
          const newId = await createConversation(title);
          convIdRef.current = newId;
          onConversationCreated?.(newId);
        }

        // 사용자 메시지 DB 저장
        if (convIdRef.current) {
          await saveMessage(convIdRef.current, "user", userMessage);
        }
      } catch (err) {
        console.error("대화 저장 오류:", err);
      }

      // useChat의 원래 submit 호출
      originalHandleSubmit(e);
    },
    [input, originalHandleSubmit, onConversationCreated]
  );

  async function handleFileUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploadStatus({ type: "uploading", fileName: file.name });
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadStatus({
          type: "success",
          fileName: file.name,
          chunks: data.chunks,
        });
      } else {
        setUploadStatus({
          type: "error",
          message: data.error || "업로드 실패",
        });
      }
    } catch {
      setUploadStatus({
        type: "error",
        message: "네트워크 오류가 발생했습니다.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleExport() {
    if (!convIdRef.current || exporting) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/export/${convIdRef.current}`);
      if (!res.ok) throw new Error("내보내기 실패");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename\*=UTF-8''(.+)/)?.[1]
          ? decodeURIComponent(
              res.headers.get("Content-Disposition")!.match(/filename\*=UTF-8''(.+)/)![1]
            )
          : "대화.md";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("내보내기 오류:", err);
    } finally {
      setExporting(false);
    }
  }

  // 스트리밍 상태 감지
  const lastMessage = messages[messages.length - 1];
  const isWaitingForResponse = isLoading && (!lastMessage || lastMessage.role === "user" || (lastMessage.role === "assistant" && !lastMessage.content));
  const streamingMessageId = isLoading && lastMessage?.role === "assistant" && lastMessage.content ? lastMessage.id : null;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 문서 업로드 */}
      <form
        onSubmit={handleFileUpload}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx,.pptx"
          className="flex-1 text-sm text-gray-900 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={uploadStatus.type === "uploading"}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 dark:focus:ring-gray-500"
        >
          {uploadStatus.type === "uploading" ? "업로드 중..." : "문서 업로드"}
        </button>
      </form>

      {/* 업로드 상태 표시 */}
      {uploadStatus.type === "uploading" && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{uploadStatus.fileName} 처리 중...</span>
        </div>
      )}
      {uploadStatus.type === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          {uploadStatus.fileName} 업로드 완료 ({uploadStatus.chunks}개 청크)
        </div>
      )}
      {uploadStatus.type === "error" && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <span>{uploadStatus.message}</span>
          <button
            onClick={() => setUploadStatus({ type: "idle" })}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* 채팅 메시지 */}
      <div
        className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        style={{ minHeight: "300px" }}
      >
        {convIdRef.current && messages.length > 0 && (
          <div className="flex justify-start">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            >
              {exporting ? "내보내기 중..." : "마크다운으로 내보내기"}
            </button>
          </div>
        )}
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8 dark:text-gray-500">
            문서를 업로드한 후 질문을 입력하세요.
          </p>
        )}
        {messages.map((m, i) => {
          // 스트리밍 대기 중 빈 어시스턴트 메시지 숨김
          if (isWaitingForResponse && i === messages.length - 1 && m.role === "assistant" && !m.content) return null;
          const isStreaming = m.id === streamingMessageId;
          return (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "user" ? (
                <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[80%]">
                  <div className={`rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 markdown-body${isStreaming ? " streaming" : ""}`}>
                    <ReactMarkdown
                      remarkPlugins={mdRemarkPlugins}
                      rehypePlugins={mdRehypePlugins}
                      components={mdComponents}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                  {(() => {
                    const sources = getSources(m.annotations);
                    if (!sources) return null;
                    return (
                      <details className="source-details mt-2 rounded-lg border border-gray-200 bg-gray-50 text-sm dark:border-gray-700 dark:bg-gray-900">
                        <summary className="source-summary cursor-pointer select-none px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                          참고 문서 ({sources.length}개)
                        </summary>
                        <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
                          {sources.map((src) => (
                            <div key={src.index} className="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-gray-800 dark:text-gray-200 truncate">[출처 {src.index}] {src.source}</span>
                                <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                  {Math.round(src.similarity * 100)}%
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{src.content}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
        {isWaitingForResponse && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <span className="inline-flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 dot-1" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 dot-2" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 dot-3" />
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">답변을 생성하고 있습니다...</span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              <span>오류가 발생했습니다. </span>
              <button
                onClick={() => reload()}
                className="underline hover:text-red-800 dark:hover:text-red-300"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="질문을 입력하세요..."
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-gray-500"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-400"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 dark:focus:ring-gray-500"
          >
            전송
          </button>
        )}
      </form>
    </div>
  );
}
