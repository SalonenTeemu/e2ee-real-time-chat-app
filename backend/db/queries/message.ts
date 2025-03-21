import db from '../knex';
import { messageTableName } from '../initDB';

/**
 * Returns the messages for a chat.
 *
 * @param chatId The chat ID
 * @returns The messages for the chat
 */
export const getChatMessagesById = async (chatId: string) => {
	try {
		return await db(messageTableName).where({ chat_id: chatId }).orderBy('created_at', 'asc');
	} catch (error) {
		console.error('Error getting chat:', error);
		throw new Error(`Error getting chat: ${error}`);
	}
};

/**
 * Save a message to the database.
 *
 * @param chatId The chat ID
 * @param senderId The sender ID
 * @param encryptedContent The encrypted message content
 */
export const saveMessage = async (chatId: string, senderId: string, encryptedContent: string) => {
	try {
		const [newMessage] = await db(messageTableName)
			.insert({
				chat_id: chatId,
				sender_id: senderId,
				content: encryptedContent,
			})
			.returning('*');
		return newMessage;
	} catch (error) {
		console.error('Error saving message:', error);
		throw new Error(`Error saving message: ${error}`);
	}
};
