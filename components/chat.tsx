"use client";

import { useChat } from "ai/react";
import { useRef, useState, useEffect, useCallback, type FormEvent } from "react";

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

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 문서 업로드 */}
      <form
        onSubmit={handleFileUpload}
        className="flex items-center gap-2 rounded-lg border bg-white p-3"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={uploadStatus.type === "uploading"}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {uploadStatus.type === "uploading" ? "업로드 중..." : "문서 업로드"}
        </button>
      </form>

      {/* 업로드 상태 표시 */}
      {uploadStatus.type === "uploading" && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{uploadStatus.fileName} 처리 중...</span>
        </div>
      )}
      {uploadStatus.type === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {uploadStatus.fileName} 업로드 완료 ({uploadStatus.chunks}개 청크)
        </div>
      )}
      {uploadStatus.type === "error" && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
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
        className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto rounded-lg border bg-white p-4"
        style={{ minHeight: "300px" }}
      >
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">
            문서를 업로드한 후 질문을 입력하세요.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-400">
              <span className="inline-flex gap-1 text-lg font-bold">
                <span className="dot-1">.</span>
                <span className="dot-2">.</span>
                <span className="dot-3">.</span>
              </span>
              답변 생성 중
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
              <span>오류가 발생했습니다. </span>
              <button
                onClick={() => reload()}
                className="underline hover:text-red-800"
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
          className="flex-1 rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </div>
  );
}
