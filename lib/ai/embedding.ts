import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { db } from "@/lib/db";
import { computeBM25Scores } from "@/lib/search/bm25";
import { rerankWithLLM } from "@/lib/search/reranker";

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

  // Hybrid search: vector + BM25 with RRF
  const RRF_K = 60;
  const textSearchLimit = 20;

  const [vectorResults, textResults] = await Promise.all([
    db.searchEmbeddings(queryEmbedding, limit * 2),
    db.searchByText(query, textSearchLimit),
  ]);

  // If no text results, fall back to vector-only
  if (textResults.length === 0) {
    return vectorResults.slice(0, limit);
  }

  // Re-rank text results with BM25
  const bm25Scores = computeBM25Scores(
    query,
    textResults.map((r) => r.content)
  );

  // Build rank maps (1-indexed ranks)
  const vectorRankMap = new Map<string, number>();
  vectorResults.forEach((r, i) => {
    vectorRankMap.set(r.content, i + 1);
  });

  const bm25RankMap = new Map<string, number>();
  bm25Scores.forEach((s, i) => {
    const doc = textResults[s.index];
    bm25RankMap.set(doc.content, i + 1);
  });

  // Collect all unique documents
  const allDocs = new Map<
    string,
    { content: string; source: string | null; similarity: number }
  >();

  for (const r of vectorResults) {
    if (!allDocs.has(r.content)) {
      allDocs.set(r.content, {
        content: r.content,
        source: r.source,
        similarity: r.similarity,
      });
    }
  }

  for (const s of bm25Scores) {
    const doc = textResults[s.index];
    if (!allDocs.has(doc.content)) {
      allDocs.set(doc.content, {
        content: doc.content,
        source: doc.source,
        similarity: 0,
      });
    }
  }

  // Compute RRF scores
  const rrfScored = Array.from(allDocs.entries()).map(([content, doc]) => {
    const vectorRank = vectorRankMap.get(content);
    const bm25Rank = bm25RankMap.get(content);

    const vectorScore = vectorRank ? 1 / (RRF_K + vectorRank) : 0;
    const bm25Score = bm25Rank ? 1 / (RRF_K + bm25Rank) : 0;

    return {
      ...doc,
      rrfScore: vectorScore + bm25Score,
    };
  });

  rrfScored.sort((a, b) => b.rrfScore - a.rrfScore);

  const candidates = rrfScored.slice(0, limit).map(({ rrfScore, ...doc }) => doc);

  // Re-ranking: 결과가 3개 이상이면 LLM 기반 재정렬 적용
  if (candidates.length >= 3) {
    return rerankWithLLM(query, candidates, { topK: limit });
  }

  return candidates;
}
