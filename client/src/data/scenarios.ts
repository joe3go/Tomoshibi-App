import { Scenario } from "../../../shared/scenario-types";

export const scenarios: Scenario[] = [
  {
    id: "self-introduction",
    title: "Self-Introduction",
    level: "N5",
    category: "Social",
    difficulty: "beginner",
    estimatedMinutes: 10,
    prompt: "You're meeting someone new at a coffee shop. Introduce yourself politely and start a conversation.",
    goals: [
      "Use はじめまして (nice to meet you)",
      "State your name with です",
      "Ask for their name politely",
      "Use よろしくお願いします (please treat me favorably)"
    ],
    targetVocab: ["はじめまして", "です", "わたし", "なまえ", "よろしくお願いします", "こんにちは"],
    rewards: {
      xp: 100,
      badges: ["first-introduction"]
    }
  },
  {
    id: "cafe-ordering",
    title: "Ordering at a Café",
    level: "N5",
    category: "Daily Life",
    difficulty: "beginner",
    estimatedMinutes: 8,
    prompt: "You enter a small café. Politely order a drink and maybe something to eat.",
    goals: [
      "Use ～をください (please give me)",
      "Use 1 drink word",
      "Use 1 food word",
      "Use polite greeting"
    ],
    targetVocab: ["コーヒー", "パン", "ください", "こんにちは", "ありがとうございます", "おいしい"],
    rewards: {
      xp: 80,
      badges: ["cafe-customer"]
    }
  },
  {
    id: "asking-directions",
    title: "Asking for Directions",
    level: "N5",
    category: "Travel",
    difficulty: "elementary",
    estimatedMinutes: 12,
    prompt: "You're lost in a Japanese neighborhood. Ask a friendly local for directions to the train station.",
    goals: [
      "Use すみません (excuse me)",
      "Ask where something is with どこですか",
      "Use ありがとうございます to thank",
      "Use direction words like みぎ/ひだり"
    ],
    targetVocab: ["すみません", "どこ", "えき", "みぎ", "ひだり", "まっすぐ", "ありがとうございます"],
    unlockConditions: {
      completedScenarios: ["self-introduction"]
    },
    rewards: {
      xp: 120,
      badges: ["navigator"]
    }
  },
  {
    id: "shopping-convenience-store",
    title: "Shopping at a Convenience Store",
    level: "N5",
    category: "Daily Life",
    difficulty: "beginner",
    estimatedMinutes: 8,
    prompt: "You need to buy some snacks and drinks at a Japanese convenience store (konbini).",
    goals: [
      "Greet the staff",
      "Ask for the price with いくらですか",
      "Use numbers for money",
      "Say thank you when leaving"
    ],
    targetVocab: ["いらっしゃいませ", "いくら", "えん", "ありがとうございます", "おにぎり", "みず"],
    rewards: {
      xp: 90,
      badges: ["konbini-shopper"]
    }
  },
  {
    id: "restaurant-ordering",
    title: "Ordering at a Restaurant",
    level: "N4",
    category: "Food",
    difficulty: "elementary",
    estimatedMinutes: 15,
    prompt: "You're at a traditional Japanese restaurant. Look at the menu and order a meal.",
    goals: [
      "Read menu items aloud",
      "Use ～にします (I'll have)",
      "Ask about recommendations",
      "Comment on the food taste"
    ],
    targetVocab: ["メニュー", "おすすめ", "にします", "おいしい", "らーめん", "すし", "おちゃ"],
    unlockConditions: {
      completedScenarios: ["cafe-ordering"],
      minVocabUsed: 10
    },
    rewards: {
      xp: 150,
      badges: ["foodie"]
    }
  },
  {
    id: "train-ticket-purchase",
    title: "Buying a Train Ticket",
    level: "N4",
    category: "Travel",
    difficulty: "elementary",
    estimatedMinutes: 12,
    prompt: "You need to buy a train ticket at the station. Navigate the ticket machine or ask for help.",
    goals: [
      "Ask for help politely",
      "Say your destination",
      "Understand price and time",
      "Thank the staff"
    ],
    targetVocab: ["きっぷ", "駅", "いき", "時間", "分", "手伝う", "お願いします"],
    unlockConditions: {
      completedScenarios: ["asking-directions"]
    },
    rewards: {
      xp: 140,
      badges: ["train-traveler"]
    }
  },
  {
    id: "weather-small-talk",
    title: "Weather Small Talk",
    level: "N5",
    category: "Social",
    difficulty: "beginner",
    estimatedMinutes: 6,
    prompt: "Make casual conversation about the weather with a colleague or friend.",
    goals: [
      "Comment on today's weather",
      "Use weather adjectives",
      "Ask about tomorrow's weather",
      "Express preferences about weather"
    ],
    targetVocab: ["天気", "暑い", "寒い", "雨", "晴れ", "曇り", "明日", "今日"],
    rewards: {
      xp: 70,
      badges: ["weather-talker"]
    }
  },
  {
    id: "job-interview-basics",
    title: "Basic Job Interview",
    level: "N3",
    category: "Business",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    prompt: "You're in a simple job interview. Answer basic questions about yourself and your experience.",
    goals: [
      "Introduce yourself formally",
      "Talk about your background",
      "Express interest in the position",
      "Ask appropriate questions"
    ],
    targetVocab: ["面接", "経験", "会社", "仕事", "大学", "専門", "興味", "質問"],
    unlockConditions: {
      completedScenarios: ["self-introduction", "weather-small-talk"],
      minVocabUsed: 25,
      minXp: 500
    },
    rewards: {
      xp: 250,
      badges: ["professional", "intermediate-speaker"]
    }
  },
  {
    id: "doctor-appointment",
    title: "At the Doctor's Office",
    level: "N4",
    category: "Health",
    difficulty: "elementary",
    estimatedMinutes: 15,
    prompt: "You don't feel well and need to explain your symptoms to a doctor.",
    goals: [
      "Explain what hurts",
      "Describe symptoms",
      "Answer doctor's questions",
      "Understand basic medical advice"
    ],
    targetVocab: ["病院", "医者", "痛い", "熱", "頭", "お腹", "薬", "大丈夫"],
    unlockConditions: {
      completedScenarios: ["shopping-convenience-store"],
      minVocabUsed: 15
    },
    rewards: {
      xp: 180,
      badges: ["health-conscious"]
    }
  },
  {
    id: "hobby-conversation",
    title: "Talking About Hobbies",
    level: "N4",
    category: "Social",
    difficulty: "elementary",
    estimatedMinutes: 12,
    prompt: "Share your hobbies and interests with a new friend. Ask about their hobbies too.",
    goals: [
      "Name your hobbies",
      "Ask about their interests",
      "Express likes and dislikes",
      "Make plans to do something together"
    ],
    targetVocab: ["趣味", "好き", "嫌い", "映画", "音楽", "スポーツ", "読書", "今度"],
    unlockConditions: {
      completedScenarios: ["weather-small-talk"]
    },
    rewards: {
      xp: 130,
      badges: ["social-butterfly"]
    }
  }
];

