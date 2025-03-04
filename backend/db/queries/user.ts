import db from '../knex';
import { userTableName } from '../initDB';

/**
 * Retrieve a user by their ID.
 *
 * @param id The user ID
 * @returns The user with the given ID
 */
export const getUserById = async (id: string) => {
	return db(userTableName).where({ id }).first();
};

/**
 * Retrieve a user by their username.
 *
 * @param username The username of the user
 * @returns The user with the given username
 */
export const getUserByUsername = async (username: string) => {
	return db(userTableName).where({ username }).first();
};

/**
 * Create a new user.
 *
 * @param username The username of the user
 * @param hashedPassword The hashed password of the user
 */
export const createUser = async (username: string, hashedPassword: string) => {
	return db(userTableName).insert({ username, password: hashedPassword });
};
