import { useState, useEffect } from 'react';

export type ConversationMood = 
  | 'cheerful'    // Bright, energetic conversations
  | 'calm'        // Peaceful, relaxed discussions  
  | 'focused'     // Study sessions, serious learning
  | 'playful'     // Fun, anime discussions, casual chat
  | 'melancholy'  // Sad or nostalgic topics
  | 'exciting'    // Action, adventure discussions
  | 'romantic'    // Love stories, romantic anime
  | 'mysterious' // Thriller, mystery topics
  | 'neutral';    // Default state

interface MoodKeywords {
  [key: string]: string[];
}

const moodKeywords: MoodKeywords = {
  cheerful: ['嬉しい', 'うれしい', '楽しい', 'たのしい', '面白い', 'おもしろい', '笑', 'わらい', 'happy', 'fun', 'funny', 'laugh', 'joy'],
  calm: ['静か', 'しずか', '平和', 'へいわ', '落ち着く', 'おちつく', 'リラックス', 'calm', 'peaceful', 'relax', 'quiet', 'serene'],
  focused: ['勉強', 'べんきょう', '学習', 'がくしゅう', '集中', 'しゅうちゅう', 'study', 'learn', 'focus', 'concentrate', 'practice'],
  playful: ['ゲーム', 'げーむ', '遊び', 'あそび', 'アニメ', 'あにめ', 'かわいい', 'cute', 'game', 'play', 'anime', 'manga', 'fun'],
  melancholy: ['悲しい', 'かなしい', '寂しい', 'さびしい', '泣く', 'なく', 'sad', 'lonely', 'cry', 'tears', 'miss'],
  exciting: ['すごい', '素晴らしい', 'すばらしい', '興奮', 'こうふん', 'amazing', 'awesome', 'exciting', 'incredible', 'wow'],
  romantic: ['愛', 'あい', '恋', 'こい', '好き', 'すき', 'love', 'romantic', 'cute', 'sweet', 'heart'],
  mysterious: ['謎', 'なぞ', '不思議', 'ふしぎ', '秘密', 'ひみつ', 'mystery', 'strange', 'secret', 'unknown', 'curious']
};

export const useMoodDetection = (messages: any[]) => {
  const [currentMood, setCurrentMood] = useState<ConversationMood>('neutral');
  const [moodHistory, setMoodHistory] = useState<ConversationMood[]>([]);

  const detectMoodFromText = (text: string): ConversationMood => {
    const lowerText = text.toLowerCase();
    const scores: { [key in ConversationMood]: number } = {
      cheerful: 0, calm: 0, focused: 0, playful: 0, 
      melancholy: 0, exciting: 0, romantic: 0, mysterious: 0, neutral: 0
    };

    // Analyze text for mood keywords
    Object.entries(moodKeywords).forEach(([mood, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          scores[mood as ConversationMood] += 1;
        }
      });
    });

    // Find the mood with highest score
    const topMood = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as ConversationMood] > scores[b[0] as ConversationMood] ? a : b
    )[0] as ConversationMood;

    return scores[topMood] > 0 ? topMood : 'neutral';
  };

  const analyzeConversationMood = () => {
    if (messages.length === 0) {
      setCurrentMood('neutral');
      return;
    }

    // Analyze last 5 messages for current mood context
    const recentMessages = messages.slice(-5);
    const moodCounts: { [key in ConversationMood]: number } = {
      cheerful: 0, calm: 0, focused: 0, playful: 0, 
      melancholy: 0, exciting: 0, romantic: 0, mysterious: 0, neutral: 0
    };

    recentMessages.forEach(message => {
      const mood = detectMoodFromText(message.content || '');
      moodCounts[mood]++;
    });

    // Find dominant mood, with recency bias
    const dominantMood = Object.entries(moodCounts).reduce((a, b) => 
      moodCounts[a[0] as ConversationMood] >= moodCounts[b[0] as ConversationMood] ? a : b
    )[0] as ConversationMood;

    setCurrentMood(dominantMood);
    
    // Update mood history
    setMoodHistory(prev => {
      const newHistory = [...prev, dominantMood];
      return newHistory.slice(-10); // Keep last 10 mood states
    });
  };

  useEffect(() => {
    analyzeConversationMood();
  }, [messages]);

  return {
    currentMood,
    moodHistory,
    detectMoodFromText
  };
};