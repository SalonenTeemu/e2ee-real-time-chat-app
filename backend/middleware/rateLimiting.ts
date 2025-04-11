import { RateLimiterMemory } from 'rate-limiter-flexible';
import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Rate limiting middleware to limit the number of requests from a single IP address.
 */
const rateLimiter = new RateLimiterMemory({
	points: 100, // 100 requests
	duration: 15 * 60, // per 15 minutes
});

/**
 * Rate limiting middleware function to limit the number of requests from a single IP address.
 *
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @param {NextFunction} next The next function to call
 * @returns The next function or a 429 error response
 */
export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
	rateLimiter
		.consume(req.ip || 'unknown-ip')
		.then(() => {
			next();
		})
		.catch(() => {
			logger.warn(`Rate limit exceeded for IP: ${req.ip || 'unknown-ip'}. Returning 429 status.`);
			res.status(429).json({ message: 'Too many requests, please try again later.' });
		});
};
