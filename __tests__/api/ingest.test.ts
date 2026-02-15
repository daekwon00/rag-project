import { describe, it, expect, vi, beforeEach } from "vitest";

// 모킹 설정
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServer: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    })
  ),
}));

vi.mock("@/lib/rate-limit", () => ({
  ingestLimiter: null,
  checkRateLimit: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/chunker", () => ({
  chunkText: vi.fn((text: string) => [text]),
}));

vi.mock("@/lib/ai/embedding", () => ({
  generateEmbeddings: vi.fn(() => Promise.resolve([{ id: 1 }])),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insertResource: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("pdf-parse", () => ({
  default: vi.fn(() =>
    Promise.resolve({ text: "PDF content extracted" })
  ),
}));

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn(() =>
      Promise.resolve({ value: "DOCX content extracted", messages: [] })
    ),
  },
}));

vi.mock("officeparser", () => ({
  parseOffice: vi.fn(() => Promise.resolve("PPTX content extracted")),
}));

import { POST } from "@/app/api/ingest/route";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
  });
});

function makeFileRequest(file: File): Request {
  const formData = new FormData();
  formData.append("file", file);
  return new Request("http://localhost:3000/api/ingest", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/ingest", () => {
  it("인증 실패 시 401을 반환한다", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const response = await POST(makeFileRequest(file));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("텍스트 파일(TXT) 정상 처리", async () => {
    const file = new File(["Hello World"], "test.txt", {
      type: "text/plain",
    });
    const response = await POST(makeFileRequest(file));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("문서 수집 완료");
    expect(body.source).toBe("test.txt");
  });

  it("PDF 파일 정상 처리", async () => {
    const file = new File(["fake-pdf"], "document.pdf", {
      type: "application/pdf",
    });
    const response = await POST(makeFileRequest(file));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("문서 수집 완료");
    expect(body.source).toBe("document.pdf");
  });

  it("DOCX 파일 정상 처리", async () => {
    const file = new File(["fake-docx"], "document.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const response = await POST(makeFileRequest(file));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("문서 수집 완료");
    expect(body.source).toBe("document.docx");
  });

  it("PPTX 파일 정상 처리", async () => {
    const file = new File(["fake-pptx"], "presentation.pptx", {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
    const response = await POST(makeFileRequest(file));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("문서 수집 완료");
    expect(body.source).toBe("presentation.pptx");
  });

  it("지원하지 않는 파일 형식 시 400 에러", async () => {
    const file = new File(["data"], "spreadsheet.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const response = await POST(makeFileRequest(file));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("지원하는 파일 형식: PDF, DOCX, PPTX, TXT, MD");
  });

  it("파일 없이 텍스트로 요청 시 정상 처리", async () => {
    const formData = new FormData();
    formData.append("text", "직접 입력한 텍스트");
    const request = new Request("http://localhost:3000/api/ingest", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe("직접 입력");
  });

  it("파일과 텍스트 모두 없으면 400 에러", async () => {
    const formData = new FormData();
    const request = new Request("http://localhost:3000/api/ingest", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("file 또는 text가 필요합니다.");
  });

  it("10MB 초과 파일은 400 에러", async () => {
    const largeContent = new Uint8Array(11 * 1024 * 1024);
    const file = new File([largeContent], "large.txt", {
      type: "text/plain",
    });
    const response = await POST(makeFileRequest(file));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("파일 크기는 10MB 이하여야 합니다.");
  });

  it("MD 파일 정상 처리", async () => {
    const file = new File(["# Heading\nContent"], "readme.md", {
      type: "text/markdown",
    });
    const response = await POST(makeFileRequest(file));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe("readme.md");
  });
});
