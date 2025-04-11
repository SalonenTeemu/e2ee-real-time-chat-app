import sodium from 'libsodium-wrappers';
import { keyManager } from './keyManager';
import { mnemonicToPrivateKey } from '../../utils/seed';
import { saveToDB } from '../../utils/db';

/**
 * Encrypt and store the private key using password-derived encryption.
 *
 * @param {Uint8Array} privateKey The private key to encrypt
 * @param {string} password The password to derive the encryption key
 * @param {string} userId The user ID to associate with the private key
 * @throws {Error} If the password is not provided or encryption fails
 */
export const encryptAndStorePrivateKey = async (privateKey: Uint8Array, password: string, userId: string) => {
	if (!password) {
		throw new Error('Password is required to encrypt the private key');
	}

	// Generate salt and nonce
	const salt = window.crypto.getRandomValues(new Uint8Array(16));
	const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

	// Derive the encryption key using the password and salt
	const encryptionKey = await keyManager.deriveEncryptionKey(password, salt);

	// Export the raw key material from the CryptoKey
	const rawKey = new Uint8Array(await window.crypto.subtle.exportKey('raw', encryptionKey));

	// Encrypt the private key using crypto_secretbox_easy (XSalsa20-Poly1305)
	const encryptedPrivateKey = sodium.crypto_secretbox_easy(privateKey, nonce, rawKey);

	// Store encrypted data (encryptedPrivateKey) with salt and nonce
	const encryptedData = {
		salt: sodium.to_base64(salt),
		nonce: sodium.to_base64(nonce),
		data: sodium.to_base64(encryptedPrivateKey),
	};

	// Save the data to IndexedDB with userId as part of the key
	await saveToDB(`encryptedPrivateKey_${userId}`, encryptedData);
};

/**
 * Create a key pair (public and private keys) using a mnemonic seed phrase and encrypt and store the private key.
 *
 * @param {string} password The password to derive the encryption key
 * @param {string} userId The user ID to associate with the private key
 * @param {string} mnemonic The mnemonic seed phrase to generate the key pair
 * @returns {string} The public key as a base64 string
 */
export const createKeyPair = async (password: string, userId: string, mnemonic: string) => {
	await sodium.ready;

	const keys = await mnemonicToPrivateKey(mnemonic, password);
	const privateKey = keys.privateKey;
	const publicKey = sodium.to_base64(keys.publicKey);

	await encryptAndStorePrivateKey(privateKey, password, userId);

	return publicKey;
};

/**
 * Retrieve the shared key for encryption/decryption in the chat.
 *
 * @param {string} chatId The chat ID to retrieve the shared key for
 * @param {string} userId The user ID to retrieve the shared key for
 * @returns {Uint8Array} The shared key for the chat
 * @throws {Error} If the shared key retrieval fails
 */
export const getSharedKey = async (chatId: string, userId: string) => {
	await sodium.ready;

	const sharedKey = await keyManager.getSharedKey(chatId, userId);
	return sharedKey;
};

/**
 * Retrieve the decrypted private key for a specific user ID.
 *
 * @param {string} userId The user ID to retrieve the private key for
 * @param {string} password The password to decrypt the private key if given or null to prompt the user for it
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
