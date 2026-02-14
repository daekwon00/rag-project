import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { findRelevantContent } from "@/lib/ai/embedding";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage.content;

  // 벡터 검색으로 관련 문서 조각 찾기
  const relevantDocs = await findRelevantContent(userQuery);

  const contextText = relevantDocs
    .map(
      (doc, i) =>
        `[출처 ${i + 1}] ${doc.source ?? "unknown"}\n${doc.content}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `당신은 업로드된 문서를 기반으로 질문에 답변하는 AI 어시스턴트입니다.
아래 문서 조각들을 참고하여 질문에 답변하세요.
답변 시 관련 출처를 [출처 N] 형태로 표시하세요.
문서에 관련 정보가 없으면 "관련 문서에서 해당 정보를 찾을 수 없습니다."라고 답하세요.

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
