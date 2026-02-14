import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunker";
import { generateEmbeddings } from "@/lib/ai/embedding";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;
    const source = formData.get("source") as string | null;

    let content: string;

    if (file) {
      // PDF 파일 처리
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const pdfParse = (await import("pdf-parse")).default;
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdfParse(buffer);
        content = pdfData.text;
      } else {
        // 텍스트 파일
        content = await file.text();
      }
    } else if (text) {
      content = text;
    } else {
      return NextResponse.json(
        { error: "file 또는 text가 필요합니다." },
        { status: 400 }
      );
    }

    const sourceName = source ?? file?.name ?? "직접 입력";

    // 1. 문서 청킹
    const chunks = chunkText(content);

    // 2. 임베딩 생성 + DB 저장
    const result = await generateEmbeddings(chunks, sourceName);

    // 3. 리소스 메타 저장
    await db.insertResource({ name: sourceName, content, chunkCount: chunks.length });

    return NextResponse.json({
      message: "문서 수집 완료",
      source: sourceName,
      chunks: chunks.length,
      embeddings: result.length,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Ingest error:", errMsg, error);
    return NextResponse.json(
      { error: `문서 수집 중 오류: ${errMsg}` },
      { status: 500 }
    );
  }
}
