import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../../services/api';

function createLocalStorageMock() {
  const store = {};
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    })
  };
}

describe('api request headers', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    localStorage.setItem('token', 'test-token');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ save: { id: 'save-1' } })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps Authorization when custom headers are provided', async () => {
    await api.getSave('save-1', {
      headers: {
        'X-Client-Tab-Id': 'tab-1'
      }
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/game/saves/save-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'X-Client-Tab-Id': 'tab-1',
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('sends delete request for profile deletion', async () => {
    await api.deleteProfile();

    expect(fetch).toHaveBeenCalledWith(
      '/api/users/profile',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json'
        })
      })
    );
  });
});
