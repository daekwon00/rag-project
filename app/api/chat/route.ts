import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { findRelevantContent } from "@/lib/ai/embedding";
import { createSupabaseServer } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages 배열이 필요합니다.", { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage?.content || typeof lastMessage.content !== "string") {
    return new Response("유효한 메시지 content가 필요합니다.", { status: 400 });
  }

  const userQuery = lastMessage.content;

  // 벡터 검색으로 관련 문서 조각 찾기
  const relevantDocs = await findRelevantContent(userQuery);
  console.log(`[RAG] query: "${userQuery}", found: ${relevantDocs.length} docs`);
  relevantDocs.forEach((doc, i) =>
    console.log(`  [${i}] similarity: ${doc.similarity.toFixed(4)}, source: ${doc.source}, content: ${doc.content.slice(0, 80)}...`)
  );

  const contextText = relevantDocs
    .map(
      (doc, i) =>
        `[출처 ${i + 1}] ${doc.source ?? "unknown"}\n${doc.content}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `당신은 업로드된 문서를 기반으로 질문에 답변하는 AI 어시스턴트입니다.
아래 문서 조각들을 참고하여 질문에 답변하세요.
답변 시 관련 출처를 [출처 N] 형태로 표시하세요.
문서 조각이 제공되었다면 그 내용을 기반으로 최대한 답변하세요.
문서 조각이 하나도 없는 경우에만 "관련 문서에서 해당 정보를 찾을 수 없습니다."라고 답하세요.

--- 참고 문서 ---
${contextText || "업로드된 문서가 없습니다."}
--- 참고 문서 끝 ---`;

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
