"use client";

import { Chat } from "@/components/chat";
import { Sidebar } from "@/components/sidebar";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Message as DBMessage } from "@/lib/db/schema";

export default function Home() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? null);
    });
  }, []);

  const handleSelectConversation = useCallback(async (id: string) => {
    setConversationId(id);
    // 저장된 메시지 로드
    const res = await fetch(`/api/conversations/${id}/messages`);
    if (res.ok) {
      const messages: DBMessage[] = await res.json();
      setInitialMessages(
        messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      );
    }
  }, []);

  const handleNewConversation = useCallback(() => {
    setConversationId(null);
    setInitialMessages([]);
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <Sidebar
        currentId={conversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 메인 영역 */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="flex items-center justify-between border-b bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">RAG Chat</h1>
              <p className="text-xs text-gray-400">
                by <span className="font-medium text-gray-500">UDKsoft</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-gray-400 sm:flex">
              <span className="rounded bg-gray-100 px-2 py-1">GPT-4o</span>
              <span className="rounded bg-gray-100 px-2 py-1">pgvector</span>
            </div>
            {userEmail && (
              <span className="hidden text-xs text-gray-400 sm:block">{userEmail}</span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        </header>

        {/* 채팅 영역 */}
        <div className="flex-1 overflow-hidden px-4 py-4">
          <div className="mx-auto h-full max-w-3xl">
            <Chat
              key={conversationId ?? "new"}
              conversationId={conversationId}
              initialMessages={initialMessages}
              onConversationCreated={setConversationId}
            />
          </div>
        </div>

        {/* 푸터 */}
        <footer className="border-t bg-white px-4 py-2">
          <p className="text-center text-xs text-gray-400">
            UDKsoft &middot; Next.js + Vercel AI SDK + Supabase pgvector
          </p>
        </footer>
      </main>
    </div>
  );
}
