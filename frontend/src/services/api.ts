const API_BASE = '/api/v1';

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

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async register(data: Record<string, any>) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMe(token?: string) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(token),
    });
    return res.json();
  },

  // Donors
  async getDonorFeed(token?: string) {
    const res = await fetch(`${API_BASE}/donors/feed`, {
      headers: getAuthHeaders(token),
    });
    return res.json();
  },

  async updateDonorAvailability(status: 'available' | 'busy' | 'inactive', donorId?: string, token?: string) {
    const res = await fetch(`${API_BASE}/donors/availability`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ availability_status: status, donor_id: donorId }),
    });
    return res.json();
  },

  async respondToRequest(data: { request_id: string; donor_id: string; response_status: 'interested' | 'accepted' | 'declined'; estimated_arrival_minutes?: number }, token?: string) {
    const res = await fetch(`${API_BASE}/donors/respond`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Blood Requests
  async getBloodRequests(token?: string) {
    const res = await fetch(`${API_BASE}/blood-requests`, {
      headers: getAuthHeaders(token),
    });
    return res.json();
  },

  async createBloodRequest(data: Record<string, any>, token?: string) {
    const res = await fetch(`${API_BASE}/blood-requests`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMatchingDonors(requestId: string, token?: string) {
    const res = await fetch(`${API_BASE}/blood-requests/${requestId}/matching-donors`, {
      headers: getAuthHeaders(token),
    });
    return res.json();
  },

  async getDonorResponses(requestId: string, token?: string) {
    const res = await fetch(`${API_BASE}/blood-requests/${requestId}/responses`, {
      headers: getAuthHeaders(token),
    });
    return res.json();
  },

  async cancelBloodRequest(requestId: string, token?: string) {
    const res = await fetch(`${API_BASE}/blood-requests/${requestId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return res.json();
  },

  // Hospitals
  async getHospitals(city?: string) {
    const url = city ? `${API_BASE}/hospitals?city=${encodeURIComponent(city)}` : `${API_BASE}/hospitals`;
    const res = await fetch(url);
    return res.json();
  },

  async verifyHospital(hospitalId: string, token?: string) {
    const res = await fetch(`${API_BASE}/hospitals/${hospitalId}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return res.json();
  },

  // Notifications
  async getNotifications(unreadOnly = false, token?: string) {
    const url = unreadOnly ? `${API_BASE}/notifications?unread_only=true` : `${API_BASE}/notifications`;
    const res = await fetch(url, {
      headers: getAuthHeaders(token),
    });
    return res.json();
  },

  async markNotificationRead(notifId: string, token?: string) {
    const res = await fetch(`${API_BASE}/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
    });
    return res.json();
  },

  async markAllNotificationsRead(token?: string) {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
    });
    return res.json();
  },

  // AI
  async aiTriage(notes: string) {
    const res = await fetch(`${API_BASE}/ai/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinical_notes: notes }),
    });
    return res.json();
  },

  async aiAdminInsights(token?: string) {
    const res = await fetch(`${API_BASE}/ai/admin-insights`, {
      headers: getAuthHeaders(token),
    });
    return res.json();
  },
};
