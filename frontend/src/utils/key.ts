import sodium from 'libsodium-wrappers';
import { getFromDB, saveToDB } from './db';

/**
 * Retrieves the recipient's public key from the server using the chat ID.
 *
 * @param chatId The chat ID to retrieve the recipient's public key for
 * @returns The recipient's public key as a Uint8Array
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

export const getSharedKey = async (chatId: string) => {
	await sodium.ready;

	try {
		const recipientPublicKey = await getRecipientPublicKey(chatId);
		if (!recipientPublicKey) {
			throw new Error('Failed to retrieve recipient public key');
		}

		const userPrivateKey = await getPrivateKey();

		const sharedKey = sodium.crypto_scalarmult(userPrivateKey, recipientPublicKey);

		return sharedKey;
	} catch (error) {
		console.error('Error retrieving shared key:', error);
		throw error;
	}
};

export const createKeyPair = async () => {
	await sodium.ready;

	const keyPair = sodium.crypto_box_keypair();
	const privateKey = sodium.to_base64(keyPair.privateKey);
	const publicKey = sodium.to_base64(keyPair.publicKey);

	await saveToDB('privateKey', privateKey);

	return { privateKey, publicKey };
};

export const getPrivateKey = async () => {
	await sodium.ready;

	const privateKeyBase64 = (await getFromDB('privateKey')) as string;
	if (!privateKeyBase64) {
		throw new Error('Private key not found in IndexedDB');
	}

	return sodium.from_base64(privateKeyBase64 || '');
};
