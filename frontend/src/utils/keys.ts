import sodium from 'libsodium-wrappers';

/**
 * Retrieves the shared secret key for a given chat.
 *
 * @param {string} chatId The chat ID.
 * @returns {Promise<Uint8Array>} The shared secret key.
 */
export const getSharedKey = async (chatId: string) => {
	return new Uint8Array(32); // Placeholder

	// TODO: Implement key exchange flow
	await sodium.ready;

	// Example logic - Adjust according to your key exchange flow
	const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/key/${chatId}`, {
		credentials: 'include',
	});

	if (!res.ok) {
		throw new Error('Failed to retrieve shared key');
	}

	const { sharedKey } = await res.json();
	return sodium.from_base64(sharedKey);
};
