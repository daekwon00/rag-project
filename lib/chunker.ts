const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP = 100;

/**
 * Find all code block ranges (``` ... ```) in the text.
 */
function findCodeBlockRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  const regex = /```[\s\S]*?```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function isInsideCodeBlock(pos: number, ranges: [number, number][]): boolean {
  return ranges.some(([start, end]) => pos >= start && pos < end);
}

/**
 * Split text by markdown headings, respecting code blocks.
 * Headings inside code blocks are ignored.
 */
function splitByHeadings(text: string): string[] {
  const codeBlockRanges = findCodeBlockRanges(text);

  const headingRegex = /^#{1,6}\s/gm;
  const splitPositions: number[] = [];
  let match;
  while ((match = headingRegex.exec(text)) !== null) {
    if (!isInsideCodeBlock(match.index, codeBlockRanges)) {
      splitPositions.push(match.index);
    }
  }

  if (splitPositions.length === 0) {
    return [text];
  }

  const sections: string[] = [];

  // Content before first heading
  if (splitPositions[0] > 0) {
    const pre = text.slice(0, splitPositions[0]).trim();
    if (pre.length > 0) {
      sections.push(pre);
    }
  }

  for (let i = 0; i < splitPositions.length; i++) {
    const start = splitPositions[i];
    const end =
      i + 1 < splitPositions.length ? splitPositions[i + 1] : text.length;
    const section = text.slice(start, end).trim();
    if (section.length > 0) {
      sections.push(section);
    }
  }

  return sections;
}

/**
 * Original sentence-boundary chunking logic.
 */
function sentenceBoundaryChunk(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    const slice = text.slice(start, end);
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

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start = end - overlap;
  }

  return chunks;
}

/**
 * Chunk a section that may contain code blocks.
 * Code blocks are kept intact; surrounding text uses sentence-boundary chunking.
 */
function chunkWithCodeBlockProtection(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
  const codeBlockRegex = /```[\s\S]*?```/g;
  if (!codeBlockRegex.test(text)) {
    return sentenceBoundaryChunk(text, chunkSize, overlap);
  }

  // Split into alternating text / code-block segments
  const segments: { content: string; isCode: boolean }[] = [];
  let lastIndex = 0;

  codeBlockRegex.lastIndex = 0;
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        content: text.slice(lastIndex, match.index),
        isCode: false,
      });
    }
    segments.push({ content: match[0], isCode: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ content: text.slice(lastIndex), isCode: false });
  }

  const chunks: string[] = [];
  let buffer = "";

  for (const seg of segments) {
    if (seg.isCode) {
      const combined =
        buffer.length > 0 ? buffer + seg.content : seg.content;
      if (combined.length <= chunkSize) {
        buffer = combined;
      } else {
        // Flush text buffer first
        if (buffer.trim().length > 0) {
          if (buffer.length <= chunkSize) {
            chunks.push(buffer.trim());
          } else {
            chunks.push(
              ...sentenceBoundaryChunk(buffer.trim(), chunkSize, overlap)
            );
          }
        }
        // Code block as its own chunk (even if > chunkSize — never split)
        chunks.push(seg.content.trim());
        buffer = "";
      }
    } else {
      buffer += seg.content;
    }
  }

  if (buffer.trim().length > 0) {
    if (buffer.length <= chunkSize) {
      chunks.push(buffer.trim());
    } else {
      chunks.push(
        ...sentenceBoundaryChunk(buffer.trim(), chunkSize, overlap)
      );
    }
  }

  return chunks;
}

/**
 * 텍스트를 청크로 분할
 * - 마크다운 헤딩 기반 우선 분할
 * - 코드 블록 보존 (``` 내부를 분할하지 않음)
 * - 크기 초과 시 문장 단위 분할 폴백
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

  // Split by markdown headings (respecting code blocks)
  const sections = splitByHeadings(cleanedText);

  // No heading splits → sentence-boundary with code block protection
  if (sections.length <= 1) {
    return chunkWithCodeBlockProtection(cleanedText, chunkSize, overlap);
  }

  // Heading-based: merge small sections, split large ones
  const chunks: string[] = [];
  let buffer = "";

  for (const section of sections) {
    if (buffer.length === 0) {
      buffer = section;
    } else if ((buffer + "\n\n" + section).length <= chunkSize) {
      buffer = buffer + "\n\n" + section;
    } else {
      // Flush buffer
      if (buffer.length <= chunkSize) {
        chunks.push(buffer);
      } else {
        chunks.push(
          ...chunkWithCodeBlockProtection(buffer, chunkSize, overlap)
        );
      }
      buffer = section;
    }
  }

  // Flush remaining buffer
  if (buffer.length > 0) {
    if (buffer.length <= chunkSize) {
      chunks.push(buffer);
    } else {
      chunks.push(
        ...chunkWithCodeBlockProtection(buffer, chunkSize, overlap)
      );
    }
  }

  return chunks.length > 0 ? chunks : [cleanedText];
}
