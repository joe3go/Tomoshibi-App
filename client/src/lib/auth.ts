export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('token');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token || token.trim() === '' || token === 'undefined' || token === 'null') {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
