import { describe, it, expect } from "vitest";
import { tokenize, computeBM25Scores } from "@/lib/search/bm25";

describe("tokenize", () => {
  it("영어 텍스트를 소문자 토큰으로 분리한다", () => {
    const result = tokenize("Hello World Test");
    expect(result).toEqual(["hello", "world", "test"]);
  });

  it("한국어 텍스트를 공백 기준으로 분리한다", () => {
    const result = tokenize("인공지능 기반 검색 시스템");
    expect(result).toEqual(["인공지능", "기반", "검색", "시스템"]);
  });

  it("한영 혼합 텍스트를 처리한다", () => {
    const result = tokenize("AI 기반 RAG 시스템");
    expect(result).toEqual(["ai", "기반", "rag", "시스템"]);
  });

  it("특수문자를 제거한다", () => {
    const result = tokenize("hello, world! test@#$%");
    expect(result).toEqual(["hello", "world", "test"]);
  });

  it("빈 문자열은 빈 배열을 반환한다", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("공백만 있는 문자열은 빈 배열을 반환한다", () => {
    expect(tokenize("   ")).toEqual([]);
  });

  it("숫자를 포함한 토큰을 유지한다", () => {
    const result = tokenize("GPT4 모델 version2");
    expect(result).toEqual(["gpt4", "모델", "version2"]);
  });
});

describe("computeBM25Scores", () => {
  const documents = [
    "인공지능 기반 문서 검색 시스템",
    "머신러닝과 딥러닝의 차이점",
    "자연어 처리 기반 검색 엔진 개발",
    "웹 프론트엔드 개발 가이드",
  ];

  it("관련 문서에 더 높은 점수를 부여한다", () => {
    const results = computeBM25Scores("검색 시스템", documents);
    expect(results.length).toBeGreaterThan(0);

    // "검색 시스템"은 첫 번째/세 번째 문서와 관련
    const topIndices = results.slice(0, 2).map((r) => r.index);
    expect(topIndices).toContain(0); // "인공지능 기반 문서 검색 시스템"
  });

  it("결과를 점수 내림차순으로 정렬한다", () => {
    const results = computeBM25Scores("기반 검색", documents);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("빈 쿼리는 빈 결과를 반환한다", () => {
    const results = computeBM25Scores("", documents);
    expect(results).toEqual([]);
  });

  it("빈 문서 배열은 빈 결과를 반환한다", () => {
    const results = computeBM25Scores("검색", []);
    expect(results).toEqual([]);
  });

  it("매치되지 않는 쿼리는 빈 결과를 반환한다", () => {
    const results = computeBM25Scores("xyz123없는단어", documents);
    expect(results).toEqual([]);
  });

  it("모든 점수가 양수이다", () => {
    const results = computeBM25Scores("검색 시스템 개발", documents);
    for (const r of results) {
      expect(r.score).toBeGreaterThan(0);
    }
  });

  it("점수가 0인 문서는 결과에 포함하지 않는다", () => {
    const results = computeBM25Scores("검색", documents);
    // "머신러닝과 딥러닝의 차이점"과 "웹 프론트엔드 개발 가이드"는 "검색"을 포함하지 않음
    const indices = results.map((r) => r.index);
    expect(indices).not.toContain(1);
  });

  it("영어 쿼리도 정상 동작한다", () => {
    const englishDocs = [
      "machine learning for search",
      "web development guide",
      "search engine optimization",
    ];
    const results = computeBM25Scores("search engine", englishDocs);
    expect(results.length).toBeGreaterThan(0);
    // "search engine optimization"이 가장 높은 점수
    expect(results[0].index).toBe(2);
  });

  it("커스텀 k1, b 파라미터를 적용한다", () => {
    const results1 = computeBM25Scores("검색", documents, { k1: 1.5, b: 0.75 });
    const results2 = computeBM25Scores("검색", documents, { k1: 2.0, b: 0.5 });
    // 같은 문서가 매치되지만 점수가 다를 수 있음
    expect(results1.length).toBe(results2.length);
    expect(results1.map((r) => r.index).sort()).toEqual(
      results2.map((r) => r.index).sort()
    );
  });

  it("단일 문서에서도 동작한다", () => {
    const results = computeBM25Scores("검색", ["검색 엔진"]);
    expect(results).toHaveLength(1);
    expect(results[0].index).toBe(0);
    expect(results[0].score).toBeGreaterThan(0);
  });
});
