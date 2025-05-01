import { RateLimiterMemory } from 'rate-limiter-flexible';
import type { Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { CustomRequest } from './user';

/**
 * Rate limiter configuration using in-memory storage.
 */
const rateLimiter = new RateLimiterMemory({
	points: 100, // 100 allowed requests
	duration: 15 * 60, // per 15 minutes
});

/**
 * Rate limiting middleware function to limit the number of requests from a single user or IP address.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @param {NextFunction} next The next function to call
 * @returns The next function or a 429 error response
 */
export const rateLimiterMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
	// Use user ID if available, otherwise use IP address
	const identifier = req.user?.id || req.ip || 'unknown';

	rateLimiter
		.consume(identifier)
		.then(() => {
			next();
		})
		// If the rate limit is exceeded, send a 429 response
		.catch(() => {
			logger.warn(`Rate limit exceeded for ${req.user?.id ? `user ${req.user.id}` : `IP ${req.ip}`}. Returning 429 status.`);
			res.status(429).json({
				status: 429,
				message: 'Too many requests. Please slow down and try again later.',
			});
		});
};
