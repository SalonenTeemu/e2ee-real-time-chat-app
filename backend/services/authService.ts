import jwt from 'jsonwebtoken';
import { addRefreshToken, getRefreshToken, revokeRefreshToken } from '../db/queries/token';
import { User } from '../utils/types';
import logger from '../utils/logger';

const env = process.env;

// Secrets and expiration times for JWT tokens
const secret = env.JWT_SECRET || 'secret';
const refreshSecret = env.JWT_REFRESH_SECRET || 'refreshSecret';
const expiration = env.ACCESS_TOKEN_EXPIRATION || '15m';
const refreshExpiration = env.REFRESH_TOKEN_EXPIRATION || '7d';

/**
 * Creates an access token and a refresh token for a user.
 *
 * @param {User} user The user object containing the user's ID and role
 * @returns {{ accessToken: string; refreshToken: string }} The access token and refresh token
 * @throws {Error} If there is an issue creating the tokens
 */
export const createTokens = async (user: User) => {
	try {
		// Create the access token and refresh token using jsonwebtoken
		const accessToken = jwt.sign({ id: user.id, role: user.role }, secret, {
			expiresIn: expiration,
		});
		const refreshToken = jwt.sign({ id: user.id, role: user.role }, refreshSecret, {
			expiresIn: refreshExpiration,
		});
		// Save the refresh token to the database
		await addRefreshToken(user.id, refreshToken);
		return { accessToken, refreshToken };
	} catch (error: any) {
		logger.error(`Error creating tokens: ${error}`);
		throw new Error('Error creating tokens');
	}
};

/**
 * Verifies an access token.
 *
 * @param {string} token The access token
 * @returns {User | null} The user object if the token is valid, otherwise null
 */
export const verifyAccessToken = (token: string) => {
	try {
		// Verify the access token using jsonwebtoken
		const decoded = jwt.verify(token, secret);
		if (!decoded) {
			logger.warn('Access token verification failed: token is invalid or expired');
			return null;
		}
		return decoded as User;
	} catch (error: any) {
		logger.error(`Error verifying access token: ${error}`);
		return null;
	}
};

/**
 * Verifies a refresh token.
 *
 * @param {string} token The refresh token
 * @returns {User | null} The user object if the token is valid, otherwise null
 */
export const verifyRefreshToken = async (token: string) => {
	try {
		// Verify the refresh token using jsonwebtoken
		const decoded = jwt.verify(token, refreshSecret);
		if (!decoded) {
			logger.warn('Refresh token verification failed: token is invalid or expired');
			return null;
		}
		// Retrieve the refresh token from the database to check if it is revoked
		const refreshToken = await getRefreshToken(token);
		if (!refreshToken || refreshToken.is_revoked) {
			logger.warn('Refresh token verification failed: token is revoked or does not exist');
			return null;
		}
		return decoded as User;
	} catch (error: any) {
		logger.error(`Error verifying refresh token: ${error}`);
		return null;
	}
};

/**
 * Revokes a refresh token.
 *
 * @param {string} token The refresh token to revoke
 * @throws {Error} If there is an issue revoking the token
 */
export const revokeARefreshToken = async (token: string) => {
	try {
		await revokeRefreshToken(token);
	} catch (error: any) {
		logger.error(`Error revoking refresh token: ${error}`);
		throw new Error('Error revoking refresh token');
	}
};
