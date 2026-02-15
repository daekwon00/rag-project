import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

interface RankedDocument {
  content: string;
  source: string | null;
  similarity: number;
}

interface RerankOptions {
  model?: string;
  topK?: number;
}

/**
 * LLM 기반 re-ranking: query와 각 문서의 관련성을 GPT-4o-mini로 평가하여 재정렬
 * 에러/타임아웃 시 원본 순서 그대로 반환 (graceful degradation)
 */
export async function rerankWithLLM(
  query: string,
  documents: RankedDocument[],
  options?: RerankOptions
): Promise<RankedDocument[]> {
  const topK = options?.topK ?? documents.length;
  const modelName = options?.model ?? "gpt-4o-mini";

  // 문서가 2개 이하면 재정렬 불필요
  if (documents.length <= 2) {
    return documents.slice(0, topK);
  }

  try {
    const documentList = documents
      .map(
        (doc, i) =>
          `[문서 ${i}] (출처: ${doc.source ?? "unknown"})\n${doc.content}`
      )
      .join("\n\n");

    const prompt = `사용자 질문과 각 문서의 관련성을 0-10 점수로 평가하세요.

사용자 질문: ${query}

${documentList}

위 문서들의 관련성 점수를 JSON 배열로 반환하세요. 각 항목은 {"index": 문서번호, "score": 점수} 형태입니다.
반드시 아래 형식의 JSON 배열만 출력하세요. 다른 텍스트는 포함하지 마세요.
[{"index": 0, "score": 7}, {"index": 1, "score": 3}, ...]`;

    const { text } = await generateText({
      model: openai(modelName),
      prompt,
      abortSignal: AbortSignal.timeout(5000),
    });

    // JSON 파싱 - 응답에서 JSON 배열 추출
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return documents.slice(0, topK);
    }

    const scores: { index: number; score: number }[] = JSON.parse(
      jsonMatch[0]
    );

    // 점수 맵 생성
    const scoreMap = new Map<number, number>();
    for (const item of scores) {
      if (
        typeof item.index === "number" &&
        typeof item.score === "number" &&
        item.index >= 0 &&
        item.index < documents.length
      ) {
        scoreMap.set(item.index, item.score);
      }
    }

    // 점수 기반 정렬 (점수 없는 문서는 최하위)
    const reranked = documents
      .map((doc, i) => ({ doc, score: scoreMap.get(i) ?? -1 }))
      .sort((a, b) => b.score - a.score)
      .map(({ doc }) => doc);

    return reranked.slice(0, topK);
  } catch {
    // 타임아웃/에러 시 원본 순서 유지
    return documents.slice(0, topK);
  }
}
