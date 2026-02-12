import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, AUTH_EXPIRED_EVENT } from '../../services/api';

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

  it('clears local auth and emits auth-expired event on 401 when token exists', async () => {
    const onAuthExpired = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid token', code: 'INVALID_TOKEN' })
    });

    await expect(api.getSaves()).rejects.toMatchObject({ status: 401 });

    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(onAuthExpired).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
  });

  it('does not emit auth-expired event for logout 401', async () => {
    const onAuthExpired = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid token', code: 'INVALID_TOKEN' })
    });

    await expect(api.logout()).rejects.toMatchObject({ status: 401 });
    expect(onAuthExpired).not.toHaveBeenCalled();

    window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
  });
});
