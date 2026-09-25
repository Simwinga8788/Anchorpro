import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SyncQueueItem {
  id: string;                    // internal queue id (uuid)
  kind: 'json' | 'upload';
  url: string;
  method: string;
  body?: any;                    // 'json' kind
  fileBlob?: Blob;                // 'upload' kind — Blobs are structured-clone-safe in IndexedDB, unlike FormData
  fileFieldName?: string;         // 'upload' kind — the multipart field name (usually "file")
  headers: any;
  timestamp: number;
  idempotencyKey: string;
  // If this queued request creates something that a LATER queued request depends on (e.g. "attach
  // photo to the diary entry I just created offline"), the caller uses this same placeholder string
  // as the id/url in that later request. flushSyncQueue resolves every occurrence of every
  // placeholder to its real server-assigned id once the item that created it has synced —
  // no per-page code needs to know this is happening.
  placeholderId?: string;
}

interface AnchorProDB extends DBSchema {
  offlineData: {
    key: string;
    value: any;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-time': number };
  };
}

let dbPromise: Promise<IDBPDatabase<AnchorProDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<AnchorProDB>('AnchorProOfflineDB', 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData');
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
        store.createIndex('by-time', 'timestamp');
      }
    },
  });
}

// ── Pending-sync visibility ── a plain EventTarget so any component (e.g. the Topbar
// indicator) can subscribe to queue-size changes without polling or a state-management library.
export const offlineQueueEvents = typeof window !== 'undefined' ? new EventTarget() : null;
function notifyQueueChanged() {
  offlineQueueEvents?.dispatchEvent(new Event('change'));
}

/** Save data to offline cache (e.g. GET response) */
export async function setOfflineData(key: string, data: any) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put('offlineData', data, key);
}

/** Retrieve data from offline cache */
export async function getOfflineData(key: string) {
  if (!dbPromise) return null;
  const db = await dbPromise;
  return await db.get('offlineData', key);
}

/** Queue a JSON mutation (POST/PUT/PATCH/DELETE) for later replay. */
export async function enqueueSync(
  url: string,
  method: string,
  body: any,
  headers: any,
  opts?: { idempotencyKey?: string; placeholderId?: string }
) {
  if (!dbPromise) return;
  const db = await dbPromise;
  const id = crypto.randomUUID();
  await db.add('syncQueue', {
    id,
    kind: 'json',
    url,
    method,
    body,
    headers,
    timestamp: Date.now(),
    idempotencyKey: opts?.idempotencyKey || crypto.randomUUID(),
    placeholderId: opts?.placeholderId,
  });
  notifyQueueChanged();
}

/** Queue a file upload for later replay — stores the raw Blob (FormData itself can't be stored in IndexedDB). */
export async function enqueueUpload(
  url: string,
  fileBlob: Blob,
  fileFieldName: string,
  opts?: { idempotencyKey?: string; placeholderId?: string }
) {
  if (!dbPromise) return;
  const db = await dbPromise;
  const id = crypto.randomUUID();
  await db.add('syncQueue', {
    id,
    kind: 'upload',
    url,
    method: 'POST',
    fileBlob,
    fileFieldName,
    headers: {},
    timestamp: Date.now(),
    idempotencyKey: opts?.idempotencyKey || crypto.randomUUID(),
    placeholderId: opts?.placeholderId,
  });
  notifyQueueChanged();
}

/** Get all pending items in the sync queue, oldest first. */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  if (!dbPromise) return [];
  const db = await dbPromise;
  return await db.getAllFromIndex('syncQueue', 'by-time');
}

/** Number of items still waiting to sync — cheap enough to call on every render. */
export async function getPendingSyncCount(): Promise<number> {
  if (!dbPromise) return 0;
  const db = await dbPromise;
  return await db.count('syncQueue');
}

/** Remove an item from the sync queue after successful sync. */
export async function dequeueSync(id: string) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.delete('syncQueue', id);
  notifyQueueChanged();
}
