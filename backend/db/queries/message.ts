import db from '../knex';
import { chatTableName, messageTableName } from '../initDB';

/**
 * Returns the messages for a chat.
 *
 * @param chatId The chat ID
 * @returns The messages for the chat
 * @throws Error if there is an issue retrieving the messages
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
 * @returns The saved message along with the recipient ID
 * @throws Error if there is an issue saving the message
 */
export const saveMessage = async (chatId: string, senderId: string, encryptedContent: string) => {
	try {
		// Find the recipient ID based on the chatId and senderId
		const chat = await db(chatTableName).select('user1_id', 'user2_id').where({ id: chatId }).first();

		if (!chat) {
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
	} catch (error) {
		console.error('Error saving message:', error);
		throw new Error(`Error saving message: ${error}`);
	}
};
