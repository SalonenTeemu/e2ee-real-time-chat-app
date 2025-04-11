import db from '../knex';
import { userTableName, publicKeyTableName } from '../initDB';

/**
 * Retrieve a user by their ID.
 *
 * @param {string} id The ID of the user
 * @returns {any} The user with the given ID
 * @throws {Error} If there is an issue retrieving the user
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
 * @param {string} username The username of the user
 * @returns {any} The user with the given username
 * @throws {Error} If there is an issue retrieving the user
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
 * @param {string} username The username of the user
 * @param {string} hashedPassword The hashed password of the user
 * @returns {any} The ID of the newly created user
 * @throws {Error} If there is an issue creating the user
 */
export const createUser = async (username: string, hashedPassword: string) => {
	try {
		return db(userTableName).insert({ username, password: hashedPassword }).returning('id');
	} catch (error) {
		console.error('Error creating user:', error);
		throw new Error('Error creating user');
	}
};

/**
 * Search for users by their username, excluding those without a public key.
 *
 * @param {string} searchTerm The term to search for in usernames
 * @returns {any} The users with usernames that match the search term and have a public key
 * @throws {Error} If there is an issue retrieving the users
 */
export const searchUsersByUsername = async (searchTerm: string) => {
	try {
		return db(userTableName)
			.join(publicKeyTableName, `${userTableName}.id`, '=', `${publicKeyTableName}.user_id`)
			.where('username', 'ilike', `%${searchTerm}%`)
			.select(`${userTableName}.id`, `${userTableName}.username`);
	} catch (error) {
		console.error('Error searching users by username:', error);
		throw new Error('Error searching users by username');
	}
};
