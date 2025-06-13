
import { z } from 'zod';
import {
  UserSchema,
  ConversationSchema,
  MessageSchema,
  PersonaSchema,
  ScenarioSchema,
  VocabularyItemSchema,
  VocabTrackerEntrySchema,
  UserProgressSchema,
  ApiResponse,
  PaginatedResponse,
  LoginForm,
  RegisterForm,
  MessageForm,
  LoginFormSchema,
  RegisterFormSchema,
  MessageFormSchema,
} from '@shared/types';

// API Configuration
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';
const API_TIMEOUT = 10000;

// Custom API Error Class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP Client with Type Safety
class HttpClient {
  private baseURL: string;
  private timeout: number;
  private token: string | null = null;

  constructor(baseURL: string, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();

      if (schema) {
        const result = schema.safeParse(data);
        if (!result.success) {
          console.error('API response validation failed:', result.error);
          throw new ApiError('Invalid response format', 500, result.error);
        }
        return result.data;
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw new ApiError('Network error', 0, error);
    }
  }

  async get<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request(endpoint, { method: 'GET' }, schema);
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      schema
    );
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request(
      endpoint,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      schema
    );
  }

  async delete<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request(endpoint, { method: 'DELETE' }, schema);
  }
}

// API Client Instance
const httpClient = new HttpClient(API_BASE_URL);

// Authentication API
export const authApi = {
  login: async (credentials: LoginForm) => {
    const validatedCredentials = LoginFormSchema.parse(credentials);
    const response = await httpClient.post<{
      token: string;
      user: z.infer<typeof UserSchema>;
    }>('/api/auth/login', validatedCredentials);
    
    httpClient.setToken(response.token);
    return response;
  },

  register: async (userData: RegisterForm) => {
    const validatedData = RegisterFormSchema.parse(userData);
    const response = await httpClient.post<{
      token: string;
      user: z.infer<typeof UserSchema>;
    }>('/api/auth/register', validatedData);
    
    httpClient.setToken(response.token);
    return response;
  },

  me: () => httpClient.get('/api/auth/me', UserSchema),

  logout: () => {
    httpClient.setToken(null);
    return Promise.resolve();
  },
};

// User API
export const userApi = {
  getProfile: () => httpClient.get('/api/auth/me', UserSchema),
  
  updateProfile: (userId: number, updates: Partial<z.infer<typeof UserSchema>>) =>
    httpClient.patch(`/api/users/${userId}`, updates, UserSchema),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError('Upload failed', response.status);
    }

    return response.json();
  },
};

// Conversation API
export const conversationApi = {
  create: (data: Omit<z.infer<typeof ConversationSchema>, 'id' | 'startedAt'>) =>
    httpClient.post('/api/conversations', data, ConversationSchema),

  getActive: () =>
    httpClient.get('/api/conversations', z.array(ConversationSchema)),

  getCompleted: () =>
    httpClient.get('/api/conversations/completed', z.array(ConversationSchema)),

  getById: (id: number) =>
    httpClient.get(`/api/conversations/${id}`, z.object({
      conversation: ConversationSchema,
      messages: z.array(MessageSchema),
    })),

  update: (id: number, updates: Partial<z.infer<typeof ConversationSchema>>) =>
    httpClient.patch(`/api/conversations/${id}`, updates, ConversationSchema),

  sendMessage: (conversationId: number, message: MessageForm) => {
    const validatedMessage = MessageFormSchema.parse(message);
    return httpClient.post(
      `/api/conversations/${conversationId}/messages`,
      validatedMessage,
      z.object({ messages: z.array(MessageSchema) })
    );
  },
};

// Vocabulary API
export const vocabularyApi = {
  getAll: () => httpClient.get('/api/vocab', z.array(VocabularyItemSchema)),
  
  search: (query: string) =>
    httpClient.get(`/api/vocab/search?q=${encodeURIComponent(query)}`, z.array(VocabularyItemSchema)),

  getDefinition: (word: string) =>
    httpClient.get(`/api/word-definition/${encodeURIComponent(word)}`, z.object({
      word: z.string(),
      reading: z.string(),
      meaning: z.string(),
      jlptLevel: z.string().optional(),
      wordType: z.string().optional(),
      source: z.enum(['local', 'external']),
    })),
};

// Vocabulary Tracker API
export const vocabTrackerApi = {
  getTracker: () =>
    httpClient.get('/api/vocab-tracker', z.array(VocabTrackerEntrySchema)),

  incrementFrequency: (wordId: number, source: 'conversation' | 'manual' | 'hover' = 'hover') =>
    httpClient.post('/api/vocab-tracker/increment', { wordId, source }, VocabTrackerEntrySchema),
};

// Content API
export const contentApi = {
  getPersonas: () => httpClient.get('/api/personas', z.array(PersonaSchema)),
  
  getScenarios: () => httpClient.get('/api/scenarios', z.array(ScenarioSchema)),
  
  getProgress: () => httpClient.get('/api/progress', UserProgressSchema),
};

// Export the http client for advanced usage
export { httpClient };

// Export query client compatible functions
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(httpClient['token'] && { Authorization: `Bearer ${httpClient['token']}` }),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }

  return response;
}

export const getQueryFn = ({ on401 = 'throw' }: { on401?: 'returnNull' | 'throw' } = {}) =>
  async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(httpClient['token'] && { Authorization: `Bearer ${httpClient['token']}` }),
      },
      credentials: 'include',
    });

    if (on401 === 'returnNull' && response.status === 401) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    return response.json();
  };

// Performance monitoring
export const performanceApi = {
  trackMetric: (metric: string, value: number) => {
    // In a real app, this would send to analytics
    console.log(`Performance metric: ${metric} = ${value}ms`);
  },
};
