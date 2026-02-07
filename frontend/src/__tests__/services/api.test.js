import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../../services/api';

describe('api request headers', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ save: { id: 'save-1' } })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
});