// Helper functions for scenario management
export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find(scenario => scenario.id === id);
}

export function getScenariosByLevel(level: string): Scenario[] {
  return scenarios.filter(scenario => scenario.level === level);
}

export function getScenariosByCategory(category: string): Scenario[] {
  return scenarios.filter(scenario => scenario.category === category);
}

export function getAvailableScenarios(completedScenarios: string[], totalXp: number = 0, vocabUsed: number = 0): Scenario[] {
  return scenarios.filter(scenario => {
    // Check if scenario is already completed
    if (completedScenarios.includes(scenario.id)) {
      return false;
    }

    // Check unlock conditions
    const conditions = scenario.unlockConditions;
    if (!conditions) {
      return true; // No conditions means always available
    }

    // Check completed scenarios prerequisite
    if (conditions.completedScenarios) {
      const hasRequiredScenarios = conditions.completedScenarios.every(
        requiredId => completedScenarios.includes(requiredId)
      );
      if (!hasRequiredScenarios) {
        return false;
      }
    }

    // Check minimum XP
    if (conditions.minXp && totalXp < conditions.minXp) {
      return false;
    }

    // Check minimum vocab used
    if (conditions.minVocabUsed && vocabUsed < conditions.minVocabUsed) {
      return false;
    }

    return true;
  });
}

export function getNextRecommendedScenario(
  completedScenarios: string[], 
  totalXp: number = 0, 
  vocabUsed: number = 0
): Scenario | undefined {
  const available = getAvailableScenarios(completedScenarios, totalXp, vocabUsed);
  
  // Sort by difficulty and XP reward to recommend the most appropriate next scenario
  return available.sort((a, b) => {
    const difficultyOrder = { 'beginner': 1, 'elementary': 2, 'intermediate': 3, 'upper-intermediate': 4, 'advanced': 5 };
    const aDifficulty = difficultyOrder[a.difficulty];
    const bDifficulty = difficultyOrder[b.difficulty];
    
    if (aDifficulty !== bDifficulty) {
      return aDifficulty - bDifficulty;
    }
    
    return a.rewards.xp - b.rewards.xp;
  })[0];
}