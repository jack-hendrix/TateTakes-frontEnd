import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  collection,
  disableNetwork,
  doc,
  Firestore,
  getDocFromCache,
  getDocsFromCache,
  getFirestore,
  terminate,
} from 'firebase/firestore';

let appCount = 0;

export interface OfflineFirestore {
  app: FirebaseApp;
  firestore: Firestore;
  cleanup: () => Promise<void>;
}

/**
 * Creates an isolated Firestore instance with networking disabled. Writes are
 * applied to the local cache immediately (their promises stay pending because
 * the server never acknowledges them), and listeners fire from the cache, so
 * services can be exercised against the real SDK without a backend.
 */
export async function createOfflineFirestore(): Promise<OfflineFirestore> {
  const app = initializeApp(
    {
      projectId: 'demo-tate-takes',
      apiKey: 'demo-api-key',
      appId: 'demo-app-id',
    },
    `test-app-${appCount++}`,
  );
  const firestore = getFirestore(app);
  await disableNetwork(firestore);
  return {
    app,
    firestore,
    // Each test gets its own uniquely named app, so terminating Firestore is
    // enough; deleting the app makes the SDK log warnings for pending writes.
    cleanup: () => terminate(firestore),
  };
}

/** Writes never resolve while offline; swallow the rejection on teardown. */
export function pending<T>(promise: Promise<T>): void {
  promise.catch(() => undefined);
}

export async function readCollection(
  firestore: Firestore,
  path: string,
): Promise<Record<string, unknown>[]> {
  const snapshot = await getDocsFromCache(collection(firestore, path));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function readDoc(firestore: Firestore, path: string) {
  try {
    const snapshot = await getDocFromCache(doc(firestore, path));
    return snapshot.exists() ? snapshot.data() : undefined;
  } catch {
    return undefined;
  }
}
