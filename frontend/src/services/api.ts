const API_BASE = '/api/v1';

async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  if (ct.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      return JSON.parse(text);
    } catch {
      // Fall through to safe error envelope
    }
  }
  return {
    success: false,
    error: {
      code: res.status >= 500 ? 'SERVER_ERROR' : 'INVALID_RESPONSE',
      message:
        res.status >= 500
          ? 'Service temporarily unavailable. Please try again in a moment.'
          : `Unexpected response from server (HTTP ${res.status}).`,
    },
  };
}

function getAuthHeaders(token?: string) {
  const t = token || localStorage.getItem('lifnex_token') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (t) {
    headers['Authorization'] = `Bearer ${t}`;
  }
  return headers;
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = localStorage.getItem('lifnex_refresh_token');
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const json = await safeJson(res);
      const newToken = json?.data?.session?.access_token;
      const newRefresh = json?.data?.session?.refresh_token;
      const user = json?.data?.user;
      if (res.ok && json?.success && newToken) {
        localStorage.setItem('lifnex_token', newToken);
        if (newRefresh) localStorage.setItem('lifnex_refresh_token', newRefresh);
        if (user) localStorage.setItem('lifnex_user', JSON.stringify(user));
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function fetchWithAuth(url: string, init: RequestInit = {}, explicitToken?: string) {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...getAuthHeaders(explicitToken),
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 && !explicitToken && localStorage.getItem('lifnex_token')) {
    const body = await safeJson(res);
    const code = body?.error?.code;
    if (code === 'INVALID_OR_EXPIRED_TOKEN' || code === 'UNAUTHORIZED') {
      const newToken = await tryRefreshAccessToken();
      if (newToken) {
        const retryRes = await fetch(url, {
          ...init,
          headers: {
            ...getAuthHeaders(newToken),
            ...(init.headers || {}),
          },
        });
        return safeJson(retryRes);
      }
      localStorage.removeItem('lifnex_token');
      localStorage.removeItem('lifnex_refresh_token');
      localStorage.removeItem('lifnex_user');
      window.dispatchEvent(new CustomEvent('lifnex:session-expired'));
    }
    return body;
  }

  return safeJson(res);
}

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return safeJson(res);
  },

  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return safeJson(res);
  },

  async demoLogin(role: string) {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return safeJson(res);
  },

  async register(data: Record<string, any>) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return safeJson(res);
  },

  async verifyOtp(email: string, otp: string) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return safeJson(res);
  },

  async resendOtp(email: string) {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return safeJson(res);
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return safeJson(res);
  },

  async resetPassword(access_token: string, new_password: string) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token, new_password }),
    });
    return safeJson(res);
  },

  async refreshSession(refreshToken: string) {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return safeJson(res);
  },

  async logout(token?: string) {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return safeJson(res);
  },

  async getMe(token?: string) {
    return fetchWithAuth(`${API_BASE}/auth/me`, {}, token);
  },

  // Donors
  async getDonorFeed(token?: string) {
    return fetchWithAuth(`${API_BASE}/donors/feed`, {}, token);
  },

  async updateDonorAvailability(status: 'available' | 'busy' | 'inactive', donorId?: string, token?: string) {
    return fetchWithAuth(`${API_BASE}/donors/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ availability_status: status, donor_id: donorId }),
    }, token);
  },

  async respondToRequest(data: { request_id: string; donor_id: string; response_status: 'interested' | 'accepted' | 'declined'; estimated_arrival_minutes?: number }, token?: string) {
    return fetchWithAuth(`${API_BASE}/donors/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  // Blood Requests
  async getBloodRequests(token?: string) {
    return fetchWithAuth(`${API_BASE}/blood-requests`, {}, token);
  },

  async createBloodRequest(data: Record<string, any>, token?: string) {
    return fetchWithAuth(`${API_BASE}/blood-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async getMatchingDonors(requestId: string, token?: string) {
    return fetchWithAuth(`${API_BASE}/blood-requests/${requestId}/matching-donors`, {}, token);
  },

  async getDonorResponses(requestId: string, token?: string) {
    return fetchWithAuth(`${API_BASE}/blood-requests/${requestId}/responses`, {}, token);
  },

  async cancelBloodRequest(requestId: string, token?: string) {
    return fetchWithAuth(`${API_BASE}/blood-requests/${requestId}/cancel`, {
      method: 'PATCH',
    }, token);
  },

  // Hospitals
  async getHospitals(city?: string) {
    const url = city ? `${API_BASE}/hospitals?city=${encodeURIComponent(city)}` : `${API_BASE}/hospitals`;
    const res = await fetch(url);
    return safeJson(res);
  },

  async verifyHospital(hospitalId: string, token?: string) {
    return fetchWithAuth(`${API_BASE}/hospitals/${hospitalId}/verify`, {
      method: 'PATCH',
    }, token);
  },

  // Notifications
  async getNotifications(unreadOnly = false, token?: string) {
    const url = unreadOnly ? `${API_BASE}/notifications?unread_only=true` : `${API_BASE}/notifications`;
    return fetchWithAuth(url, {}, token);
  },

  async markNotificationRead(notifId: string, token?: string) {
    return fetchWithAuth(`${API_BASE}/notifications/${notifId}/read`, {
      method: 'PATCH',
    }, token);
  },

  async markAllNotificationsRead(token?: string) {
    return fetchWithAuth(`${API_BASE}/notifications/mark-all-read`, {
      method: 'PATCH',
    }, token);
  },

  // AI
  async aiTriage(notes: string) {
    const res = await fetch(`${API_BASE}/ai/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: notes }),
    });
    return safeJson(res);
  },

  async aiAdminInsights(token?: string) {
    return fetchWithAuth(`${API_BASE}/ai/admin-insights`, {}, token);
  },
};
