import { createSupabaseServer } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // conversations & messages via RLS (user-scoped)
    const [convResult, msgResult, docCount, chunkCount] = await Promise.all([
      supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("messages")
        .select("*, conversations!inner(user_id)", {
          count: "exact",
          head: true,
        })
        .eq("conversations.user_id", user.id),
      db.getResourceCount(),
      db.getEmbeddingCount(),
    ]);

    if (convResult.error) throw convResult.error;
    if (msgResult.error) throw msgResult.error;

    // Recent 7 days activity: daily message count for the user
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get user's conversation IDs first
    const { data: userConvs, error: convListError } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id);

    if (convListError) throw convListError;

    const convIds = (userConvs ?? []).map((c: { id: string }) => c.id);

    let recentMessages: { created_at: string }[] = [];
    if (convIds.length > 0) {
      const { data, error } = await supabase
        .from("messages")
        .select("created_at")
        .in("conversation_id", convIds)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      recentMessages = data ?? [];
    }

    // Build daily counts for the last 7 days
    const recentActivity: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      recentActivity.push({ date: dateStr, count: 0 });
    }

    for (const msg of recentMessages) {
      const dateStr = msg.created_at.slice(0, 10);
      const entry = recentActivity.find((a) => a.date === dateStr);
      if (entry) entry.count++;
    }

    return NextResponse.json({
      totalConversations: convResult.count ?? 0,
      totalMessages: msgResult.count ?? 0,
      totalDocuments: docCount,
      totalChunks: chunkCount,
      recentActivity,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "통계 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
