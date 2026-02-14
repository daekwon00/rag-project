const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP = 100;

/**
 * 텍스트를 청크로 분할
 * - 문단 단위 우선 분할 → 크기 초과 시 문장 단위 분할
 */
export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP
): string[] {
  const cleanedText = text.replace(/\n{3,}/g, "\n\n").trim();

  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleanedText.length) {
    let end = start + chunkSize;

    if (end >= cleanedText.length) {
      chunks.push(cleanedText.slice(start).trim());
      break;
    }

    // 문장 경계에서 자르기 시도
    const slice = cleanedText.slice(start, end);
    const lastPeriod = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf(".\n"),
      slice.lastIndexOf("다. "),
      slice.lastIndexOf("다.\n"),
      slice.lastIndexOf("\n\n")
    );

    if (lastPeriod > chunkSize * 0.3) {
      end = start + lastPeriod + 1;
    }

    const chunk = cleanedText.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start = end - overlap;
  }

  return chunks;
}
