
import { vi } from 'vitest';

// Mock useLocation hook
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => 
    React.createElement('a', { href }, children),
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
  },
});
