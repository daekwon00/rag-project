"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, StopCircle, Paperclip } from "lucide-react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  stop: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadStatus: "idle" | "uploading" | "success" | "error";
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  onFileUpload,
  uploadStatus,
}: ChatInputProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="relative flex items-end gap-2 p-4 bg-background border-t">
      {/* File Upload Button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileUpload}
        className="hidden"
        accept=".pdf,.txt,.md,.docx,.pptx"
      />
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadStatus === "uploading"}
      >
        <Paperclip className="h-4 w-4" />
        <span className="sr-only">Upload file</span>
      </Button>

      {/* Text Input */}
      <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          className="min-h-[44px] max-h-[200px] resize-none py-3"
          rows={1}
        />
        
        {isLoading ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={stop}
            className="shrink-0"
          >
            <StopCircle className="h-4 w-4" />
            <span className="sr-only">Stop generating</span>
          </Button>
        ) : (
          <Button type="submit" size="icon" className="shrink-0" disabled={!input.trim()}>
            <SendHorizontal className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        )}
      </form>
    </div>
  );
}
