
export interface DashboardConversation {
  id: number;
  userId: number;
  personaId: number | null;
  scenarioId: number | null;
  phase: 'guided' | 'transitioning' | 'open';
  status: 'active' | 'completed' | 'paused';
  startedAt: string;
  completedAt: string | null;
  persona?: DashboardPersona;
  scenario?: DashboardScenario;
}

export interface DashboardPersona {
  id: number;
  name: string;
  type: 'teacher' | 'friend';
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  description: string | null;
  avatarUrl: string | null;
}

export interface DashboardScenario {
  id: number;
  title: string;
  description: string | null;
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}

export interface ProgressMetrics {
  current: number;
  total: number;
  streak: number;
  accuracy: number;
}

export interface UserProgress {
  id: number;
  userId: number;
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  vocabEncountered: number[];
  vocabMastered: number[];
  grammarEncountered: number[];
  grammarMastered: number[];
  totalConversations: number;
  totalMessagesSent: number;
  metrics?: ProgressMetrics;
  lastActivity?: string;
}

export interface DashboardUser {
  id: number;
  email: string;
  displayName: string | null;
  profileImageUrl: string | null;
  preferredKanjiDisplay: 'furigana' | 'kanji' | 'hiragana';
}

export interface ConversationCardProps {
  conversation: DashboardConversation;
  persona?: DashboardPersona;
  scenario?: DashboardScenario;
  onClick: (conversationId: number) => void;
}

export interface AnalyticsGridProps {
  progress: UserProgress;
  conversations: DashboardConversation[];
  isLoading?: boolean;
}

export interface TutorCarouselProps {
  personas: DashboardPersona[];
  onSelectTutor: (personaId: number) => void;
  isLoading?: boolean;
}
