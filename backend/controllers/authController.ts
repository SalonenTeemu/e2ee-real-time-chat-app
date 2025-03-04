import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { validateRegisterAndLogin } from '../utils/validate';
import { createUser, getUserByUsername } from '../db/queries/user';
import { createTokens } from '../services/authService';

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
		const validation = validateRegisterAndLogin(username, password);
		if (!validation.success) {
			res.status(400).json({ message: validation.message });
			return;
		}
		const user = await getUserByUsername(username);
		if (user) {
			res.status(400).json({ message: 'Username already exists.' });
			return;
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		await createUser(username, hashedPassword);
		res.status(201).json({ message: 'User created.' });
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
		const validation = validateRegisterAndLogin(username, password);
		if (!validation.success) {
			res.status(400).json({ message: validation.message });
			return;
		}
		const user = await getUserByUsername(username);
		if (!user) {
			res.status(401).json({ message: 'Username not found.' });
			return;
		}
		const correctPassword = await bcrypt.compare(password, user.password);
		if (!correctPassword) {
			res.status(401).json({ message: 'Incorrect password.' });
			return;
		}
		const { accessToken, refreshToken } = await createTokens(user);
		res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 15 * 60 * 1000 });
		res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'strict', secure: isProduction, maxAge: 7 * 24 * 60 * 60 * 1000 });
		res.status(200).json({ message: 'Login successful.' });
	} catch (error) {
		console.error('Error logging in:', error);
		res.status(500).json({ message: 'Error logging in' });
	}
};
