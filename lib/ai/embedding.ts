import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { db } from "@/lib/db";

const embeddingModel = openai.embedding("text-embedding-3-small");

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

export async function generateEmbeddings(
  chunks: string[],
  source: string
): Promise<{ content: string; embedding: number[] }[]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks.map((chunk) => `[출처: ${source}]\n${chunk}`),
  });

  const results = embeddings.map((embedding, i) => ({
    content: chunks[i],
    embedding,
    source,
  }));

  // DB에 임베딩 저장
  await db.insertEmbeddings(results);

  return results;
}

export async function findRelevantContent(
  query: string,
  options?: number | { context?: string[]; limit?: number }
): Promise<{ content: string; source: string | null; similarity: number }[]> {
  // 하위호환: 두 번째 인자가 number이면 limit으로 처리
  const limit =
    typeof options === "number"
      ? options
      : options?.limit ?? 5;
  const context =
    typeof options === "object" && options?.context
      ? options.context
      : undefined;

  // 대화 맥락이 있으면 결합 쿼리 생성
  const augmentedQuery = context?.length
    ? `이전 맥락: ${context.join(" | ")} | 현재 질문: ${query}`
    : query;

  const queryEmbedding = await generateEmbedding(augmentedQuery);
  return db.searchEmbeddings(queryEmbedding, limit);
}
