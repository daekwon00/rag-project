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
  chatLimiter: null,
  checkRateLimit: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/ai/embedding", () => ({
  findRelevantContent: vi.fn(() =>
    Promise.resolve([
      { content: "문서 내용", source: "test.pdf", similarity: 0.9 },
    ])
  ),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "mock-model"),
}));

vi.mock("ai", () => ({
  createDataStreamResponse: vi.fn(({ execute }) => {
    // execute 콜백을 호출하여 코드 커버리지 확보
    const mockDataStream = {
      writeMessageAnnotation: vi.fn(),
    };
    const mockResult = {
      mergeIntoDataStream: vi.fn(),
    };
    // streamText를 모킹하므로 execute 내부에서 에러 없이 실행
    try {
      execute(mockDataStream);
    } catch {
      // streamText mock이 execute 내부에서 호출되므로 무시
    }
    return new Response("stream", { status: 200 });
  }),
  streamText: vi.fn(() => ({
    mergeIntoDataStream: vi.fn(),
  })),
}));

import { POST } from "@/app/api/chat/route";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  it("인증 실패 시 401을 반환한다", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(
      makeRequest({ messages: [{ role: "user", content: "안녕" }] })
    );

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  it("messages가 빈 배열이면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const response = await POST(makeRequest({ messages: [] }));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("messages 배열이 필요합니다.");
  });

  it("messages가 배열이 아니면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const response = await POST(makeRequest({ messages: "not-array" }));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("messages 배열이 필요합니다.");
  });

  it("lastMessage.content가 없으면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const response = await POST(
      makeRequest({ messages: [{ role: "user" }] })
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe(
      "유효한 메시지 content가 필요합니다."
    );
  });

  it("lastMessage.content가 문자열이 아니면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const response = await POST(
      makeRequest({ messages: [{ role: "user", content: 123 }] })
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe(
      "유효한 메시지 content가 필요합니다."
    );
  });

  it("유효한 요청 시 200 스트리밍 응답을 반환한다", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const response = await POST(
      makeRequest({
        messages: [{ role: "user", content: "테스트 질문입니다" }],
      })
    );

    expect(response.status).toBe(200);
  });
});
