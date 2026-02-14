"use client";

import { Chat } from "@/components/chat";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-3xl px-4">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
          RAG Chat
        </h1>
        <p className="mb-8 text-center text-gray-500">
          문서를 업로드하고 질문하세요. RAG 기반으로 답변합니다.
        </p>
        <Chat />
      </div>
    </main>
  );
}
