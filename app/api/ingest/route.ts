import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunker";
import { generateEmbeddings } from "@/lib/ai/embedding";
import { db } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ingestLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = await checkRateLimit(ingestLimiter, user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;
    const source = formData.get("source") as string | null;

    if (file && file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    let content: string;

    const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".txt", ".md"];

    if (file) {
      const fileName = file.name.toLowerCase();
      const hasValidExtension = SUPPORTED_EXTENSIONS.some((ext) =>
        fileName.endsWith(ext)
      );

      if (!hasValidExtension) {
        return NextResponse.json(
          { error: "지원하는 파일 형식: PDF, DOCX, PPTX, TXT, MD" },
          { status: 400 }
        );
      }

      // PDF 파일 처리
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const pdfParse = (await import("pdf-parse")).default;
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdfParse(buffer);
        content = pdfData.text;
      } else if (
        file.name.endsWith(".docx") ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        // DOCX 파일 처리
        const mammoth = (await import("mammoth")).default;
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
      } else if (
        file.name.endsWith(".pptx") ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) {
        // PPTX 파일 처리
        const { parseOffice } = await import("officeparser");
        const buffer = Buffer.from(await file.arrayBuffer());
        content = await parseOffice(buffer);
      } else {
        // 텍스트 파일 (TXT, MD)
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
