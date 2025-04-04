import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { validateRegisterAndLogin } from '../utils/validate';
import { createUser, getUserByUsername, getUserById } from '../db/queries/user';
import { createTokens, revokeARefreshToken, verifyRefreshToken } from '../services/authService';
import { CustomRequest } from '../middleware/user';
import { getPublicKeyByUserId } from '../db/queries/key';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Responds to a POST request to register a user.
 *
 * @param req The request object
 * @param res The response object
 * @returns The response
 */
export const register = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		// Validate the username and password
		const validation = validateRegisterAndLogin(username, password);
		if (!validation.success) {
			res.status(400).json({ message: validation.message });
			return;
		}
		const user = await getUserByUsername(username);
		if (user) {
			res.status(400).json({ message: 'Username already exists' });
			return;
		}
		// Hash the password with bcrypt
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await createUser(username, hashedPassword);
		if (!newUser) {
			res.status(500).json({ message: 'Error creating user' });
			return;
		}
		res.status(201).json({ message: 'User registered successfully' });
	} catch (error) {
		console.error('Error registering user:', error);
		res.status(500).json({ message: 'Error registering user' });
	}
};

/**
 * Responds to a POST request to log in a user.
 *
 * @param req The request object
 * @param res The response object
 * @returns The response
 */
export const login = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		// Validate the username and password
		const validation = validateRegisterAndLogin(username, password);
		if (!validation.success) {
			res.status(400).json({ message: validation.message });
			return;
		}
		const user = await getUserByUsername(username);
		if (!user) {
			res.status(401).json({ message: 'Username not found' });
			return;
		}
		// Check if the password is correct using bcrypt
		const correctPassword = await bcrypt.compare(password, user.password);
		if (!correctPassword) {
			res.status(401).json({ message: 'Incorrect password' });
			return;
		}
		// Check if the user has a public key
		const publicKey = await getPublicKeyByUserId(user.id);

		// Create tokens for the user and set them as cookies
		const { accessToken, refreshToken } = await createTokens(user);
		res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 15 * 60 * 1000 });
		res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 7 * 24 * 60 * 60 * 1000 });

		// Respond with a success message and the user ID
		// If the user does not have a public key yet (first login), set requiresPublicKey to true
		if (!publicKey) {
			res.status(200).json({ message: 'Login successful, but public key is missing', requiresPublicKey: true, userId: user.id });
		} else {
			res.status(200).json({ message: 'Login successful', requiresPublicKey: false, userId: user.id });
		}
	} catch (error) {
		console.error('Error logging in:', error);
		res.status(500).json({ message: 'Error logging in' });
	}
};

/**
 * Responds to a POST request to log out a user.
 *
 * @param req The request object
 * @param res The response object
 * @returns The response
 */
export const logout = async (req: Request, res: Response) => {
	try {
		const cookies = req.cookies;
		const refreshToken = cookies.refresh_token;
		// Revoke the refresh token if it exists
		if (refreshToken) {
			await revokeARefreshToken(refreshToken);
		}
		// Clear the cookies
		res.clearCookie('access_token', { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 0 });
		res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 0 });
		res.status(200).json({ message: 'Logout successful' });
	} catch (error) {
		console.error('Error logging out:', error);
		res.status(500).json({ message: 'Error logging out' });
	}
};

/**
 * Responds to a GET request to get the user profile.
 *
 * @param req The request object
 * @param res The response object
 * @returns The response
 */
export const getUserProfile = async (req: CustomRequest, res: Response) => {
	try {
		const reqUser = req.user;
		if (!reqUser || !reqUser.id) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		const user = await getUserById(reqUser.id);
		if (!user) {
			res.status(404).json({ message: 'User not found' });
			return;
		}
		res.status(200).json({ message: { id: user.id, username: user.username, role: user.role } });
	} catch (error) {
		console.error('Error getting user profile:', error);
		res.status(500).json({ message: 'Error getting user profile' });
	}
};

/**
 * Responds to a POST request to refresh the tokens.
 *
 * @param req The request object
 * @param res The response object
 * @returns The response
 */
export const refresh = async (req: CustomRequest, res: Response) => {
	try {
		const oldRefreshToken = req.cookies.refresh_token;
		if (!oldRefreshToken) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		// Verify the refresh token and get the user from it
		const user = await verifyRefreshToken(oldRefreshToken);
		if (!user) {
			res.status(401).json({ message: 'Invalid or expired refresh token' });
			return;
		}
		// Revoke the old refresh token and create new tokens
		await revokeARefreshToken(oldRefreshToken);
		const { accessToken, refreshToken } = await createTokens(user);

		// Set the new tokens as cookies
		res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 15 * 60 * 1000 });
		res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 7 * 24 * 60 * 60 * 1000 });
		res.status(200).json({ message: 'Tokens refreshed' });
	} catch (error) {
		console.error('Error refreshing token:', error);
		res.status(500).json({ message: 'Error refreshing token' });
	}
};
