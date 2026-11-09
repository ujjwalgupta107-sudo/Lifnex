/**
 * LIFNEX AUTHENTICATION HELPER
 */
export interface UserSession {
  token: string;
  user: {
    id: string;
    email: string;
    role: 'patient' | 'donor' | 'hospital' | 'admin';
    name?: string;
  };
}

export const AuthState = {
  getToken(): string | null {
    return localStorage.getItem('lifnex_access_token');
  },

  setSession(token: string, user: any): void {
    localStorage.setItem('lifnex_access_token', token);
    localStorage.setItem('lifnex_user', JSON.stringify(user));
  },

  getUser(): any {
    const raw = localStorage.getItem('lifnex_user');
    return raw ? JSON.parse(raw) : null;
  },

  clearSession(): void {
    localStorage.removeItem('lifnex_access_token');
    localStorage.removeItem('lifnex_user');
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }
};

