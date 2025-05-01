import db from '../knex';
import { chatTableName, messageTableName } from '../initDB';
import logger from '../../utils/logger';

/**
 * Returns the messages for a chat.
 *
 * @param {string} chatId The chat ID
 * @returns {any} The messages for the chat
 * @throws {Error} If there is an issue retrieving the messages
 */
export const getChatMessagesById = async (chatId: string) => {
	try {
		return await db(messageTableName).where({ chat_id: chatId }).orderBy('created_at', 'asc');
	} catch (error: any) {
		logger.error(`Error getting messages for chat ID ${chatId} from DB: ${error}`);
		throw new Error(`Error getting chat: ${error}`);
	}
};

/**
 * Save a message to the database.
 *
 * @param {string} chatId The chat ID
 * @param {string} senderId The sender ID
 * @param {string} encryptedContent The encrypted message content
 * @returns {any} The saved message along with the recipient ID
 * @throws {Error} If there is an issue saving the message
 */
export const saveMessage = async (chatId: string, senderId: string, encryptedContent: string) => {
	try {
		// Find the recipient ID based on the chatId and senderId
		const chat = await db(chatTableName).select('user1_id', 'user2_id').where({ id: chatId }).first();

		// Check if the chat exists
		if (!chat) {
			logger.error(`Error saving message to DB: Chat not found for ID ${chatId}`);
			throw new Error('Chat not found');
		}

		const recipientId = chat.user1_id === senderId ? chat.user2_id : chat.user1_id;

		// Insert the new message
		const [newMessage] = await db(messageTableName)
			.insert({
				chat_id: chatId,
				sender_id: senderId,
				content: encryptedContent,
			})
			.returning('*');

		// Return the new message along with the recipient ID
		return { ...newMessage, recipientId };
	} catch (error: any) {
		logger.error(`Error saving message to DB: ${error}`);
		throw new Error(`Error saving message: ${error}`);
	}
};
