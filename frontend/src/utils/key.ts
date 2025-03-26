import sodium from 'libsodium-wrappers';

/**
 * Derives a shared key for a chat.
 *
 * @param {string} chatId The chat ID.
 * @returns {Uint8Array} The derived shared key (32 bytes).
 */
export const getSharedKey = async (chatId: string) => {
	try {
		await sodium.ready;

		// Generate a new client key pair
		const clientKeyPair = sodium.crypto_kx_keypair();

		// Save client's public key to backend (Base64-encoded)
		await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/key/${chatId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ clientPublicKey: sodium.to_base64(clientKeyPair.publicKey) }),
		});

		// Fetch the recipient's public key
		const recipientRes = await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/key/recipient/${chatId}`, {
			credentials: 'include',
		});

		const recipientData = await recipientRes.json();
		if (!recipientRes.ok) {
			throw new Error('Failed to retrieve recipient public key');
		}

		// Decode the recipient's public key from Base64
		const recipientPublicKey = sodium.from_base64(recipientData.publicKey);

		// Derive the shared key
		const sharedKey = sodium.crypto_kx_client_session_keys(clientKeyPair.publicKey, clientKeyPair.privateKey, recipientPublicKey).sharedRx;
		return sharedKey;
	} catch (error) {
		console.error('Error getting shared key:', error);
		alert('Error deriving shared key. Please try again.');
		throw new Error('Error getting shared key');
	}
};
