import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "mock-model"),
}));

import { generateText } from "ai";
import { rerankWithLLM } from "@/lib/search/reranker";

const mockGenerateText = vi.mocked(generateText);

const docs = [
  { content: "문서A: 인공지능 개요", source: "ai.pdf", similarity: 0.9 },
  { content: "문서B: 웹 개발 가이드", source: "web.pdf", similarity: 0.85 },
  { content: "문서C: 머신러닝 기초", source: "ml.pdf", similarity: 0.8 },
  { content: "문서D: 데이터베이스 설계", source: "db.pdf", similarity: 0.75 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("rerankWithLLM", () => {
  it("LLM 점수 기반으로 문서를 재정렬한다", async () => {
    mockGenerateText.mockResolvedValue({
      text: '[{"index": 0, "score": 5}, {"index": 1, "score": 2}, {"index": 2, "score": 9}, {"index": 3, "score": 7}]',
    } as any);

    const result = await rerankWithLLM("머신러닝이란?", docs);

    expect(result).toHaveLength(4);
    // 점수 순: C(9) > D(7) > A(5) > B(2)
    expect(result[0].content).toBe("문서C: 머신러닝 기초");
    expect(result[1].content).toBe("문서D: 데이터베이스 설계");
    expect(result[2].content).toBe("문서A: 인공지능 개요");
    expect(result[3].content).toBe("문서B: 웹 개발 가이드");
  });

  it("topK 옵션으로 반환 개수를 제한한다", async () => {
    mockGenerateText.mockResolvedValue({
      text: '[{"index": 0, "score": 5}, {"index": 1, "score": 2}, {"index": 2, "score": 9}, {"index": 3, "score": 7}]',
    } as any);

    const result = await rerankWithLLM("질문", docs, { topK: 2 });

    expect(result).toHaveLength(2);
    expect(result[0].content).toBe("문서C: 머신러닝 기초");
    expect(result[1].content).toBe("문서D: 데이터베이스 설계");
  });

  it("문서가 2개 이하면 재정렬 없이 반환한다", async () => {
    const twoDocs = docs.slice(0, 2);
    const result = await rerankWithLLM("질문", twoDocs);

    expect(mockGenerateText).not.toHaveBeenCalled();
    expect(result).toEqual(twoDocs);
  });

  it("문서가 0개면 빈 배열을 반환한다", async () => {
    const result = await rerankWithLLM("질문", []);

    expect(mockGenerateText).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("API 에러 시 원본 순서를 유지한다", async () => {
    mockGenerateText.mockRejectedValue(new Error("API error"));

    const result = await rerankWithLLM("질문", docs);

    expect(result).toHaveLength(4);
    expect(result[0].content).toBe("문서A: 인공지능 개요");
    expect(result[1].content).toBe("문서B: 웹 개발 가이드");
  });

  it("JSON 파싱 실패 시 원본 순서를 유지한다", async () => {
    mockGenerateText.mockResolvedValue({
      text: "이것은 JSON이 아닙니다",
    } as any);

    const result = await rerankWithLLM("질문", docs);

    expect(result).toHaveLength(4);
    expect(result[0].content).toBe("문서A: 인공지능 개요");
  });

  it("generateText에 올바른 파라미터를 전달한다", async () => {
    mockGenerateText.mockResolvedValue({
      text: '[{"index": 0, "score": 5}, {"index": 1, "score": 5}, {"index": 2, "score": 5}]',
    } as any);

    await rerankWithLLM("테스트 질문", docs.slice(0, 3));

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const call = mockGenerateText.mock.calls[0][0];
    expect(call.prompt).toContain("테스트 질문");
    expect(call.prompt).toContain("문서A: 인공지능 개요");
    expect(call.abortSignal).toBeDefined();
  });

  it("source가 null인 문서도 처리한다", async () => {
    const docsWithNull = [
      { content: "문서1", source: null, similarity: 0.9 },
      { content: "문서2", source: null, similarity: 0.8 },
      { content: "문서3", source: "file.pdf", similarity: 0.7 },
    ];

    mockGenerateText.mockResolvedValue({
      text: '[{"index": 0, "score": 3}, {"index": 1, "score": 8}, {"index": 2, "score": 5}]',
    } as any);

    const result = await rerankWithLLM("질문", docsWithNull);

    expect(result[0].content).toBe("문서2");
    expect(result[0].source).toBeNull();
  });
});
