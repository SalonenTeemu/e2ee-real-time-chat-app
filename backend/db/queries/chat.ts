import db from '../knex';
import { chatTableName, userTableName } from '../initDB';
import logger from '../../utils/logger';

/**
 * Returns a chat by the chat ID.
 *
 * @param {string} chatId The chat ID
 * @returns {any} The chat if it exists
 * @throws {Error} If there is an issue retrieving the chat
 */
export const getChatById = async (chatId: string) => {
	try {
		return await db(chatTableName).where({ id: chatId }).first();
	} catch (error: any) {
		logger.error(`Error getting chat with ID ${chatId} from DB: ${error}`);
		throw new Error(`Error getting chat: ${error}`);
	}
};

/**
 * Returns a chat by the user IDs.
 *
 * @param {string} userId1 The user ID of the first user
 * @param {string} userId2 The user ID of the second user
 * @returns {any} The chat if it exists
 * @throws {Error} If there is an issue retrieving the chat
 */
export const getChatByUsers = async (userId1: string, userId2: string) => {
	try {
		return await db(chatTableName).where({ user1_id: userId1, user2_id: userId2 }).orWhere({ user1_id: userId2, user2_id: userId1 }).first();
	} catch (error: any) {
		logger.error(`Error getting chat by users ${userId1} and ${userId2} from DB: ${error}`);
		throw new Error(`Error getting chat: ${error}`);
	}
};

/**
 * Returns the chats for a user, including the other user's username.
 *
 * @param {string} userId The user ID of the user
 * @returns {any} The chats for the user with the other user's username
 * @throws {Error} If there is an issue retrieving the chats
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
	} catch (error: any) {
		logger.error(`Error getting chats for user ${userId} from DB: ${error}`);
		throw new Error(`Error getting chats: ${error}`);
	}
};

/**
 * Create a chat between two users.
 *
 * @param {string} userId1 The user ID of the first user
 * @param {string} userId2 The user ID of the second user
 * @returns {string} The chat ID
 * @throws {Error} If there is an issue creating the chat
 */
export const createChat = async (userId1: string, userId2: string) => {
	try {
		const chat = await db(chatTableName).insert({ user1_id: userId1, user2_id: userId2 }).returning('id');
		return chat[0];
	} catch (error: any) {
		logger.error(`Error creating chat in DB between users ${userId1} and ${userId2}: ${error}`);
		throw new Error(`Error creating chat: ${error}`);
	}
};
