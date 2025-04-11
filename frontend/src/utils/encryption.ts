import sodium from 'libsodium-wrappers';

/**
 * Encrypts a message using XChaCha20-Poly1305.
 *
 * @param {string} message The plaintext message
 * @param {Uint8Array} sharedKey The derived shared secret key (32 bytes)
 * @returns {string} The encrypted message (Base64 encoded)
 * @throws {Error} If encryption fails
 */
export const encryptMessage = async (message: string, sharedKey: Uint8Array) => {
	await sodium.ready;

	try {
		// Generate a random nonce
		const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

		// Encrypt the message using XChaCha20-Poly1305
		const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
			message,
			null, // Additional authenticated data (optional)
			null, // Secret nonce (optional)
			nonce, // Nonce (24 bytes)
			sharedKey // Shared secret key (32 bytes)
		);

		return `${sodium.to_base64(nonce)}:${sodium.to_base64(encrypted)}`;
	} catch (error) {
		console.error('Encryption failed:', error);
		throw new Error('Encryption failed');
	}
};

/**
 * Decrypts a message using XChaCha20-Poly1305.
 *
 * @param {string} encryptedData The encrypted message (nonce:message format)
 * @param {Uint8Array} sharedKey The derived shared secret key (32 bytes)
 * @returns {string} The decrypted plaintext message
 * @throws {Error} If decryption fails
 */
export const decryptMessage = async (encryptedData: string, sharedKey: Uint8Array) => {
	await sodium.ready;

	try {
		// Split the nonce and encrypted message
		const [nonceBase64, encryptedBase64] = encryptedData.split(':');
		const nonce = sodium.from_base64(nonceBase64);
		const encrypted = sodium.from_base64(encryptedBase64);

		// Decrypt the message using XChaCha20-Poly1305
		const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, encrypted, null, nonce, sharedKey);
		return sodium.to_string(decrypted);
	} catch (error) {
		console.error('Decryption failed:', error);
		throw new Error('Decryption failed');
	}
};
