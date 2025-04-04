import jwt from 'jsonwebtoken';
import { addRefreshToken, getRefreshToken, revokeRefreshToken } from '../db/queries/token';
import { User } from '../utils/types';

const env = process.env;

// Secrets and expiration times for JWT tokens
const secret = env.JWT_SECRET || 'secret';
const refreshSecret = env.JWT_REFRESH_SECRET || 'refreshSecret';
const expiration = env.ACCESS_TOKEN_EXPIRATION || '15m';
const refreshExpiration = env.REFRESH_TOKEN_EXPIRATION || '7d';

/**
 * Creates an access token and a refresh token for a user.
 *
 * @param user The user object
 * @returns The access token and refresh token
 * @throws Error if there is an issue creating the tokens
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
	} catch (error) {
		console.error('Error creating tokens:', error);
		throw new Error('Error creating tokens');
	}
};

/**
 * Verifies an access token.
 *
 * @param token The access token
 * @returns The user object, or null if the token is invalid
 */
export const verifyAccessToken = (token: string) => {
	try {
		// Verify the access token using jsonwebtoken
		const decoded = jwt.verify(token, secret);
		if (!decoded) {
			return null;
		}
		return decoded as User;
	} catch (error) {
		console.error('Error verifying access token:', error);
		return null;
	}
};
/**
 * Verifies a refresh token.
 *
 * @param token The refresh token
 * @returns The user object, or null if the token is invalid
 */
export const verifyRefreshToken = async (token: string) => {
	try {
		// Verify the refresh token using jsonwebtoken
		const decoded = jwt.verify(token, refreshSecret);
		if (!decoded) {
			return null;
		}
		// Retrieve the refresh token from the database to check if it is revoked
		const refreshToken = await getRefreshToken(token);
		if (!refreshToken || refreshToken.is_revoked) {
			return null;
		}
		return decoded as User;
	} catch (error) {
		console.error('Error verifying refresh token:', error);
		return null;
	}
};

/**
 * Revokes a refresh token.
 *
 * @param token The refresh token
 * @throws Error if there is an issue revoking the token
 */
export const revokeARefreshToken = async (token: string) => {
	try {
		await revokeRefreshToken(token);
	} catch (error) {
		console.error('Error revoking refresh token:', error);
		throw new Error('Error revoking refresh token');
	}
};
