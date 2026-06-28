import { describe, it, expect, vi, afterEach } from 'vitest';
import os from 'os';
import fs from 'fs';
import path from 'path';

// safeFetch is mocked so saveUnsplashCover never hits the network.
const { safeFetch } = vi.hoisted(() => ({ safeFetch: vi.fn() }));
vi.mock('../../../src/utils/ssrfGuard', () => ({ safeFetch }));

import { searchUnsplashPhotos, saveUnsplashCover, isUnsplashCoverUrl } from '../../../src/services/unsplashService';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function fakeRes(init: { ok: boolean; status?: number; type?: string; bytes?: number; json?: unknown }): Response {
  return {
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 500),
    headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? init.type ?? '' : null) },
    arrayBuffer: async () => new ArrayBuffer(init.bytes ?? 8),
    json: async () => init.json ?? {},
  } as unknown as Response;
}

describe('unsplashService.isUnsplashCoverUrl', () => {
  it('UNSPLASH-001: accepts only the Unsplash image CDN host', () => {
    expect(isUnsplashCoverUrl('https://images.unsplash.com/photo-1?w=1080')).toBe(true);
    expect(isUnsplashCoverUrl('https://evil.example.com/x.jpg')).toBe(false);
    expect(isUnsplashCoverUrl('/uploads/covers/local.jpg')).toBe(false);
    expect(isUnsplashCoverUrl(null)).toBe(false);
    expect(isUnsplashCoverUrl(undefined)).toBe(false);
  });
});

describe('unsplashService.searchUnsplashPhotos', () => {
  it('UNSPLASH-002: rejects an empty query without hitting the network', async () => {
    expect(await searchUnsplashPhotos('   ')).toEqual({ error: 'Search query is required', status: 400 });
  });

  it('UNSPLASH-003: maps a non-ok response to an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes({ ok: false, status: 429, type: 'application/json', json: { errors: ['Rate limited'] } })));
    expect(await searchUnsplashPhotos('paris')).toEqual({ error: 'Rate limited', status: 429 });
  });

  it('UNSPLASH-004: returns normalised photos on success and drops entries missing a url/thumb', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes({
      ok: true,
      type: 'application/json',
      json: {
        results: [
          { id: 'a', urls: { regular: 'https://images.unsplash.com/a', small: 'https://images.unsplash.com/a-s' }, user: { name: 'Alice' }, links: { html: 'https://unsplash.com/a' } },
          { id: 'b', urls: {} }, // dropped — no url/thumb
        ],
      },
    })));
    const res = await searchUnsplashPhotos('paris') as { photos: { id: string }[] };
    expect(res.photos).toHaveLength(1);
    expect(res.photos[0]).toMatchObject({ id: 'a', photographer: 'Alice', link: 'https://unsplash.com/a' });
  });
});

describe('unsplashService.saveUnsplashCover', () => {
  const dir = path.join(os.tmpdir(), 'trek-unsplash-cover-test');
  afterEach(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } });

  it('UNSPLASH-005: rejects a non-Unsplash host before any fetch', async () => {
    await expect(saveUnsplashCover('https://evil.example.com/x.jpg', dir)).rejects.toThrow('Not an Unsplash image URL');
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('UNSPLASH-006: downloads an Unsplash image and writes it locally', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: true, type: 'image/jpeg', bytes: 1234 }));
    const filename = await saveUnsplashCover('https://images.unsplash.com/photo-1?w=1080', dir);
    expect(filename).toMatch(/\.jpg$/);
    expect(fs.existsSync(path.join(dir, filename))).toBe(true);
  });

  it('UNSPLASH-007: rejects an unsupported content type', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: true, type: 'text/html' }));
    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1', dir)).rejects.toThrow(/Unsupported cover image type/);
  });

  it('UNSPLASH-008: rejects an oversized image', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: true, type: 'image/png', bytes: 16 * 1024 * 1024 }));
    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1', dir)).rejects.toThrow('Cover image too large');
  });

  it('UNSPLASH-009: throws when the download fails', async () => {
    safeFetch.mockResolvedValue(fakeRes({ ok: false, status: 404 }));
    await expect(saveUnsplashCover('https://images.unsplash.com/photo-1', dir)).rejects.toThrow(/HTTP 404/);
  });
});
