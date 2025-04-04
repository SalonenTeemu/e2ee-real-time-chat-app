import { Response } from 'express';
import { CustomRequest } from '../middleware/user';
import { getChatById } from '../db/queries/chat';
import { getPublicKeyByUserId, saveUserPublicKey } from '../db/queries/key';
import { validatePublicKey } from '../utils/validate';

/**
 * Responds to a GET request to get the recipient's public key.
 *
 * @param req The request object
 * @param res The response object
 * @returns The recipient's public key
 */
export const getRecipientPublicKey = async (req: CustomRequest, res: Response): Promise<any> => {
	const { chatId } = req.params;
	const { id: userId } = req.user;

	if (!chatId) {
		return res.status(400).json({ message: 'Chat ID is required' });
	}
	try {
		const chat = await getChatById(chatId);
		if (!chat) {
			return res.status(404).json({ message: 'Chat not found' });
		}
		if (chat.user1_id !== userId && chat.user2_id !== userId) {
			return res.status(403).json({ message: 'Unauthorized' });
		}

		const recipientPublicKey = await getPublicKeyByUserId(chat.user1_id === userId ? chat.user2_id : chat.user1_id);
		if (!recipientPublicKey) {
			return res.status(404).json({ message: 'Recipient public key not found' });
		}

		return res.status(200).json({ publicKey: recipientPublicKey });
	} catch (error) {
		console.error('Error getting recipient public key:', error);
		return res.status(500).json({ message: 'Error getting recipient public key' });
	}
};

/**
 * Responds to a POST request to save the user's public key.
 *
 * @param req The request object
 * @param res The response object
 * @returns The response
 */
export const savePublicKey = async (req: CustomRequest, res: Response): Promise<any> => {
	const { publicKey } = req.body;
	const { id: userId } = req.user;

	// Validate the public key
	const publicKeyValidation = validatePublicKey(publicKey);
	if (!publicKeyValidation.success) {
		return res.status(400).json({ message: publicKeyValidation.message });
	}
	try {
		const existingPublicKey = await getPublicKeyByUserId(userId);
		if (existingPublicKey) {
			return res.status(400).json({ message: 'Public key already exists' });
		}
		// Save the public key to the database
		await saveUserPublicKey(userId, publicKey);
		return res.status(200).json({ message: 'Public key saved successfully' });
	} catch (error) {
		console.error('Error saving public key:', error);
		return res.status(500).json({ message: 'Error saving public key' });
	}
};
