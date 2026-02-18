"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { translations } from "@/lib/i18n/translations";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MessageSquare, MessagesSquare, FileText, Layers } from "lucide-react";

interface Stats {
  totalConversations: number;
  totalMessages: number;
  totalDocuments: number;
  totalChunks: number;
  recentActivity: { date: string; count: number }[];
}

const STAT_KEYS = ["totalConversations", "totalMessages", "totalDocuments", "totalChunks"] as const;
const STAT_ICONS = [
  <MessageSquare key="conv" className="h-4 w-4" />,
  <MessagesSquare key="msg" className="h-4 w-4" />,
  <FileText key="doc" className="h-4 w-4" />,
  <Layers key="chunk" className="h-4 w-4" />,
];

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
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {t("dashboard", "title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("dashboard", "subtitle")}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
            <Link href="/">
              {t("common", "backToChat")}
            </Link>
          </Button>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="mb-3 h-8 w-8 rounded" />
                  <Skeleton className="mb-2 h-6 w-16 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {STAT_KEYS.map((key, idx) => (
                <Card key={key}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      {STAT_ICONS[idx]}
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {stats[key].toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("dashboard", key)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 최근 7일 활동 차트 */}
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 text-sm font-semibold text-foreground">
                  {t("dashboard", "recentActivity")}
                </h2>
                <div className="flex items-end gap-2" style={{ height: 160 }}>
                  {stats.recentActivity.map((day) => (
                    <div
                      key={day.date}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <span className="text-xs text-muted-foreground">
                        {day.count}
                      </span>
                      <div className="relative w-full" style={{ height: 120 }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t bg-primary transition-all"
                          style={{
                            height: `${(day.count / maxActivity) * 100}%`,
                            minHeight: day.count > 0 ? 4 : 0,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getDayLabel(day.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}
