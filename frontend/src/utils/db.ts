const DB_NAME = import.meta.env.DB_NAME || 'chat';
const STORE_NAME = import.meta.env.STORE_NAME || 'keys';

/**
 * Opens the IndexedDB database.
 *
 * @returns {Promise<IDBDatabase>} The opened IndexedDB database.
 */
const openDB = () => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);

		request.onupgradeneeded = (event) => {
			const target = event.target as IDBOpenDBRequest;
			if (!target) {
				throw new Error('event.target is null');
			}
			const db = target.result;
			// Check if the object store already exists and create it if not
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
};

/**
 * Saves a value to the IndexedDB database under the specified key.
 *
 * @param key The key to save the value under
 * @param value The value to save
 */
export const saveToDB = async (key: string, value: any) => {
	const db = (await openDB()) as IDBDatabase;
	const transaction = db.transaction(STORE_NAME, 'readwrite');
	const store = transaction.objectStore(STORE_NAME);
	store.put(value, key);
};

/**
 * Retrieves a value from the IndexedDB database using the specified key.
 *
 * @param key The key to retrieve the value from
 * @returns The value associated with the key
 */
export const getFromDB = async (key: string) => {
	const db = (await openDB()) as IDBDatabase;
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get(key);

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
};
