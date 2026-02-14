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
  limit: number = 5
): Promise<{ content: string; source: string | null; similarity: number }[]> {
  const queryEmbedding = await generateEmbedding(query);
  return db.searchEmbeddings(queryEmbedding, limit);
}
