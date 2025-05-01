import { env } from './env';

/**
 * Opens the IndexedDB database.
 *
 * @returns {IDBDatabase} The opened IndexedDB database
 * @throws {Error} If the event target is null
 */
const openDB = () => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(env.INDEXED_DB_NAME, 1);

		request.onupgradeneeded = (event) => {
			const target = event.target as IDBOpenDBRequest;
			if (!target) {
				throw new Error('event.target is null');
			}
			const db = target.result;
			// Check if the object store already exists and create it if not
			if (!db.objectStoreNames.contains(env.STORE_NAME)) {
				db.createObjectStore(env.STORE_NAME);
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
};

/**
 * Saves a value to the IndexedDB database under the specified key.
 *
 * @param {string} key The key to save the value under
 * @param {any} value The value to save
 */
export const saveToDB = async (key: string, value: any) => {
	const db = (await openDB()) as IDBDatabase;
	const transaction = db.transaction(env.STORE_NAME, 'readwrite');
	const store = transaction.objectStore(env.STORE_NAME);
	store.put(value, key);
};

/**
 * Retrieves a value from the IndexedDB database using the specified key.
 *
 * @param {string} key The key to retrieve the value for
 * @returns {any} The value associated with the key
 */
export const getFromDB = async (key: string) => {
	const db = (await openDB()) as IDBDatabase;
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(env.STORE_NAME, 'readonly');
		const store = transaction.objectStore(env.STORE_NAME);
		const request = store.get(key);

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
};
