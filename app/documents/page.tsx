"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, FileText, Trash2, Upload } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {t("documents", "title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("documents", "subtitle")}
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("common", "backToChat")}
            </Link>
          </Button>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : resources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-8">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("documents", "noDocuments")}
              </p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/">
                  <Upload className="mr-1 h-4 w-4" />
                  {t("documents", "uploadPrompt")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-3 text-sm text-muted-foreground">
              {t("documents", "totalDocuments").replace("{count}", String(resources.length))}
            </div>

            {/* 데스크탑 테이블 */}
            <Card className="hidden sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      {t("documents", "fileName")}
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      {t("documents", "chunkCount")}
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      {t("documents", "uploadDate")}
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      {t("documents", "actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {r.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{r.chunk_count}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === r.id}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              {deletingId === r.id ? t("common", "deleting") : t("common", "delete")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("common", "delete")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("documents", "deleteConfirm").replace("{name}", r.name)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{"취소"}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(r)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t("common", "delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* 모바일 카드 */}
            <div className="flex flex-col gap-3 sm:hidden">
              {resources.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex items-start justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="truncate font-medium text-foreground">
                          {r.name}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="mr-1">{r.chunk_count}</Badge>
                        {formatDate(r.created_at)}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === r.id}
                          className="ml-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("common", "delete")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("documents", "deleteConfirm").replace("{name}", r.name)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{"취소"}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(r)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("common", "delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
