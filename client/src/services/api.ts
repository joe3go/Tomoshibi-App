import { apiRequest } from '@/lib/queryClient';
import type {
  ChatConversation,
  ChatMessage,
  TeachingPersona,
  LearningScenario,
  VocabularyTrackingEntry,
  UserLearningProgress
} from '@/types';

export class ApiService {
  // Authentication
  static async getCurrentUser() {
    const response = await apiRequest('GET', '/api/auth/me');
    return response.json();
  }

  static async updateUserProfile(updates: Record<string, any>) {
    const response = await apiRequest('PATCH', '/api/auth/profile', updates);
    return response.json();
  }

  static async logout() {
    const response = await apiRequest('POST', '/api/auth/logout');
    return response.json();
  }

  // Conversations
  static async getConversations(): Promise<ChatConversation[]> {
    const response = await apiRequest('GET', '/api/conversations');
    return response.json();
  }

  static async getConversation(id: number): Promise<ChatConversation> {
    const response = await apiRequest('GET', `/api/conversations/${id}`);
    return response.json();
  }

  static async createConversation(data: { scenarioId: number; personaId: number }): Promise<ChatConversation> {
    const response = await apiRequest('POST', '/api/conversations', data);
    return response.json();
  }

  static async sendMessage(conversationId: number, content: string): Promise<ChatMessage> {
    const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, { content });
    return response.json();
  }

  static async endConversation(conversationId: number) {
    const response = await apiRequest('POST', `/api/conversations/${conversationId}/end`);
    return response.json();
  }

  // Personas
  static async getPersonas(): Promise<TeachingPersona[]> {
    const response = await apiRequest('GET', '/api/personas');
    return response.json();
  }

  static async getPersona(id: number): Promise<TeachingPersona> {
    const response = await apiRequest('GET', `/api/personas/${id}`);
    return response.json();
  }

  // Scenarios
  static async getScenarios(): Promise<LearningScenario[]> {
    const response = await apiRequest('GET', '/api/scenarios');
    return response.json();
  }

  static async getScenario(id: number): Promise<LearningScenario> {
    const response = await apiRequest('GET', `/api/scenarios/${id}`);
    return response.json();
  }

  // Vocabulary
  static async getVocabulary(): Promise<VocabularyTrackingEntry[]> {
    const response = await apiRequest('GET', '/api/vocab-tracker');
    return response.json();
  }

  static async getWordDefinition(word: string) {
    const response = await apiRequest('GET', `/api/vocabulary/definition?word=${encodeURIComponent(word)}`);
    return response.json();
  }

  // Progress
  static async getUserProgress(): Promise<UserLearningProgress[]> {
    const response = await apiRequest('GET', '/api/progress');
    return response.json();
  }

  static async updateProgress(data: Partial<UserLearningProgress>) {
    const response = await apiRequest('POST', '/api/progress', data);
    return response.json();
  }

  // File uploads
  static async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch('/api/upload/avatar', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    return response.json();
  }
}