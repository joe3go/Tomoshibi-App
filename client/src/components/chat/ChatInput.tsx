import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  message?: string;
  setMessage?: (message: string) => void;
  onMessageChange?: (message: string) => void;
  onSendMessage: () => void;
  disabled?: boolean;
  placeholder?: string;
  romajiMode?: boolean;
}

export function ChatInput({
  message: externalMessage,
  setMessage,
  onMessageChange,
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  romajiMode = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [internalMessage, setInternalMessage] = useState("");

  // Use external message if provided, otherwise use internal state
  const message = externalMessage !== undefined ? externalMessage : internalMessage;

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!message?.trim() || disabled) return;
    onSendMessage();

    // Clear the input after sending
    if (externalMessage === undefined) {
      setInternalMessage("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // Update external state if provided
    if (setMessage) {
      setMessage(value);
    }

    // Update internal state if no external message
    if (externalMessage === undefined) {
      setInternalMessage(value);
    }

    // Call change handler if provided
    if (onMessageChange) {
      onMessageChange(value);
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t border-border bg-background">
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={message || ""}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={!message?.trim() || disabled}
        size="lg"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}