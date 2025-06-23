export function useConversationMode(conversation: any) {
  const mode = conversation?.mode || "solo";
  return {
    mode,
    isGroup: mode === "group",
    isSolo: mode === "solo",
  };
}