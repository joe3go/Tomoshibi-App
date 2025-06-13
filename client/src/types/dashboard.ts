import type { User, Conversation, Scenario, Persona, UserProgress, VocabTracker } from '@shared/schema';

/**
 * Branded types for type safety
 */
export type UserId = number & { readonly brand: unique symbol };
export type ConversationId = number & { readonly brand: unique symbol };
export type PersonaId = number & { readonly brand: unique symbol };
export type ScenarioId = number & { readonly brand: unique symbol };

/**
 * Dashboard-specific user interface with optional properties strictly typed
 */
export interface DashboardUser extends User {
  readonly displayName: string | null;
  readonly profileImageUrl: string | null;
  readonly soundNotifications: boolean;
  readonly desktopNotifications: boolean;
}

/**
 * Extended conversation interface for dashboard display
 */
export interface DashboardConversation extends Conversation {
  readonly persona?: Persona;
  readonly scenario?: Scenario;
  readonly messageCount?: number;
  readonly lastMessageAt?: Date;
}

/**
 * Persona interface with required avatar for dashboard display
 */
export interface DashboardPersona extends Persona {
  readonly avatarUrl: string;
  readonly isActive?: boolean;
}

/**
 * Progress metrics calculated for dashboard analytics
 */
export interface DashboardProgressMetrics {
  readonly vocabCount: number;
  readonly completedConversations: number;
  readonly totalInteractions: number;
  readonly progressionLabel: string;
  readonly jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}

/**
 * Card metadata for reusable card components
 */
export interface CardMeta {
  readonly title: string;
  readonly description?: string;
  readonly badge?: string;
  readonly status?: 'active' | 'completed' | 'paused';
}

/**
 * Component prop interfaces
 */

/**
 * Props for conversation card component
 */
export interface ConversationCardProps {
  readonly conversation: DashboardConversation;
  readonly onEndSession?: (conversationId: ConversationId) => void;
  readonly onContinue?: (conversationId: ConversationId) => void;
  readonly className?: string;
}

/**
 * Props for persona/tutor carousel component
 */
export interface TutorCarouselProps {
  readonly personas: readonly DashboardPersona[];
  readonly onSelectTutor?: (personaId: PersonaId) => void;
  readonly selectedPersonaId?: PersonaId;
  readonly className?: string;
}

/**
 * Props for analytics grid component
 */
export interface AnalyticsGridProps {
  readonly metrics: ProgressMetrics;
  readonly vocabData: readonly VocabTracker[];
  readonly conversations: readonly DashboardConversation[];
  readonly className?: string;
}

/**
 * Props for header component
 */
export interface HeaderProps {
  readonly user: DashboardUser;
  readonly progressionLabel: string;
  readonly onNavigate: (path: string) => void;
  readonly onLogout: () => void;
}

/**
 * Props for metric card component
 */
export interface MetricCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly description?: string;
  readonly icon?: React.ComponentType<{ className?: string }>;
  readonly trend?: 'up' | 'down' | 'neutral';
  readonly className?: string;
}

/**
 * Props for avatar with label component
 */
export interface AvatarWithLabelProps {
  readonly src?: string;
  readonly alt: string;
  readonly fallback: string;
  readonly label: string;
  readonly sublabel?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly onClick?: () => void;
  readonly className?: string;
}

/**
 * Props for card section header
 */
export interface CardSectionHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: {
    readonly label: string;
    readonly onClick: () => void;
  };
  readonly className?: string;
}

/**
 * Settings form data interface
 */
export interface SettingsFormData {
  readonly displayName: string;
  readonly newPassword: string;
  readonly soundNotifications: boolean;
  readonly desktopNotifications: boolean;
}

/**
 * Japanese scenario mapping type
 */
export interface ScenarioTranslation {
  readonly [key: string]: string;
}

/**
 * Progression levels with thresholds
 */
export interface ProgressionLevel {
  readonly threshold: number;
  readonly label: string;
  readonly emoji: string;
}

/**
 * Dashboard state interface
 */
export interface DashboardState {
  readonly user: DashboardUser | null;
  readonly conversations: readonly DashboardConversation[];
  readonly activeConversations: readonly DashboardConversation[];
  readonly completedConversations: readonly DashboardConversation[];
  readonly scenarios: readonly Scenario[];
  readonly personas: readonly DashboardPersona[];
  readonly progress: UserProgress | null;
  readonly vocabData: readonly VocabTracker[];
  readonly metrics: ProgressMetrics;
  readonly isLoading: boolean;
}

/**
 * Callback function types
 */
export type NavigationCallback = (path: string) => void;
export type ConversationActionCallback = (conversationId: ConversationId) => void;
export type PersonaSelectionCallback = (personaId: PersonaId) => void;
export type SettingsUpdateCallback = (data: Partial<SettingsFormData>) => void;