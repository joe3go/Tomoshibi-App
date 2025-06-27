
/**
 * 🧩 Shared auto-scroll functionality
 * ✅ Automatically scrolls to bottom when messages change
 * 🔒 Works for both solo and group chats
 */
import { useEffect, useRef } from "react";

export function useAutoScroll(messages: any[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  return { messagesEndRef };
}
