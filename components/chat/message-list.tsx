"use client";

import * as React from "react";
import { Message } from "ai/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { SourcePanel } from "./source-panel";

interface SourceItem {
    index: number;
    source: string;
    content: string;
    similarity: number;
}

function getSources(annotations?: any[]): SourceItem[] | null {
    if (!annotations) return null;
    for (const a of annotations) {
        if (typeof a === "object" && a !== null && "sources" in a) {
            const sources = (a as { sources: SourceItem[] }).sources;
            if (Array.isArray(sources) && sources.length > 0) return sources;
        }
    }
    return null;
}

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    error?: Error;
    reload?: () => void;
}

export function MessageList({ messages, isLoading, error, reload }: MessageListProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const bottomRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const lastMessage = messages[messages.length - 1];
    const streamingMessageId = isLoading && lastMessage?.role === "assistant" ? lastMessage.id : null;

    return (
        <ScrollArea className="flex-1 p-4 h-full" ref={scrollRef}>
            <div className="flex flex-col gap-6 pb-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center text-muted-foreground">
                        <p className="text-lg font-medium">Welcome to the Chat</p>
                        <p className="text-sm">Upload a document or ask a question to get started.</p>
                    </div>
                )}

                {messages.map((m) => {
                    const sources = getSources(m.annotations as any[]);
                    return (
                        <div key={m.id}>
                            <MessageBubble
                                role={m.role as "user" | "assistant"}
                                content={m.content}
                                isStreaming={m.id === streamingMessageId}
                            />
                            {sources && <SourcePanel sources={sources} />}
                        </div>
                    );
                })}

                {isLoading && (!lastMessage || lastMessage.role === "user") && (
                    <div className="w-full max-w-3xl mx-auto py-4">
                        <span className="loading-dots text-muted-foreground text-sm">Thinking...</span>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                        An error occurred. {" "}
                        <button onClick={reload} className="underline font-medium hover:text-destructive/80">
                            Try again
                        </button>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    );
}
