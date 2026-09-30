// lib/image-store.ts
// Offline image storage for target photos.
// Stores full-resolution blobs + thumbnails in IndexedDB.
// Uploads pending images when the device comes back online.

import { getDb, getCurrentUserId } from './db';
import { apiFetch } from './api';

const THUMBNAIL_SIZE = 200;

// ── Store ─────────────────────────────────────────────────────────────────────

export async function storeTargetImage(
  sessionId: string,
  file: File,
): Promise<string> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const db = getDb();
  const id = `session_${sessionId}_${Date.now()}`;
  const thumbnail = await generateThumbnail(file);

  await db.images.put({
    id,
    sessionId,
    userId,
    blob: file,
    thumbnail,
    uploadStatus: 'pending',
    cachedAt: Date.now(),
  });

  return id;
}

export async function getImageObjectUrl(imageId: string): Promise<string | null> {
  const db = getDb();
  const record = await db.images.get(imageId);
  if (!record) return null;
  return URL.createObjectURL(record.blob);
}

export async function getThumbnailObjectUrl(imageId: string): Promise<string | null> {
  const db = getDb();
  const record = await db.images.get(imageId);
  if (!record?.thumbnail) return null;
  return URL.createObjectURL(record.thumbnail);
}

// ── Upload pending images ─────────────────────────────────────────────────────

export async function uploadPendingImages(): Promise<void> {
  const db = getDb();
  const pending = await db.images.where('uploadStatus').equals('pending').toArray();

  for (const record of pending) {
    try {
      const form = new FormData();
      form.append('file', record.blob);
      form.append('sessionId', record.sessionId);

      await apiFetch(`/shots/analyze-photo?sessionId=${record.sessionId}`, {
        method: 'POST',
        body: form,
        skipOffline: true,
      });

      await db.images.update(record.id, {
        uploadStatus: 'uploaded',
        uploadedSessionId: record.sessionId,
      });
    } catch {
      // Mark failed but don't remove — will retry next time
      await db.images.update(record.id, { uploadStatus: 'failed' });
    }
  }
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

/** Remove uploaded images older than 7 days to free IndexedDB storage. */
export async function cleanOldImages(): Promise<void> {
  const db = getDb();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  await db.images
    .where('uploadStatus').equals('uploaded')
    .filter(r => r.cachedAt < cutoff)
    .delete();
}

// ── Thumbnail generation ──────────────────────────────────────────────────────

async function generateThumbnail(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Cover crop to square
    const size = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - size) / 2;
    const sy = (bitmap.height - size) / 2;
    ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    bitmap.close();

    return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
  } catch {
    return null;
  }
}
