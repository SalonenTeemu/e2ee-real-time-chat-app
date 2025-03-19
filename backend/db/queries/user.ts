import db from '../knex';
import { userTableName } from '../initDB';

/**
 * Retrieve a user by their ID.
 *
 * @param id The user ID
 * @returns The user with the given ID
 * @throws Error if there is an issue retrieving the user
 */
export const getUserById = async (id: string) => {
	try {
		return db(userTableName).where({ id }).first();
	} catch (error) {
		console.error('Error getting user by ID:', error);
		throw new Error('Error getting user by ID');
	}
};

/**
 * Retrieve a user by their username.
 *
 * @param username The username of the user
 * @returns The user with the given username
 * @throws Error if there is an issue retrieving the user
 */
export const getUserByUsername = async (username: string) => {
	try {
		return db(userTableName).where({ username }).first();
	} catch (error) {
		console.error('Error getting user by username:', error);
		throw new Error('Error getting user by username');
	}
};

/**
 * Create a new user.
 *
 * @param username The username of the user
 * @param hashedPassword The hashed password of the user
 */
export const createUser = async (username: string, hashedPassword: string) => {
	try {
		return db(userTableName).insert({ username, password: hashedPassword });
	} catch (error) {
		console.error('Error creating user:', error);
		throw new Error('Error creating user');
	}
};

/**
 * Search for users by their username.
 *
 * @param searchTerm The username search term
 * @returns The users with usernames that match the search term
 */
export const searchUsersByUsername = async (searchTerm: string) => {
	try {
		return db(userTableName).where('username', 'ilike', `%${searchTerm}%`).select('id', 'username');
	} catch (error) {
		console.error('Error searching users by username:', error);
		throw new Error('Error searching users by username');
	}
};
