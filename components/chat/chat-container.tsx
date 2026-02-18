"use client";

import { useChat } from "ai/react";
import { useRef, useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { useToast } from "@/hooks/use-toast";
// Actually, let's use a simple alert for now if toast isn't installed, or install it.
// I'll stick to basic state for errors for this iteration to avoid over-engineering in one step.

interface ChatContainerProps {
    conversationId: string | null;
    initialMessages?: { id: string; role: "user" | "assistant"; content: string }[];
    onConversationCreated?: (id: string) => void;
}

export function ChatContainer({ conversationId, initialMessages = [], onConversationCreated }: ChatContainerProps) {
    const convIdRef = useRef(conversationId);
    const isFirstMessage = useRef(!conversationId);
    const router = useRouter();

    // Save message to DB
    async function saveMessage(conversationId: string, role: string, content: string) {
        await fetch(`/api/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role, content }),
        });
    }

    // Create new conversation
    async function createConversation(title: string): Promise<string> {
        const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
        });
        const data = await res.json();
        return data.id;
    }

    const {
        messages,
        input,
        handleInputChange,
        handleSubmit: originalHandleSubmit,
        isLoading,
        error,
        reload,
        stop,
        setMessages,
    } = useChat({
        initialMessages,
        onFinish: async (message) => {
            if (convIdRef.current) {
                await saveMessage(convIdRef.current, "assistant", message.content);
            }
        },
    });

    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

    useEffect(() => {
        convIdRef.current = conversationId;
    }, [conversationId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const userMessage = input.trim();
        if (!userMessage) return;

        try {
            if (isFirstMessage.current) {
                isFirstMessage.current = false;
                const title = userMessage.length > 30 ? userMessage.slice(0, 30) + "..." : userMessage;
                const newId = await createConversation(title);
                convIdRef.current = newId;
                onConversationCreated?.(newId);

                // Optimistic update for URL if needed, but the parent handles it
            }

            if (convIdRef.current) {
                await saveMessage(convIdRef.current, "user", userMessage);
            }
        } catch (err) {
            console.error("Failed to save message", err);
        }

        originalHandleSubmit(e);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadStatus("uploading");
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/ingest", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setUploadStatus("success");
                setTimeout(() => setUploadStatus("idle"), 3000);
            } else {
                setUploadStatus("error");
            }
        } catch (error) {
            setUploadStatus("error");
        } finally {
            e.target.value = ""; // reset input
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full max-w-5xl mx-auto border-x border-border shadow-sm bg-background">
            <MessageList
                messages={messages}
                isLoading={isLoading}
                error={error}
                reload={reload}
            />

            <ChatInput
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                onFileUpload={handleFileUpload}
                uploadStatus={uploadStatus}
            />
        </div>
    );
}
