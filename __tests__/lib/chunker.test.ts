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

  // ── Heading-based splitting tests ──

  describe("헤딩 기반 분할", () => {
    it("## 헤딩이 있는 텍스트는 헤딩 경계에서 분할한다", () => {
      const text = [
        "## 소개",
        "소개 내용입니다. ".repeat(10),
        "## 본론",
        "본론 내용입니다. ".repeat(10),
        "## 결론",
        "결론 내용입니다. ".repeat(10),
      ].join("\n");

      const result = chunkText(text, 500, 100);
      // Each heading section should be in its own chunk (or merged if small)
      expect(result.length).toBeGreaterThanOrEqual(1);
      // At least one chunk should start with a heading
      const startsWithHeading = result.some((c) => c.startsWith("## "));
      expect(startsWithHeading).toBe(true);
    });

    it("작은 헤딩 섹션들은 하나의 청크로 병합된다", () => {
      const text = [
        "## A",
        "Short A.",
        "## B",
        "Short B.",
        "## C",
        "Short C.",
      ].join("\n");

      const result = chunkText(text, 500, 100);
      // All three short sections fit in one chunk
      expect(result).toHaveLength(1);
      expect(result[0]).toContain("## A");
      expect(result[0]).toContain("## B");
      expect(result[0]).toContain("## C");
    });

    it("큰 헤딩 섹션은 문장 경계로 폴백 분할한다", () => {
      const text = [
        "## 큰 섹션",
        ("긴 내용의 문장입니다. ").repeat(100),
      ].join("\n");

      const result = chunkText(text, 500, 100);
      expect(result.length).toBeGreaterThan(1);
      // First chunk should contain the heading
      expect(result[0]).toContain("## 큰 섹션");
    });

    it("다양한 레벨의 헤딩(#, ##, ###)을 인식한다", () => {
      const text = [
        "# 제목",
        "제목 내용. ".repeat(30),
        "## 부제목",
        "부제목 내용. ".repeat(30),
        "### 소제목",
        "소제목 내용. ".repeat(30),
      ].join("\n");

      const result = chunkText(text, 500, 100);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("헤딩 전의 텍스트도 별도 섹션으로 포함된다", () => {
      const text = [
        "헤딩 전 텍스트입니다. ".repeat(30),
        "## 첫 번째 섹션",
        "섹션 내용입니다. ".repeat(30),
      ].join("\n");

      const result = chunkText(text, 500, 100);
      expect(result.length).toBeGreaterThanOrEqual(2);
      // First chunk should contain the pre-heading text
      expect(result[0]).toContain("헤딩 전 텍스트입니다.");
    });
  });

  // ── Code block preservation tests ──

  describe("코드 블록 보존", () => {
    it("코드 블록 내부에서 분할하지 않는다", () => {
      const codeBlock =
        "```javascript\n" +
        'function hello() {\n  console.log("hello");\n}\n'.repeat(15) +
        "```";
      // codeBlock alone exceeds 500 chars
      const text = "앞 텍스트.\n\n" + codeBlock + "\n\n뒤 텍스트.";

      const result = chunkText(text, 500, 100);
      // The code block should appear in exactly one chunk, intact
      const codeChunks = result.filter((c) => c.includes("```javascript"));
      expect(codeChunks).toHaveLength(1);
      expect(codeChunks[0]).toContain("```javascript");
      expect(codeChunks[0]).toContain("```");
      // It should start with ``` and end with ```
      const codeChunk = codeChunks[0];
      const tripleBacktickCount = (
        codeChunk.match(/```/g) || []
      ).length;
      // Should have both opening and closing ```
      expect(tripleBacktickCount).toBeGreaterThanOrEqual(2);
    });

    it("작은 코드 블록은 주변 텍스트와 같은 청크에 포함된다", () => {
      const text =
        "설명:\n\n```js\nconst x = 1;\n```\n\n끝.";

      const result = chunkText(text, 500, 100);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain("```js");
      expect(result[0]).toContain("const x = 1;");
    });

    it("코드 블록 안의 # 기호는 헤딩으로 인식하지 않는다", () => {
      const text = [
        "## 실제 헤딩",
        "설명입니다. ".repeat(30),
        "```python",
        "# 이것은 파이썬 주석이지 헤딩이 아닙니다",
        "## 이것도 주석입니다",
        "print('hello')",
        "```",
        "## 다음 헤딩",
        "다음 내용. ".repeat(30),
      ].join("\n");

      const result = chunkText(text, 500, 100);
      // The python comments should stay inside a code block chunk
      const chunkWithPython = result.find((c) =>
        c.includes("파이썬 주석")
      );
      expect(chunkWithPython).toBeDefined();
      expect(chunkWithPython).toContain("```python");
    });
  });

  // ── Mixed content tests ──

  describe("혼합 콘텐츠", () => {
    it("헤딩 + 코드 블록 + 일반 텍스트가 올바르게 분할된다", () => {
      const text = [
        "## 개요",
        "프로젝트 설명입니다.",
        "",
        "## 설치 방법",
        "다음 명령어를 실행하세요:",
        "```bash",
        "npm install",
        "npm run build",
        "```",
        "",
        "## 사용법",
        "사용 방법을 설명합니다. ".repeat(40),
      ].join("\n");

      const result = chunkText(text, 500, 100);
      expect(result.length).toBeGreaterThanOrEqual(2);

      // Code block should be intact in some chunk
      const hasIntactCodeBlock = result.some(
        (c) => c.includes("```bash") && c.includes("npm run build") && c.includes("```")
      );
      expect(hasIntactCodeBlock).toBe(true);
    });

    it("헤딩 없는 텍스트에 코드 블록이 있어도 코드 블록은 보존된다", () => {
      const codeBlock =
        "```\n" + "line of code\n".repeat(50) + "```";
      const text =
        "앞부분 텍스트. ".repeat(20) +
        "\n" +
        codeBlock +
        "\n" +
        "뒷부분 텍스트. ".repeat(20);

      const result = chunkText(text, 500, 100);
      const codeChunks = result.filter(
        (c) => c.includes("line of code")
      );
      // All code lines should be in the same chunk
      expect(codeChunks).toHaveLength(1);
    });

    it("여러 코드 블록이 각각 보존된다", () => {
      const text = [
        "## Part 1",
        "텍스트. ".repeat(5),
        "```js",
        "const a = 1;",
        "```",
        "## Part 2",
        "텍스트. ".repeat(5),
        "```python",
        "b = 2",
        "```",
      ].join("\n");

      const result = chunkText(text, 500, 100);
      const allText = result.join(" ");
      expect(allText).toContain("```js");
      expect(allText).toContain("const a = 1;");
      expect(allText).toContain("```python");
      expect(allText).toContain("b = 2");
    });

    it("헤딩 없이 긴 텍스트는 기존 문장 경계 방식으로 분할한다", () => {
      // Plain text without headings → fallback to sentence-boundary
      const text = "반복되는 문장입니다. ".repeat(100);
      const result = chunkText(text);
      expect(result.length).toBeGreaterThan(1);
      for (const chunk of result) {
        expect(chunk.length).toBeLessThanOrEqual(500);
      }
    });
  });
});
