import sodium from 'libsodium-wrappers';
import { getFromDB } from '../../utils/db';
import { showPasswordModal } from '../../components/auth-recovery/PasswordModal';

/**
 * KeyManager class to handle key management, including private key decryption and shared key generation.
 */
class KeyManager {
	// The decrypted private key for the user
	private userDecryptedPrivateKey: Uint8Array | null = null;

	// Cache for shared keys to avoid fetching and recomputing them frequently
	private sharedKeyCache: Record<string, { key: Uint8Array; timestamp: number }> = {};

	constructor(
		private timeout: number = 5 * 60 * 1000, // Timeout for inactivity and for shared key expiration (5 minutes)
		private checkInterval: number = 1 * 60 * 1000 // Interval for checking inactivity (1 minute)
	) {
		this.setupInactivityCheck();
	}

	/**
	 * Sets up an inactivity check to clear keys after a specified timeout.
	 */
	private setupInactivityCheck() {
		let lastInteractionTime = Date.now();
		document.addEventListener('click', () => (lastInteractionTime = Date.now()));
		document.addEventListener('keydown', () => (lastInteractionTime = Date.now()));
		document.addEventListener('visibilitychange', () => {
			lastInteractionTime = Date.now();
		});

		// Check for inactivity at regular intervals and clear keys if inactive
		setInterval(() => {
			if (Date.now() - lastInteractionTime > this.timeout) {
				this.clearKeys();
				console.log('Private key and shared keys cleared due to inactivity.');
			}
		}, this.checkInterval);
	}

	/**
	 * Retrieves the decrypted private key for the user. If the key is already decrypted, it returns the cached version.
	 *
	 * @param userId The user ID to retrieve the decrypted private key for
	 * @param password The password to decrypt the private key (optional)
	 * @returns The decrypted private key as a Uint8Array
	 */
	public async getDecryptedPrivateKey(userId: string, password?: string): Promise<Uint8Array> {
		if (this.userDecryptedPrivateKey) {
			return this.userDecryptedPrivateKey;
		}

		const decryptedKey = await this.decryptPrivateKey(userId, password);
		this.userDecryptedPrivateKey = decryptedKey;
		return decryptedKey;
	}

