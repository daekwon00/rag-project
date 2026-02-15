import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { Chat } from "@/components/chat";

/**
 * Chat component stories.
 *
 * Note: Chat relies on the `useChat` hook from `ai/react`, which internally
 * calls `/api/chat`. In Storybook, these API calls won't work, so we render
 * the component with initialMessages to show different visual states.
 * Interactive features (sending messages, file upload) won't function.
 */
const meta: Meta<typeof Chat> = {
  title: "Components/Chat",
  component: Chat,
  tags: ["autodocs"],
  args: {
    onConversationCreated: fn(),
  },
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => {
      // Mock fetch so useChat and other fetch calls don't fail
      const originalFetch = window.fetch;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        // Mock chat API — return empty stream
        if (url.includes("/api/chat")) {
          return new Response("", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }
        // Mock conversations API
        if (url.includes("/api/conversations")) {
          if (init?.method === "POST") {
            return new Response(JSON.stringify({ id: "mock-conv-id" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        // Mock messages API
        if (url.includes("/messages")) {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return originalFetch(input, init);
      };
      return (
        <div style={{ height: "600px" }}>
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    conversationId: null,
    initialMessages: [],
  },
};

export const WithMessages: Story = {
  args: {
    conversationId: "conv-1",
    initialMessages: [
      {
        id: "msg-1",
        role: "user",
        content: "RAG 시스템에서 청크 크기는 어떻게 설정하나요?",
      },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "RAG 시스템의 청크 크기는 일반적으로 **500~1000자** 사이로 설정합니다.\n\n주요 고려사항:\n- **너무 작으면**: 문맥이 부족해져 의미 있는 검색 결과를 얻기 어렵습니다.\n- **너무 크면**: 관련 없는 정보가 포함될 수 있고 임베딩 품질이 저하됩니다.\n\n이 프로젝트에서는 500자 청크에 100자 오버랩을 사용하고 있습니다.",
      },
      {
        id: "msg-3",
        role: "user",
        content: "오버랩은 왜 필요한가요?",
      },
      {
        id: "msg-4",
        role: "assistant",
        content:
          "오버랩(overlap)은 인접한 청크 간에 일부 텍스트를 공유하게 만듭니다.\n\n```\n청크 1: [    텍스트 A    |오버랩|\n청크 2:                 |오버랩|    텍스트 B    ]\n```\n\n**필요한 이유:**\n1. 문장이 청크 경계에서 잘리는 것을 방지\n2. 문맥 연속성 유지\n3. 검색 시 관련 정보를 놓치지 않도록 함",
      },
    ],
  },
};

export const LongConversation: Story = {
  args: {
    conversationId: "conv-2",
    initialMessages: [
      {
        id: "msg-1",
        role: "user",
        content: "PDF 파일 업로드가 안 됩니다.",
      },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "PDF 업로드 오류를 해결하기 위해 다음을 확인해주세요:\n\n1. 파일 크기가 제한을 초과하지 않는지 확인\n2. PDF가 손상되지 않았는지 확인\n3. 브라우저 콘솔에서 에러 메시지 확인",
      },
      {
        id: "msg-3",
        role: "user",
        content: "콘솔에 'pdf-parse module not found' 에러가 있습니다.",
      },
      {
        id: "msg-4",
        role: "assistant",
        content:
          "`pdf-parse` 모듈이 설치되지 않은 것 같습니다. 다음 명령어로 설치해주세요:\n\n```bash\nnpm install pdf-parse\n```\n\n설치 후 서버를 재시작하면 됩니다.",
      },
      {
        id: "msg-5",
        role: "user",
        content: "감사합니다! 해결되었습니다.",
      },
      {
        id: "msg-6",
        role: "assistant",
        content: "다행이네요! 다른 질문이 있으시면 언제든 물어보세요. 😊",
      },
    ],
  },
};
