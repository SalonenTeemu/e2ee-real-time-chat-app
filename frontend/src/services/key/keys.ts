import sodium from 'libsodium-wrappers';
import { keyManager } from './keyManager';
import { saveToDB } from '../../utils/db';

/**
 * Encrypt and store the private key using password-derived encryption.
 *
 * @param privateKey The private key to encrypt
 * @param password The password to derive the encryption key
 * @param userId The user ID to associate with the private key
 * @throws Error if the password is not provided or encryption fails
 */
export const encryptAndStorePrivateKey = async (privateKey: Uint8Array, password: string, userId: string) => {
	if (!password) {
		throw new Error('Password is required to encrypt the private key');
	}

	// Generate salt and IV
	const salt = window.crypto.getRandomValues(new Uint8Array(16));
	const iv = window.crypto.getRandomValues(new Uint8Array(12));

	const encryptionKey = await keyManager.deriveEncryptionKey(password, salt);

	// Encrypt the private key using AES-GCM
	const encryptedPrivateKey = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptionKey, privateKey);

	const encryptedData = {
		iv: sodium.to_base64(iv),
		salt: sodium.to_base64(salt),
		data: sodium.to_base64(new Uint8Array(encryptedPrivateKey)),
	};

	// Save to IndexedDB with userId as part of the key
	await saveToDB(`encryptedPrivateKey_${userId}`, encryptedData);
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

	// Generate a new key pair
	const keyPair = sodium.crypto_box_keypair();
	const privateKey = keyPair.privateKey;
	const publicKey = sodium.to_base64(keyPair.publicKey);

	await encryptAndStorePrivateKey(privateKey, password, userId);

	return publicKey;
};

/**
 * Retrieve the shared key for encryption/decryption in the chat.
 *
 * @param chatId The chat ID
 * @param userId The user ID to retrieve the private key for
 * @returns The shared key as a Uint8Array
 */
export const getSharedKey = async (chatId: string, userId: string) => {
	await sodium.ready;

	try {
		const sharedKey = await keyManager.getSharedKey(chatId, userId);
		return sharedKey;
	} catch (error) {
		console.error('Error retrieving shared key:', error);
		throw error;
	}
};

/**
 * Retrieve the decrypted private key for a specific user ID.
 *
 * @param userId The user ID to retrieve the private key for
 * @param password The password to decrypt the private key or null to prompt the user for it
 */
export const getDecryptedPrivateKey = async (userId: string, password?: string) => {
	keyManager.getDecryptedPrivateKey(userId, password);
};

/**
 * Clear the private key and shared keys from memory and cache.
 */
export const clearKeys = () => {
	keyManager.clearKeys();
};
