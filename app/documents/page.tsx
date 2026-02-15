"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Resource {
  id: number;
  name: string;
  chunk_count: number;
  created_at: string;
}

export default function DocumentsPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { t, lang } = useTranslation();

  async function fetchDocuments() {
    try {
      setError(null);
      const res = await fetch("/api/documents");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("documents", "loadError"));
      }
      const data: Resource[] = await res.json();
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common", "error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function handleDelete(resource: Resource) {
    const msg = t("documents", "deleteConfirm").replace("{name}", resource.name);
    if (!window.confirm(msg)) {
      return;
    }

    setDeletingId(resource.id);
    try {
      const res = await fetch(
        `/api/documents?id=${resource.id}&source=${encodeURIComponent(resource.name)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("documents", "deleteError"));
      }
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : t("documents", "deleteError"));
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t("documents", "title")}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("documents", "subtitle")}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            {t("common", "backToChat")}
          </Link>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {t("documents", "loadingList")}
            </span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("documents", "noDocuments")}
            </p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t("documents", "uploadPrompt")}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
              {t("documents", "totalDocuments").replace("{count}", String(resources.length))}
            </div>

            {/* 데스크탑 테이블 */}
            <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      {t("documents", "fileName")}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      {t("documents", "chunkCount")}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      {t("documents", "uploadDate")}
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      {t("documents", "actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 last:border-0 dark:border-gray-700/50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {r.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {r.chunk_count}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={deletingId === r.id}
                          className="rounded px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        >
                          {deletingId === r.id ? t("common", "deleting") : t("common", "delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 */}
            <div className="flex flex-col gap-3 sm:hidden">
              {resources.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                        {r.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t("documents", "chunks").replace("{count}", String(r.chunk_count))} · {formatDate(r.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                      className="ml-3 rounded px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                    >
                      {deletingId === r.id ? t("common", "deleting") : t("common", "delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
