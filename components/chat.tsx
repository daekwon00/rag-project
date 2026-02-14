"use client";

import { useChat } from "ai/react";
import { useRef, useState, type FormEvent } from "react";

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert(`문서 수집 완료: ${data.chunks}개 청크, ${data.embeddings}개 임베딩`);
      } else {
        alert(`오류: ${data.error}`);
      }
    } catch {
      alert("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-6">
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
          disabled={uploading}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {uploading ? "업로드 중..." : "문서 업로드"}
        </button>
      </form>

      {/* 채팅 메시지 */}
      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4" style={{ minHeight: "400px" }}>
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">
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
            <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-400">
              답변 생성 중...
            </div>
          </div>
        )}
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