	/**
	 * Retrieves the encrypted private key for the user from the Indexed database and decrypts it.
	 * Uses the provided password or prompts the user for it if not provided.
	 *
	 * @param userId The user ID to retrieve the encrypted private key for
	 * @param password The password to decrypt the private key (optional)
	 * @returns The decrypted private key as a Uint8Array
	 * @throws Error if the decryption fails or if the password is incorrect or canceled
	 */
	private async decryptPrivateKey(userId: string, password?: string): Promise<Uint8Array> {
		let pswd = password || null;
		if (!pswd) {
			try {
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

		try {
			// Retrieve the encrypted private key for the specific userId
			const encryptedData = (await getFromDB(`encryptedPrivateKey_${userId}`)) as { salt: string; nonce: string; data: string };
			if (!encryptedData) {
				throw new Error('NoEncryptedKey');
			}

			// Decode the base64 strings to Uint8Arrays
			const salt = sodium.from_base64(encryptedData.salt);
			const nonce = sodium.from_base64(encryptedData.nonce);
			const encryptedPrivateKey = sodium.from_base64(encryptedData.data);

			// Derive the encryption key using PBKDF2 with the provided password and salt
			const encryptionKey = await this.deriveEncryptionKey(pswd, salt);
			const rawEncryptionKey = await window.crypto.subtle.exportKey('raw', encryptionKey);

			// Decrypt the private key using crypto_secretbox_open_easy
			const decryptedPrivateKey = sodium.crypto_secretbox_open_easy(encryptedPrivateKey, nonce, new Uint8Array(rawEncryptionKey));

			if (!decryptedPrivateKey) {
				throw new Error('IncorrectPassword');
			}

			return decryptedPrivateKey;
		} catch (error: any) {
			console.error('Error decrypting private key:', error);
			if (error.message === 'NoEncryptedKey') {
				throw new Error('NoEncryptedKey');
			} else {
				throw new Error('IncorrectPassword');
			}
		}
	}

	/**
	 * Derives an encryption key using PBKDF2 with the provided password and salt.
	 *
	 * @param password The password to derive the encryption key
	 * @param salt The salt used for key derivation
	 * @returns The derived encryption key as a CryptoKey object
	 * @throws Error if the key derivation fails
	 */
	async deriveEncryptionKey(password: string, salt: Uint8Array) {
		try {
			// Import the password as raw data for use in PBKDF2 key derivation
			const keyMaterial = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, [
				'deriveKey',
			]);

			// Derive the encryption key using PBKDF2 with SHA-256
			return await window.crypto.subtle.deriveKey(
				{
					name: 'PBKDF2',
					salt,
					iterations: 100000,
					hash: 'SHA-256',
				},
				keyMaterial,
				{ name: 'AES-GCM', length: 256 }, // AES-GCM key
				true,
				['encrypt', 'decrypt']
			);
		} catch (error) {
			console.error('Error deriving encryption key:', error);
			throw new Error('KeyDerivationFailed');
		}
	}

	/**
	 * Retrieves the shared key for encryption/decryption in the chat.
	 *
	 * @param chatId The chat ID to retrieve the shared key for
	 * @param userId The user ID to retrieve the private key for
	 * @returns The shared key as a Uint8Array
	 * @throws Error if the recipient public key is not found or if the private key decryption fails
	 */
	async getSharedKey(chatId: string, userId: string): Promise<Uint8Array> {
		await sodium.ready;

		// Check if the shared key is already cached and not expired
		const cached = this.sharedKeyCache[chatId];
		if (cached && Date.now() - cached.timestamp < this.timeout) {
			return cached.key;
		}

		// Retrieve the recipient public key for the chat ID from the server
		const recipientPublicKey = await this.getRecipientPublicKey(chatId);
		if (!recipientPublicKey) {
			throw new Error('RecipientPublicKeyNotFound');
		}

		// Decrypt and retrieve the user's private key
		const userPrivateKey = await this.getDecryptedPrivateKey(userId);

		const sharedKey = sodium.crypto_scalarmult(userPrivateKey, recipientPublicKey);

		// Derive a session key from the shared key using a keyed derivation function (KDF)
		const context = sodium.crypto_generichash(8, chatId); // 8-byte context
		const sessionKey = sodium.crypto_kdf_derive_from_key(32, 0, sodium.to_base64(context), sharedKey);

		// Clear the private key and shared key from memory
		sodium.memzero(userPrivateKey);
		sodium.memzero(sharedKey);

		// Cache the session key with a timestamp
		this.sharedKeyCache[chatId] = { key: sessionKey, timestamp: Date.now() };

		return sessionKey;
	}

	/**
	 * Retrieves the recipient public key for a given chat ID from the server.
	 *
	 * @param chatId The chat ID to retrieve the recipient public key for
	 * @returns The recipient public key as a Uint8Array or null if not found
	 */
	private async getRecipientPublicKey(chatId: string): Promise<Uint8Array | null> {
		const res = await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/key/recipient/${chatId}`, {
			credentials: 'include',
		});
		const data = await res.json();
		if (!res.ok || !data.publicKey) return null;
		return sodium.from_base64(data.publicKey);
	}

	/**
	 * Clears the private key and shared keys from memory and cache.
	 */
	clearKeys() {
		if (this.userDecryptedPrivateKey) {
			sodium.memzero(this.userDecryptedPrivateKey);
		}
		this.userDecryptedPrivateKey = null;
		Object.keys(this.sharedKeyCache).forEach((key) => {
			sodium.memzero(this.sharedKeyCache[key].key);
		});
		this.sharedKeyCache = {};
	}
}

export const keyManager = new KeyManager();
