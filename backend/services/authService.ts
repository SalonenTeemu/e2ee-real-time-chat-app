import jwt from 'jsonwebtoken';
import { addRefreshToken } from '../db/queries/token';
import { User } from '../utils/types';

const env = process.env;

const secret = env.JWT_SECRET || 'secret';
const refreshSecret = env.JWT_REFRESH_SECRET || 'refreshSecret';
const expiration = env.ACCESS_TOKEN_EXPIRATION || '15m';
const refreshExpiration = env.REFRESH_TOKEN_EXPIRATION || '7d';

export async function createTokens(user: User) {
	try {
		const accessToken = jwt.sign({ userId: user.id }, secret, {
			expiresIn: expiration,
		});
		const refreshToken = jwt.sign({ userId: user.id }, refreshSecret, {
			expiresIn: refreshExpiration,
		});
		await addRefreshToken(user.id, refreshToken);
		return { accessToken, refreshToken };
	} catch (error) {
		console.error('Error creating tokens:', error);
		throw new Error('Error creating tokens');
	}
}
