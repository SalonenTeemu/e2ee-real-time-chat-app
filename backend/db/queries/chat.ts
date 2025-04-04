import db from '../knex';
import { chatTableName, userTableName } from '../initDB';

/**
 * Returns a chat by the chat ID.
 *
 * @param chatId The chat ID
 * @returns The chat if it exists
 * @throws Error if there is an issue retrieving the chat
 */
export const getChatById = async (chatId: string) => {
	try {
		return await db(chatTableName).where({ id: chatId }).first();
	} catch (error) {
		console.error('Error getting chat:', error);
		throw new Error(`Error getting chat: ${error}`);
	}
};

/**
 * Returns a chat by the user IDs.
 *
 * @param userId1 The user ID of the first user
 * @param userId2 The user ID of the second user
 * @returns The chat if it exists
 * @throws Error if there is an issue retrieving the chat
 */
export const getChatByUsers = async (userId1: string, userId2: string) => {
	try {
		return await db(chatTableName).where({ user1_id: userId1, user2_id: userId2 }).orWhere({ user1_id: userId2, user2_id: userId1 }).first();
	} catch (error) {
		console.error('Error getting chat:', error);
		throw new Error(`Error getting chat: ${error}`);
	}
};

/**
 * Returns the chats for a user, including the other user's username.
 *
 * @param userId The user ID
 * @returns The chats for the user with the other user's username
 * @throws Error if there is an issue retrieving the chats
 */
export const getChatsByUserId = async (userId: string) => {
	try {
		const chats = await db(chatTableName)
			.join(`${userTableName} as u1`, 'u1.id', '=', `${chatTableName}.user1_id`)
			.join(`${userTableName} as u2`, 'u2.id', '=', `${chatTableName}.user2_id`)
			.where({ user1_id: userId })
			.orWhere({ user2_id: userId })
			.select(`${chatTableName}.*`, db.raw(`CASE WHEN user1_id = ? THEN u2.username ELSE u1.username END as other_username`, [userId]));
		return chats;
	} catch (error) {
		console.error('Error getting chats:', error);
		throw new Error(`Error getting chats: ${error}`);
	}
};

/**
 * Create a chat.
 *
 * @param userId1 The user ID of the first user
 * @param userId2 The user ID of the second user
 * @returns The chat ID
 * @throws Error if there is an issue creating the chat
 */
export const createChat = async (userId1: string, userId2: string) => {
	try {
		const chat = await db(chatTableName).insert({ user1_id: userId1, user2_id: userId2 }).returning('id');
		return chat[0];
	} catch (error) {
		console.error('Error creating chat:', error);
		throw new Error(`Error creating chat: ${error}`);
	}
};
