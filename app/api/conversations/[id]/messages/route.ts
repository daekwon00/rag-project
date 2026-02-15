import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET: 특정 대화의 메시지 목록
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 대화 소유권 확인 (RLS가 처리하지만 명시적으로도 체크)
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: 메시지 저장
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 대화 소유권 확인
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { role, content } = body;

  // role/content 검증
  if (!role || !["user", "assistant"].includes(role)) {
    return NextResponse.json({ error: "role은 'user' 또는 'assistant'여야 합니다." }, { status: 400 });
  }
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content는 비어있지 않은 문자열이어야 합니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.id,
      role,
      content,
    })
    .select("id, role, content, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 대화 updated_at 갱신
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", params.id);

  return NextResponse.json(data);
}
