"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { translations } from "@/lib/i18n/translations";

interface Stats {
  totalConversations: number;
  totalMessages: number;
  totalDocuments: number;
  totalChunks: number;
  recentActivity: { date: string; count: number }[];
}

const STAT_KEYS = ["totalConversations", "totalMessages", "totalDocuments", "totalChunks"] as const;
const STAT_ICONS = ["#", ">", "D", "%"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, lang } = useTranslation();

  useEffect(() => {
    async function fetchStats() {
      try {
        setError(null);
        const res = await fetch("/api/stats");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t("dashboard", "loadError"));
        }
        const data: Stats = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("common", "error"));
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const maxActivity = stats
    ? Math.max(...stats.recentActivity.map((a) => a.count), 1)
    : 1;

  function getDayLabel(dateStr: string) {
    return translations[lang].dashboard.days[new Date(dateStr).getDay()];
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t("dashboard", "title")}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("dashboard", "subtitle")}
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-3 h-8 w-8 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mb-2 h-6 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {STAT_KEYS.map((key, idx) => (
                <div
                  key={key}
                  className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {STAT_ICONS[idx]}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats[key].toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t("dashboard", key)}
                  </p>
                </div>
              ))}
            </div>

            {/* 최근 7일 활동 차트 */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("dashboard", "recentActivity")}
              </h2>
              <div className="flex items-end gap-2" style={{ height: 160 }}>
                {stats.recentActivity.map((day) => (
                  <div
                    key={day.date}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {day.count}
                    </span>
                    <div className="relative w-full" style={{ height: 120 }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t bg-blue-500 transition-all dark:bg-blue-400"
                        style={{
                          height: `${(day.count / maxActivity) * 100}%`,
                          minHeight: day.count > 0 ? 4 : 0,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {getDayLabel(day.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
