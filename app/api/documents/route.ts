import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resources = await db.listResources();
    return NextResponse.json(resources);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("List documents error:", errMsg);
    return NextResponse.json(
      { error: `문서 목록 조회 중 오류: ${errMsg}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const source = searchParams.get("source");

    if (!id || !source) {
      return NextResponse.json(
        { error: "id와 source 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    await db.deleteEmbeddingsBySource(source);
    await db.deleteResource(Number(id));

    return NextResponse.json({ message: "문서가 삭제되었습니다." });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Delete document error:", errMsg);
    return NextResponse.json(
      { error: `문서 삭제 중 오류: ${errMsg}` },
      { status: 500 }
    );
  }
}
