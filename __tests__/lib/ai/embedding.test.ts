import { describe, it, expect, vi, beforeEach } from "vitest";

// 모킹 설정
vi.mock("ai", () => ({
  embed: vi.fn(),
  embedMany: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: {
    embedding: vi.fn(() => "mock-embedding-model"),
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    searchEmbeddings: vi.fn(),
    searchByText: vi.fn(),
    insertEmbeddings: vi.fn(),
  },
}));

vi.mock("@/lib/search/reranker", () => ({
  rerankWithLLM: vi.fn(),
}));

import { embed } from "ai";
import { db } from "@/lib/db";
import { rerankWithLLM } from "@/lib/search/reranker";
import {
  generateEmbedding,
  findRelevantContent,
} from "@/lib/ai/embedding";

const mockEmbed = vi.mocked(embed);
const mockSearchEmbeddings = vi.mocked(db.searchEmbeddings);
const mockSearchByText = vi.mocked(db.searchByText);
const mockRerank = vi.mocked(rerankWithLLM);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: searchByText returns empty (falls back to vector-only)
  mockSearchByText.mockResolvedValue([]);
});

describe("generateEmbedding", () => {
  it("embed 함수를 호출하고 임베딩 벡터를 반환한다", async () => {
    const fakeEmbedding = [0.1, 0.2, 0.3];
    mockEmbed.mockResolvedValue({
      embedding: fakeEmbedding,
      value: "test",
      usage: { tokens: 5 },
    } as any);

    const result = await generateEmbedding("테스트 텍스트");
    expect(mockEmbed).toHaveBeenCalledWith({
      model: "mock-embedding-model",
      value: "테스트 텍스트",
    });
    expect(result).toEqual(fakeEmbedding);
  });
});

describe("findRelevantContent", () => {
  const fakeEmbedding = [0.1, 0.2, 0.3];
  const fakeResults = [
    { id: 1, content: "문서1", source: "file1.pdf", similarity: 0.9 },
    { id: 2, content: "문서2", source: "file2.pdf", similarity: 0.8 },
  ];

  beforeEach(() => {
    mockEmbed.mockResolvedValue({
      embedding: fakeEmbedding,
      value: "test",
      usage: { tokens: 5 },
    } as any);
    mockSearchEmbeddings.mockResolvedValue(fakeResults);
  });

  it("두 번째 인자가 number일 때 limit으로 사용한다", async () => {
    await findRelevantContent("검색어", 3);
    // Hybrid search fetches limit*2 from vector search
    expect(mockSearchEmbeddings).toHaveBeenCalledWith(fakeEmbedding, 6);
  });

  it("두 번째 인자가 object일 때 limit을 추출한다", async () => {
    await findRelevantContent("검색어", { limit: 10 });
    expect(mockSearchEmbeddings).toHaveBeenCalledWith(fakeEmbedding, 20);
  });

  it("limit이 없으면 기본값 5를 사용한다", async () => {
    await findRelevantContent("검색어");
    expect(mockSearchEmbeddings).toHaveBeenCalledWith(fakeEmbedding, 10);
  });

  it("context 없으면 원본 query로 임베딩한다", async () => {
    await findRelevantContent("원본 질문");
    expect(mockEmbed).toHaveBeenCalledWith({
      model: "mock-embedding-model",
      value: "원본 질문",
    });
  });

  it("context가 있으면 augmented query로 임베딩한다", async () => {
    await findRelevantContent("현재 질문", {
      context: ["이전 질문1", "이전 질문2"],
    });
    expect(mockEmbed).toHaveBeenCalledWith({
      model: "mock-embedding-model",
      value: "이전 맥락: 이전 질문1 | 이전 질문2 | 현재 질문: 현재 질문",
    });
  });

  it("context가 빈 배열이면 원본 query를 사용한다", async () => {
    await findRelevantContent("질문", { context: [] });
    expect(mockEmbed).toHaveBeenCalledWith({
      model: "mock-embedding-model",
      value: "질문",
    });
  });

  it("검색 결과를 반환한다", async () => {
    const result = await findRelevantContent("검색어");
    expect(result).toEqual(fakeResults);
  });

  it("하이브리드 검색 결과가 3개 이상이면 re-ranking을 적용한다", async () => {
    const threeResults = [
      { id: 1, content: "문서1", source: "f1.pdf", similarity: 0.9 },
      { id: 2, content: "문서2", source: "f2.pdf", similarity: 0.85 },
      { id: 3, content: "문서3", source: "f3.pdf", similarity: 0.8 },
    ];
    mockSearchEmbeddings.mockResolvedValue(threeResults);
    mockSearchByText.mockResolvedValue([
      { id: 1, content: "문서1", source: "f1.pdf" },
      { id: 2, content: "문서2", source: "f2.pdf" },
      { id: 3, content: "문서3", source: "f3.pdf" },
    ]);

    const reranked = [
      { content: "문서3", source: "f3.pdf", similarity: 0.8 },
      { content: "문서1", source: "f1.pdf", similarity: 0.9 },
      { content: "문서2", source: "f2.pdf", similarity: 0.85 },
    ];
    mockRerank.mockResolvedValue(reranked);

    const result = await findRelevantContent("검색어");

    expect(mockRerank).toHaveBeenCalledTimes(1);
    expect(mockRerank).toHaveBeenCalledWith(
      "검색어",
      expect.any(Array),
      { topK: 5 }
    );
    expect(result).toEqual(reranked);
  });

  it("하이브리드 검색 결과가 2개 이하면 re-ranking을 건너뛴다", async () => {
    // Default: searchByText returns empty, vector returns 2 docs → vector-only path
    const result = await findRelevantContent("검색어");
    expect(mockRerank).not.toHaveBeenCalled();
    expect(result).toEqual(fakeResults);
  });
});
