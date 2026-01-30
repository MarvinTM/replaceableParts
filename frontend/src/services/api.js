const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data.code
    );
  }

  return data;
}

export const api = {
  // Auth
  async loginWithGoogle(credential) {
    return request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });
  },

  async getCurrentUser() {
    return request('/auth/me');
  },

  async logout() {
    return request('/auth/logout', { method: 'POST' });
  },

  // Users
  async getProfile() {
    return request('/users/profile');
  },

  async updateProfile(data) {
    return request('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Admin
  async getUsers() {
    return request('/admin/users');
  },

  async getUser(id) {
    return request(`/admin/users/${id}`);
  },

  async updateUserPermissions(id, permissions) {
    return request(`/admin/users/${id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(permissions)
    });
  },

  async deleteUser(id) {
    return request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminStats() {
    return request('/admin/stats');
  },

  // Game Saves
  async getSaves() {
    return request('/game/saves');
  },

  async getSave(id) {
    return request(`/game/saves/${id}`);
  },

  async createSave(data) {
    return request('/game/saves', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateSave(id, data) {
    return request(`/game/saves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteSave(id) {
    return request(`/game/saves/${id}`, {
      method: 'DELETE'
    });
  },

  // Feedback
  async sendFeedback(title, body) {
    return request('/feedback', {
      method: 'POST',
      body: JSON.stringify({ title, body })
    });
  },

  // Session tracking
  async startSession(data) {
    return request('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async sessionHeartbeat(sessionId, data) {
    return request(`/sessions/heartbeat/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async endSession(sessionId, data) {
    return request(`/sessions/end/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  sendSessionBeacon(sessionId, data) {
    const token = localStorage.getItem('token');
    if (!token || !sessionId) return false;

    const payload = { ...data, _token: token };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = `${API_URL}/sessions/end/${sessionId}`;

    if (navigator.sendBeacon) {
      return navigator.sendBeacon(url, blob);
    }

    // Fallback to fetch with keepalive
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(() => {});

    return true;
  },

  // Admin session endpoints
  async getSessionStats() {
    return request('/admin/sessions/stats');
  },

  async getSessions(page = 1, limit = 20) {
    return request(`/admin/sessions?page=${page}&limit=${limit}`);
  }
};

export { ApiError };
