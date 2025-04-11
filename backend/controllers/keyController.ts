import { Response } from 'express';
import { CustomRequest } from '../middleware/user';
import { getChatById } from '../db/queries/chat';
import { getPublicKeyByUserId, saveUserPublicKey } from '../db/queries/key';
import { validatePublicKey } from '../utils/validate';
import logger from '../utils/logger';

/**
 * Responds to a GET request to get the recipient's public key.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const getRecipientPublicKey = async (req: CustomRequest, res: Response): Promise<any> => {
	const { chatId } = req.params;
	const { id: userId } = req.user;

	if (!chatId) {
		logger.warn(`Retrieving recipient public key failed for user ${userId}, chat ID is required`);
		return res.status(400).json({ message: 'Chat ID is required' });
	}
	try {
		const chat = await getChatById(chatId);
		if (!chat) {
			logger.warn(`Retrieving recipient public key failed for user ${userId}, chat not found for ID: ${chatId}`);
			return res.status(404).json({ message: 'Chat not found' });
		}
		if (chat.user1_id !== userId && chat.user2_id !== userId) {
			logger.warn(`Retrieving recipient public key failed, user ${userId} is not part of the chat with ID: ${chatId}`);
			return res.status(403).json({ message: 'Unauthorized' });
		}

		const recipientPublicKey = await getPublicKeyByUserId(chat.user1_id === userId ? chat.user2_id : chat.user1_id);
		if (!recipientPublicKey) {
			logger.warn(`Retrieving recipient public key failed for user ${userId}, recipient public key not found for chat ID: ${chatId}`);
			return res.status(404).json({ message: 'Recipient public key not found' });
		}

		logger.info(`Recipient public key retrieved successfully for user ${userId}, chat ID: ${chatId}`);
		return res.status(200).json({ publicKey: recipientPublicKey });
	} catch (error: any) {
		logger.error(`Error getting recipient public key for user ${userId}: ${error}`);
		return res.status(500).json({ message: 'Error getting recipient public key' });
	}
};

/**
 * Responds to a POST request to save the user's public key.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const savePublicKey = async (req: CustomRequest, res: Response): Promise<any> => {
	const { publicKey } = req.body;
	const { id: userId } = req.user;

	// Validate the public key
	const publicKeyValidation = validatePublicKey(publicKey);
	if (!publicKeyValidation.success) {
		logger.warn(`Saving public key failed for user ${userId}, invalid public key - ${publicKeyValidation.message}`);
		return res.status(400).json({ message: publicKeyValidation.message });
	}
	try {
		const existingPublicKey = await getPublicKeyByUserId(userId);
		if (existingPublicKey) {
			logger.warn(`Saving public key failed for user ${userId}, public key already exists`);
			return res.status(400).json({ message: 'Public key already exists' });
		}
		// Save the public key to the database
		await saveUserPublicKey(userId, publicKey);

		logger.info(`Public key saved successfully for user ${userId}`);
		return res.status(200).json({ message: 'Public key saved successfully' });
	} catch (error: any) {
		logger.error(`Error saving public key for user ${userId}: ${error}`);
		return res.status(500).json({ message: 'Error saving public key' });
	}
};
