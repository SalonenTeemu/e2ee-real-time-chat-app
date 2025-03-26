import sodium from 'libsodium-wrappers';

/**
 * Encrypts a message using XChaCha20-Poly1305.
 *
 * @param {string} message The plaintext message.
 * @param {Uint8Array} sharedKey The derived shared secret key (32 bytes).
 * @returns {string} The encrypted message (Base64 encoded).
 */
export const encryptMessage = async (message: string, sharedKey: Uint8Array) => {
	await sodium.ready;

	const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
	const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
		message,
		null, // Additional authenticated data (optional)
		null, // Secret key (32 bytes)
		nonce, // Nonce (24 bytes)
		sharedKey // Shared secret key (32 bytes)
	);

	console.log('Message encryption');
	console.log('Shared Key:', sodium.to_base64(sharedKey));
	console.log('Nonce (Base64):', sodium.to_base64(nonce));
	console.log('Encrypted (Base64):', sodium.to_base64(encrypted));

	return `${sodium.to_base64(nonce)}:${sodium.to_base64(encrypted)}`;
};

/**
 * Decrypts a message using XChaCha20-Poly1305.
 *
 * @param {string} encryptedData The encrypted message (nonce:message format).
 * @param {Uint8Array} sharedKey The derived shared secret key (32 bytes).
 * @returns {string} The decrypted plaintext message.
 */
export const decryptMessage = async (encryptedData: string, sharedKey: Uint8Array) => {
	await sodium.ready;

	const [nonceBase64, encryptedBase64] = encryptedData.split(':');
	const nonce = sodium.from_base64(nonceBase64);
	const encrypted = sodium.from_base64(encryptedBase64);

	console.log('Message decryption');
	console.log('Shared Key:', sodium.to_base64(sharedKey));
	console.log('Nonce (Base64):', nonceBase64);
	console.log('Encrypted (Base64):', encryptedBase64);

	try {
		const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, encrypted, null, nonce, sharedKey);
		return sodium.to_string(decrypted);
	} catch (error) {
		console.error('Decryption failed:', error);
		throw new Error('Decryption failed');
	}
};
