"use client";

import { useEffect, useState } from "react";
import type { Conversation } from "@/lib/db/schema";

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
    if (!confirm("이 대화를 삭제하시겠습니까?")) return;

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
        className={`fixed left-0 top-0 z-30 flex h-full w-64 flex-col border-r border-gray-200 bg-white transition-transform dark:border-gray-700 dark:bg-gray-800 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">대화 목록</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 새 대화 버튼 */}
        <div className="p-3">
          <button
            onClick={() => {
              onNew();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 대화
          </button>
        </div>

        {/* 대화 목록 */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-3">
          {loading ? (
            <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">로딩 중...</p>
          ) : conversations.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">대화가 없습니다</p>
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
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <span className="truncate">{conv.title}</span>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="ml-2 hidden shrink-0 text-gray-400 hover:text-red-500 group-hover:block dark:text-gray-500 dark:hover:text-red-400"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
