import sodium from 'libsodium-wrappers';
import { getFromDB, saveToDB } from './db';
import { showPasswordModal } from '../components/PasswordModal';

// Hold the decrypted private key in memory for a limited time
// TODO: Implement a more secure way to handle sensitive data in memory
let userDecryptedPrivateKey: string | null = null;

/**
 * Retrieves the recipient's public key from the server using the chat ID.
 *
 * @param chatId The chat ID to retrieve the recipient's public key for
 * @returns The recipient's public key as a Uint8Array
 * @throws Error if the request fails or the public key is not found
 */
const getRecipientPublicKey = async (chatId: string): Promise<Uint8Array> => {
	const res = await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/key/recipient/${chatId}`, {
		credentials: 'include',
	});

	const data = await res.json();
	if (!res.ok) {
		throw new Error('Failed to retrieve recipient public key');
	}

	return sodium.from_base64(data.publicKey);
};

/**
 * Derive an encryption key from the user's password using PBKDF2.
 *
 * @param password The user's password
 * @param salt The salt used in the key derivation process
 * @returns The derived encryption key
 */
const deriveEncryptionKey = async (password: string, salt: Uint8Array) => {
	const keyMaterial = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);

	const encryptionKey = await window.crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: 100000,
			hash: 'SHA-256',
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		true,
		['encrypt', 'decrypt']
	);

	return encryptionKey;
};

/**
 * Encrypt and store the private key using password-derived encryption.
 *
 * @param privateKey The private key to encrypt
 * @param password The password to derive the encryption key
 * @param userId The user ID to associate with the private key
 * @throws Error if the password is not provided or encryption fails
 */
const encryptAndStorePrivateKey = async (privateKey: string, password: string, userId: string) => {
	if (!password) {
		throw new Error('Password is required to encrypt the private key');
	}

	// Generate salt and IV
	const salt = window.crypto.getRandomValues(new Uint8Array(16));
	const iv = window.crypto.getRandomValues(new Uint8Array(12));

	const encryptionKey = await deriveEncryptionKey(password, salt);

	// Encrypt the private key using AES-GCM
	const encryptedPrivateKey = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptionKey, new TextEncoder().encode(privateKey));

	const encryptedData = {
		iv: sodium.to_base64(iv),
		salt: sodium.to_base64(salt),
		data: sodium.to_base64(new Uint8Array(encryptedPrivateKey)),
	};
	// Save to IndexedDB with userId as part of the key
	await saveToDB(`encryptedPrivateKey_${userId}`, encryptedData);
};

/**
 * Retrieve and decrypt the private key using the user's password.
 *
 * @param userId The user ID to retrieve the private key for
 * @param password The password to decrypt the private key. If not provided, a modal will be shown to enter the password.
 * @returns The decrypted private key as a string
 * @throws Error if the password is not provided or decryption fails
 */
export const getAndDecryptPrivateKey = async (userId: string, password?: string) => {
	let pswd = password || null;
	if (!password) {
		try {
			// Prompt for the user's password to decrypt the private key
			pswd = await showPasswordModal();
			if (!pswd) {
				throw new Error('ActionCanceled');
			}
		} catch {
			throw new Error('ActionCanceled');
		}
	}
	if (!pswd) {
		throw new Error('PasswordRequired');
	}

	// Retrieve the encrypted private key for the specific userId
	const encryptedData = (await getFromDB(`encryptedPrivateKey_${userId}`)) as { iv: string; salt: string; data: string };
	if (!encryptedData) {
		throw new Error('NoEncryptedKey');
	}

	const iv = sodium.from_base64(encryptedData.iv);
	const salt = sodium.from_base64(encryptedData.salt);
	const encryptedPrivateKey = sodium.from_base64(encryptedData.data);

	try {
		// Derive the decryption key using the password and salt
		const encryptionKey = await deriveEncryptionKey(pswd, salt);

		// Decrypt the private key
		const decryptedPrivateKey = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encryptionKey, encryptedPrivateKey);

		userDecryptedPrivateKey = new TextDecoder().decode(decryptedPrivateKey);

		setTimeout(
			() => {
				userDecryptedPrivateKey = null; // Clear from memory after timeout
				console.log('Private key cleared from memory.');
			},
			15 * 60 * 1000 // 15 minutes
		);

		return userDecryptedPrivateKey;
	} catch (error) {
		console.error('Error decrypting private key:', error);
		throw new Error('IncorrectPassword');
	}
};

// Cache for shared keys to avoid repeated calls to the server.
// TODO: Implement a more secure way to handle sensitive data in memory
const sharedKeyCache: Record<string, { key: Uint8Array; timestamp: number }> = {};
const CACHE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

/**
 * Retrieve the shared key for encryption/decryption in the chat.
 *
 * @param chatId The chat ID
 * @param userId The user ID to retrieve the private key for
 * @returns The shared key as a Uint8Array
 */
export const getSharedKey = async (chatId: string, userId: string) => {
	await sodium.ready;

	// Check if the shared key is cached and still valid
	const cached = sharedKeyCache[chatId];
	if (cached) {
		const now = Date.now();
		// If the cached key is still within the valid timeframe, return it
		if (now - cached.timestamp < CACHE_TIMEOUT) {
			return cached.key;
		} else {
			// If the cached key is expired, remove it
			delete sharedKeyCache[chatId];
		}
	}

	try {
		// Retrieve the recipient's public key from the server
		const recipientPublicKey = await getRecipientPublicKey(chatId);
		if (!recipientPublicKey) {
			throw new Error('RecipientPublicKeyNotFound');
		}

		let userPrivateKey;
		if (userDecryptedPrivateKey) {
			userPrivateKey = userDecryptedPrivateKey;
		} else {
			userPrivateKey = await getAndDecryptPrivateKey(userId);
		}

		const sharedKey = sodium.crypto_scalarmult(sodium.from_base64(userPrivateKey), recipientPublicKey);

		// Cache the shared key with a timestamp
		sharedKeyCache[chatId] = {
			key: sharedKey,
			timestamp: Date.now(),
		};

		return sharedKey;
	} catch (error) {
		console.error('Error retrieving shared key:', error);
		throw error;
	}
};

/**
 * Create a new key pair (private and public keys) and encrypt the private key.
 *
 * @param password The password to encrypt the private key
 * @param userId The user ID to associate with the key pair
 * @returns The generated public key as a string
 */
export const createKeyPair = async (password: string, userId: string) => {
	await sodium.ready;

	const keyPair = sodium.crypto_box_keypair();
	const privateKey = sodium.to_base64(keyPair.privateKey);
	const publicKey = sodium.to_base64(keyPair.publicKey);

	await encryptAndStorePrivateKey(privateKey, password, userId);

	return publicKey;
};

/**
 * Clear the cached keys and the decrypted private key from memory.
 */
export const clearKeys = () => {
	userDecryptedPrivateKey = null;
	Object.keys(sharedKeyCache).forEach((key) => {
		delete sharedKeyCache[key];
	});
};
