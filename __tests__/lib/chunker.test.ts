import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/chunker";

describe("chunkText", () => {
  it("빈 문자열은 빈 문자열 1개를 반환한다", () => {
    const result = chunkText("");
    expect(result).toEqual([""]);
  });

  it("공백만 있는 문자열은 빈 문자열 1개를 반환한다", () => {
    const result = chunkText("   ");
    expect(result).toEqual([""]);
  });

  it("500자 미만 문자열은 1개 청크를 반환한다", () => {
    const short = "짧은 텍스트입니다.";
    const result = chunkText(short);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(short);
  });

  it("정확히 500자인 문자열은 1개 청크를 반환한다", () => {
    const text = "a".repeat(500);
    const result = chunkText(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it("500자 초과 문자열은 여러 청크로 분할한다", () => {
    const text = "a".repeat(1200);
    const result = chunkText(text);
    expect(result.length).toBeGreaterThan(1);
  });

  it("기본 청크 사이즈는 500, 오버랩은 100이다", () => {
    // 문장 경계가 없는 단순 텍스트로 오버랩 검증
    const text = "abcdefghij".repeat(120); // 1200자
    const result = chunkText(text);

    // 각 청크는 최대 500자
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(500);
    }

    // 오버랩: 인접한 청크의 끝부분과 다음 청크 시작부분이 겹쳐야 함
    if (result.length >= 2) {
      const firstEnd = result[0].slice(-100);
      const secondStart = result[1].slice(0, 100);
      expect(secondStart).toBe(firstEnd);
    }
  });

  it("커스텀 chunkSize와 overlap을 적용할 수 있다", () => {
    const text = "a".repeat(300);
    const result = chunkText(text, 100, 20);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
  });

  it("연속 개행 3개 이상은 2개로 정리한다", () => {
    const text = "앞부분\n\n\n\n\n뒷부분";
    const result = chunkText(text);
    // 정리 후 \n\n만 남아야 함
    expect(result[0]).toBe("앞부분\n\n뒷부분");
  });

  it("문장 경계('. ')에서 청크를 자른다", () => {
    // 문장 경계가 30%~100% 사이에 있을 때 해당 지점에서 자름
    const sentence1 = "가".repeat(250) + ". ";
    const sentence2 = "나".repeat(250) + ". ";
    const sentence3 = "다".repeat(100);
    const text = sentence1 + sentence2 + sentence3;

    const result = chunkText(text);
    // 첫 청크가 정확히 sentence1 경계에서 잘려야 함
    expect(result[0].endsWith(".")).toBe(true);
  });

  it("모든 청크가 빈 문자열이 아니다", () => {
    const text = "테스트 " .repeat(200);
    const result = chunkText(text);
    for (const chunk of result) {
      expect(chunk.length).toBeGreaterThan(0);
    }
  });

  it("전체 청크를 합치면 원본 내용을 커버한다", () => {
    const text = "hello world. ".repeat(100);
    const result = chunkText(text);
    // 첫 청크의 시작은 원본 시작과 같아야 함
    expect(text.trimStart().startsWith(result[0])).toBe(true);
    // 마지막 청크의 끝은 원본 끝과 같아야 함
    expect(text.trimEnd().endsWith(result[result.length - 1])).toBe(true);
  });
});
