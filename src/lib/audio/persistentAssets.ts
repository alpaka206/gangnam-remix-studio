const DB_NAME = "gangnam-remix-studio-assets";
const DB_VERSION = 1;
const STORE_NAME = "audio-files";

type StoredAudioAsset = {
  id: string;
  file: File;
  savedAt: string;
};

export async function savePersistentAudioAsset(assetId: string, file: File) {
  const database = await openAudioDatabase();

  if (!database) {
    return;
  }

  await runStoreRequest(database, "readwrite", (store) =>
    store.put({
      id: assetId,
      file,
      savedAt: new Date().toISOString(),
    } satisfies StoredAudioAsset),
  );
}

export async function loadPersistentAudioAsset(assetId: string) {
  const database = await openAudioDatabase();

  if (!database) {
    return null;
  }

  const asset = await runStoreRequest<StoredAudioAsset | undefined>(
    database,
    "readonly",
    (store) => store.get(assetId),
  );

  return asset?.file ?? null;
}

function openAudioDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise<IDBDatabase | null>((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

function runStoreRequest<T = unknown>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<T>,
) {
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = createRequest(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}
