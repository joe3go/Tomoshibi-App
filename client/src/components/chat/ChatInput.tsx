
import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { bind, unbind, toHiragana } from "wanakana";

interface ChatInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  romajiMode: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  message,
  onMessageChange,
  onSendMessage,
  romajiMode,
  disabled = false,
  placeholder = "Type your message in Japanese...",
  className = ""
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Wanakana binding
  useEffect(() => {
    const element = textareaRef.current;
    if (romajiMode && element) {
      bind(element, { IMEMode: "toHiragana" });
    }

    return () => {
      if (element) {
        try {
          unbind(element);
        } catch (e) {
          console.log("Unbind cleanup completed");
        }
      }
    };
  }, [romajiMode]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSendMessage();
  };

  return (
    <div className={`border-t bg-card p-4 ${className}`}>
      <div className="max-w-4xl mx-auto flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 min-h-[60px] resize-none"
          disabled={disabled}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="lg"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
