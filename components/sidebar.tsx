"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Conversation } from "@/lib/db/schema";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Plus, X, FileText, BarChart3, Trash2 } from "lucide-react";

interface SidebarProps {
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ currentId, onSelect, onNew, isOpen, onClose }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  async function fetchConversations() {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // 네트워크 오류 무시
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConversations();
  }, [currentId]);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm(t("sidebar", "deleteConfirm"))) return;

    const res = await fetch("/api/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentId === id) {
        onNew();
      }
    }
  }

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed left-0 top-0 z-30 flex h-full w-64 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-sm font-semibold text-foreground">{t("sidebar", "conversations")}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 새 대화 버튼 */}
        <div className="p-3">
          <button
            onClick={() => {
              onNew();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            {t("sidebar", "newChat")}
          </button>
        </div>

        {/* 대화 목록 */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-3">
          {loading ? (
            <p className="py-4 text-center text-xs text-muted-foreground">{t("common", "loading")}</p>
          ) : conversations.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">{t("sidebar", "noConversations")}</p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <button
                    onClick={() => {
                      onSelect(conv.id);
                      onClose();
                    }}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                      currentId === conv.id
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50"
                    }`}
                  >
                    <span className="truncate">{conv.title}</span>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="ml-2 hidden shrink-0 text-muted-foreground hover:text-destructive group-hover:block"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 네비게이션 링크 */}
        <div className="border-t border-border px-3 py-3">
          <Link
            href="/documents"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
          >
            <FileText className="h-4 w-4" />
            {t("sidebar", "documents")}
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
          >
            <BarChart3 className="h-4 w-4" />
            {t("sidebar", "dashboard")}
          </Link>
        </div>
      </aside>
    </>
  );
}
