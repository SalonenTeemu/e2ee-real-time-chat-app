import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { validateRegisterAndLogin, validatePassword } from '../utils/validate';
import { createUser, getUserByUsername, getUserById } from '../db/queries/user';
import { createTokens, revokeARefreshToken, verifyRefreshToken } from '../services/authService';
import { CustomRequest } from '../middleware/user';
import { getPublicKeyByUserId } from '../db/queries/key';
import logger from '../utils/logger';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Responds to a POST request to register a new user.
 *
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const register = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		// Validate the username and password
		const validation = validateRegisterAndLogin(username, password);
		if (!validation.success) {
			logger.warn(`Registration failed for username: ${username} - ${validation.message}`);
			res.status(400).json({ message: validation.message });
			return;
		}
		// Check if the user already exists in the database
		const user = await getUserByUsername(username);
		if (user) {
			logger.warn(`Registration failed, username already exists: ${username}`);
			res.status(400).json({ message: 'Username already exists' });
			return;
		}
		// Hash the password with bcrypt
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await createUser(username, hashedPassword);
		if (!newUser) {
			logger.error(`Error creating user: ${username}`);
			res.status(500).json({ message: 'Error creating user' });
			return;
		}
		logger.info(`User registered successfully: username: ${username}, id: ${newUser}`);
		res.status(201).json({ message: 'User registered successfully' });
	} catch (error: any) {
		logger.error(`Error registering user: ${error.message}`);
		res.status(500).json({ message: 'Error registering user' });
	}
};

/**
 * Responds to a POST request to log in a user.
 *
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const login = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		// Validate the username and password
		const validation = validateRegisterAndLogin(username, password);
		if (!validation.success) {
			logger.warn(`Login failed for username: ${username} - ${validation.message}`);
			res.status(400).json({ message: validation.message });
			return;
		}
		// Check if the user exists in the database
		const user = await getUserByUsername(username);
		if (!user) {
			logger.warn(`Login failed, username not found: ${username}`);
			res.status(401).json({ message: 'Username not found' });
			return;
		}
		// Check if the password is correct using bcrypt
		const correctPassword = await bcrypt.compare(password, user.password);
		if (!correctPassword) {
			logger.warn(`Login failed, incorrect password for username: ${username}`);
			res.status(401).json({ message: 'Incorrect password' });
			return;
		}
		// Check if the user has a public key already
		const publicKey = await getPublicKeyByUserId(user.id);

		// Create tokens for the user and set them as cookies
		const { accessToken, refreshToken } = await createTokens(user);
		res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 15 * 60 * 1000 });
		res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 7 * 24 * 60 * 60 * 1000 });

		// Respond with a success message and the user ID
		// If the user does not have a public key yet (first login), set requiresPublicKey to true
		if (!publicKey) {
			logger.info(`Login successful, but public key is missing for username: ${username}`);
			res.status(200).json({ message: 'Login successful, but public key is missing', requiresPublicKey: true, userId: user.id });
		} else {
			logger.info(`Login successful for username: ${username}`);
			res.status(200).json({ message: 'Login successful', requiresPublicKey: false, userId: user.id });
		}
	} catch (error: any) {
		logger.error(`Error logging in: ${error.message}`);
		res.status(500).json({ message: 'Error logging in' });
	}
};

/**
 * Responds to a POST request to log out a user.
 *
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const logout = async (req: CustomRequest, res: Response) => {
	try {
		const cookies = req.cookies;
		const refreshToken = cookies.refresh_token;
		// Revoke the refresh token if it exists
		if (refreshToken) {
			logger.info(`Refresh token revoked for user: ${req.user?.username}`);
			await revokeARefreshToken(refreshToken);
		}
		// Clear the cookies
		res.clearCookie('access_token', { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 0 });
		res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 0 });

		logger.info(`User logged out successfully: ${req.user?.username}`);
		res.status(200).json({ message: 'Logout successful' });
	} catch (error: any) {
		logger.error(`Error logging out: ${error.message}`);
		res.status(500).json({ message: 'Error logging out' });
	}
};

/**
 * Responds to a GET request to get the user profile.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const getUserProfile = async (req: CustomRequest, res: Response) => {
	try {
		const reqUser = req.user;
		if (!reqUser || !reqUser.id) {
			logger.warn('User profile retrieval failed due to unauthorized access attempt');
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		// Get the user from the database
		const user = await getUserById(reqUser.id);
		if (!user) {
			logger.warn(`User profile retrieval failed for user ID: ${reqUser.id}, user not found`);
			res.status(404).json({ message: 'User not found' });
			return;
		}
		logger.info(`User profile retrieved successfully for user ID: ${reqUser.id}`);
		res.status(200).json({ message: { id: user.id, username: user.username, role: user.role } });
	} catch (error: any) {
		logger.error(`Error getting user profile: ${error.message}`);
		res.status(500).json({ message: 'Error getting user profile' });
	}
};

/**
 * Responds to a POST request to refresh the tokens.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const refresh = async (req: CustomRequest, res: Response) => {
	try {
		const oldRefreshToken = req.cookies.refresh_token;
		if (!oldRefreshToken) {
			logger.warn('Token refresh failed due to missing refresh token');
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		// Verify the refresh token and get the user from it
		const user = await verifyRefreshToken(oldRefreshToken);
		if (!user) {
			logger.warn('Token refresh failed due to invalid or expired refresh token');
			res.status(401).json({ message: 'Invalid or expired refresh token' });
			return;
		}
		// Revoke the old refresh token and create new tokens
		await revokeARefreshToken(oldRefreshToken);
		const { accessToken, refreshToken } = await createTokens(user);

		// Set the new tokens as cookies
		res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 15 * 60 * 1000 });
		res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 7 * 24 * 60 * 60 * 1000 });

		logger.info(`Tokens refreshed successfully for user ID: ${user.id}`);
		res.status(200).json({ message: 'Tokens refreshed' });
	} catch (error: any) {
		logger.error(`Error refreshing tokens: ${error.message}`);
		res.status(500).json({ message: 'Error refreshing token' });
	}
};

/**
 * Responds to a POST request to verify the user's password.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const verifyPassword = async (req: CustomRequest, res: Response) => {
	try {
		const { password } = req.body;
		// Validate the password
		if (!password || !validatePassword(password)) {
			logger.warn('Password verification failed due to invalid password format');
			res.status(400).json({
				message: 'Password must be between 12 and 100 characters and have lower case, upper case, number, and a special character.',
			});
			return;
		}
		const reqUser = req.user;
		if (!reqUser) {
			logger.warn('Password verification failed due to unauthorized access attempt');
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		// Get the user from the database
		const user = await getUserById(reqUser.id);
		if (!user) {
			logger.warn(`Password verification failed, user not found for ID: ${reqUser.id}`);
			res.status(401).json({ message: 'User not found' });
			return;
		}
		// Check if the password is correct using bcrypt
		const correctPassword = await bcrypt.compare(password, user.password);
		if (!correctPassword) {
			logger.warn(`Password verification failed, incorrect password for user ID: ${reqUser.id}`);
			res.status(401).json({ message: 'Incorrect password' });
			return;
		}

		logger.info(`Password verified successfully for user ID: ${reqUser.id}`);
		res.status(200).json({ message: 'Password is valid' });
	} catch (error: any) {
		logger.error(`Error verifying password: ${error.message}`);
		res.status(500).json({ message: 'Error verifying password' });
	}
};
