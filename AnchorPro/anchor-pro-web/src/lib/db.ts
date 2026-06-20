import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AnchorProDB extends DBSchema {
  offlineData: {
    key: string;
    value: any;
  };
  syncQueue: {
    key: string; // usually a generated UUID
    value: {
      id: string;
      url: string;
      method: string;
      body: any;
      headers: any;
      timestamp: number;
    };
    indexes: { 'by-time': number };
  };
}

let dbPromise: Promise<IDBPDatabase<AnchorProDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<AnchorProDB>('AnchorProOfflineDB', 1, {
    upgrade(db) {
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

/**
 * Save data to offline cache (e.g. GET response)
 */
export async function setOfflineData(key: string, data: any) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put('offlineData', data, key);
}

/**
 * Retrieve data from offline cache
 */
export async function getOfflineData(key: string) {
  if (!dbPromise) return null;
  const db = await dbPromise;
  return await db.get('offlineData', key);
}

/**
 * Add a mutation (POST/PUT/DELETE) to the sync queue
 */
export async function enqueueSync(url: string, method: string, body: any, headers: any) {
  if (!dbPromise) return;
  const db = await dbPromise;
  const id = crypto.randomUUID();
  await db.add('syncQueue', {
    id,
    url,
    method,
    body,
    headers,
    timestamp: Date.now(),
  });
}

/**
 * Get all pending items in the sync queue
 */
export async function getSyncQueue() {
  if (!dbPromise) return [];
  const db = await dbPromise;
  return await db.getAllFromIndex('syncQueue', 'by-time');
}

/**
 * Remove an item from the sync queue after successful sync
 */
export async function dequeueSync(id: string) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.delete('syncQueue', id);
}
