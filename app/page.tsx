"use client";

import { Chat } from "@/components/chat";
import { Sidebar } from "@/components/sidebar";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Message as DBMessage } from "@/lib/db/schema";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      aria-label="다크 모드 전환"
    >
      {dark ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
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
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">RAG Chat</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                by <span className="font-medium text-gray-500 dark:text-gray-400">UDKsoft</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-gray-400 dark:text-gray-500 sm:flex">
              <span className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-700 dark:text-gray-300">GPT-4o</span>
              <span className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-700 dark:text-gray-300">pgvector</span>
            </div>
            <Link
              href="/documents"
              className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              문서 관리
            </Link>
            {userEmail && (
              <span className="hidden text-xs text-gray-400 dark:text-gray-500 sm:block">{userEmail}</span>
            )}
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
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
        <footer className="border-t border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            UDKsoft &middot; Next.js + Vercel AI SDK + Supabase pgvector
          </p>
        </footer>
      </main>
    </div>
  );
}
