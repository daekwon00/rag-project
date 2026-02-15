import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 대화 조회 + 소유권 확인
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, title, created_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!conversation) {
    return new Response("Not found", { status: 404 });
  }

  // 메시지 조회
  const { data: messages, error } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    return new Response("Internal server error", { status: 500 });
  }

  // KST 시간 포맷
  const exportDate = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // 마크다운 생성
  const lines: string[] = [
    `# ${conversation.title}`,
    "",
    `> 내보내기: ${exportDate} KST`,
    "",
  ];

  if (messages && messages.length > 0) {
    for (const msg of messages) {
      lines.push("---");
      lines.push("");
      const label = msg.role === "user" ? "사용자" : "어시스턴트";
      lines.push(`**${label}**: ${msg.content}`);
      lines.push("");
    }
  }

  const markdown = lines.join("\n");

  // 파일명에서 안전하지 않은 문자 제거
  const safeTitle = conversation.title.replace(/[/\\?%*:|"<>]/g, "_");
  const filename = `${safeTitle}.md`;

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
