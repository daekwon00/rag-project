"use client";

import { Chat } from "@/components/chat";
import { Sidebar } from "@/components/sidebar";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Menu } from "lucide-react";
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
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="h-8 w-8 text-muted-foreground"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
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
  const { t, lang, setLang } = useTranslation();

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
    <div className="flex h-screen bg-background">
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
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">{t("header", "ragChat")}</h1>
              <p className="text-xs text-muted-foreground">
                by <span className="font-medium">{t("header", "byUDKsoft")}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs sm:flex">
              <Badge variant="secondary">GPT-4o</Badge>
              <Badge variant="secondary">pgvector</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
              <Link href="/documents">
                {t("header", "documents")}
              </Link>
            </Button>
            {userEmail && (
              <span className="hidden text-xs text-muted-foreground sm:block">{userEmail}</span>
            )}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "ko" ? "en" : "ko")}
              className="text-xs font-medium text-muted-foreground"
            >
              {lang === "ko" ? "EN" : "KO"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleLogout}
            >
              {t("common", "logout")}
            </Button>
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
        <footer className="border-t border-border bg-card px-4 py-2">
          <p className="text-center text-xs text-muted-foreground">
            {t("header", "byUDKsoft")} &middot; {t("footer", "tech")}
          </p>
        </footer>
      </main>
    </div>
  );
}
