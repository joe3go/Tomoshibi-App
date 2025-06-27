
/**
 * 🧩 Shared chat UI state management
 * ✅ Furigana, romaji mode, and UI preferences
 * 🔒 Works for both solo and group chats
 */
import { useState, useEffect } from "react";

export function useChatUIState() {
  const [showFurigana, setShowFurigana] = useState(() => {
    const saved = localStorage.getItem("furigana-visible");
    return saved !== null ? saved === "true" : true;
  });

  const [romajiMode, setRomajiMode] = useState(false);

  // Save furigana preference to localStorage
  useEffect(() => {
    localStorage.setItem("furigana-visible", showFurigana.toString());
  }, [showFurigana]);

  const toggleFurigana = () => setShowFurigana(!showFurigana);
  const toggleRomajiMode = () => setRomajiMode(!romajiMode);

  return {
    showFurigana,
    romajiMode,
    setShowFurigana,
    setRomajiMode,
    toggleFurigana,
    toggleRomajiMode,
  };
}
