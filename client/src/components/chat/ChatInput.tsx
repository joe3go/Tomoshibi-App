
/**
 * 🧩 Shared between solo and group chat
 * 🔒 Must remain mode-agnostic
 * ✅ All behavior controlled via props or context
 * ❌ No assumptions, no fallbacks — only schema-driven logic
 */
import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Globe } from "lucide-react";
import { bind, unbind, toHiragana } from "wanakana";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  romajiMode?: boolean;
  onRomajiModeToggle?: () => void;
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message in Japanese...",
  romajiMode = false,
  onRomajiModeToggle
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Wanakana binding for romaji mode
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
          // Cleanup completed
        }
      }
    };
  }, [romajiMode]);

  const handleSend = () => {
    if (!message?.trim() || disabled) return;
    
    const finalMessage = romajiMode ? toHiragana(message.trim()) : message.trim();
    onSendMessage(finalMessage);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="flex-1 min-h-[60px] resize-none"
        disabled={disabled}
      />
      {onRomajiModeToggle && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRomajiModeToggle}
          type="button"
        >
          <Globe className="w-4 h-4" />
          {romajiMode ? "あ" : "A"}
        </Button>
      )}
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
