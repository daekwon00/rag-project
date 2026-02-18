"use client";

import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

// ReactMarkdown plugins
const mdRemarkPlugins = [remarkGfm];
const mdRehypePlugins = [rehypeHighlight];
const mdComponents: Components = {
    a: ({ children, href, ...props }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
            {...props}
        >
            {children}
        </a>
    ),
    code: ({ className, children, ...props }) => {
        // Inline code check
        const match = /language-(\w+)/.exec(className || "");
        const isInline = !match;

        if (isInline) {
            return (
                <code className={cn("bg-muted px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>
                    {children}
                </code>
            );
        }

        return (
            <code className={className} {...props}>
                {children}
            </code>
        );
    }
};

interface MessageBubbleProps {
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
    const isUser = role === "user";

    return (
        <div className={cn("flex gap-4 w-full max-w-3xl mx-auto py-6", isUser ? "flex-row-reverse" : "flex-row")}>
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-muted"}>
                    {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </AvatarFallback>
            </Avatar>

            <div className={cn("flex-1 space-y-2 overflow-hidden", isUser ? "text-right" : "text-left")}>
                <div className={cn("prose dark:prose-invert max-w-none break-words", isUser && "bg-primary text-primary-foreground rounded-lg px-4 py-2 inline-block text-left")}>
                    {isUser ? (
                        <div className="whitespace-pre-wrap">{content}</div>
                    ) : (
                        <div className={cn("markdown-body", isStreaming && "streaming")}>
                            <ReactMarkdown
                                remarkPlugins={mdRemarkPlugins}
                                rehypePlugins={mdRehypePlugins}
                                components={mdComponents}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
