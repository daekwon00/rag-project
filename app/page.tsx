"use client";

import { Chat } from "@/components/chat";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="border-b bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">RAG Chat</h1>
            <p className="text-xs text-gray-400">
              문서 기반 질의응답 시스템
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="rounded bg-gray-100 px-2 py-1">GPT-4o</span>
            <span className="rounded bg-gray-100 px-2 py-1">pgvector</span>
          </div>
        </div>
      </header>

      {/* 메인 채팅 영역 */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Chat />
      </div>

      {/* 푸터 */}
      <footer className="border-t bg-white px-4 py-3">
        <p className="text-center text-xs text-gray-400">
          Next.js + Vercel AI SDK + Supabase pgvector
        </p>
      </footer>
    </main>
  );
}
