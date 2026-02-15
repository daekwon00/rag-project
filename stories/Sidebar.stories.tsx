import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { Sidebar } from "@/components/sidebar";
import type { Conversation } from "@/lib/db/schema";

const sampleConversations: Conversation[] = [
  {
    id: "conv-1",
    user_id: "user-1",
    title: "RAG 시스템 구현 질문",
    created_at: "2025-02-10T10:00:00Z",
    updated_at: "2025-02-10T12:00:00Z",
  },
  {
    id: "conv-2",
    user_id: "user-1",
    title: "PDF 파싱 오류 해결",
    created_at: "2025-02-09T08:00:00Z",
    updated_at: "2025-02-09T09:30:00Z",
  },
  {
    id: "conv-3",
    user_id: "user-1",
    title: "Supabase pgvector 설정 방법",
    created_at: "2025-02-08T14:00:00Z",
    updated_at: "2025-02-08T15:00:00Z",
  },
];

function mockFetch(conversations: Conversation[]) {
  return async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/api/conversations")) {
      return new Response(JSON.stringify(conversations), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Not found", { status: 404 });
  };
}

const meta: Meta<typeof Sidebar> = {
  title: "Components/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  args: {
    onSelect: fn(),
    onNew: fn(),
    onClose: fn(),
  },
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story, context) => {
      const conversations = context.parameters.conversations ?? sampleConversations;
      window.fetch = mockFetch(conversations) as typeof window.fetch;
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentId: null,
    isOpen: true,
  },
};

export const WithSelectedConversation: Story = {
  args: {
    currentId: "conv-2",
    isOpen: true,
  },
};

export const Empty: Story = {
  args: {
    currentId: null,
    isOpen: true,
  },
  parameters: {
    conversations: [],
  },
};

export const Closed: Story = {
  args: {
    currentId: null,
    isOpen: false,
  },
};

export const ManyConversations: Story = {
  args: {
    currentId: "conv-3",
    isOpen: true,
  },
  parameters: {
    conversations: [
      ...sampleConversations,
      {
        id: "conv-4",
        user_id: "user-1",
        title: "임베딩 모델 비교",
        created_at: "2025-02-07T10:00:00Z",
        updated_at: "2025-02-07T11:00:00Z",
      },
      {
        id: "conv-5",
        user_id: "user-1",
        title: "Next.js App Router 질문",
        created_at: "2025-02-06T10:00:00Z",
        updated_at: "2025-02-06T11:00:00Z",
      },
      {
        id: "conv-6",
        user_id: "user-1",
        title: "Vercel AI SDK 스트리밍 설정",
        created_at: "2025-02-05T10:00:00Z",
        updated_at: "2025-02-05T11:00:00Z",
      },
      {
        id: "conv-7",
        user_id: "user-1",
        title: "TailwindCSS 다크 모드",
        created_at: "2025-02-04T10:00:00Z",
        updated_at: "2025-02-04T11:00:00Z",
      },
    ],
  },
};
