import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService';
import logger from '../utils/logger';
import { GUEST } from '../utils/constants';

/**
 * Custom request object to include the user.
 */
export interface CustomRequest extends Request {
	user?: any;
}

/**
 * Sets the user on the request object. The user is set to null if the access token is invalid or not present.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @param {NextFunction} next The next function to call
 * @returns The next function
 */
export const authenticateUserMiddleware = (req: CustomRequest, res: Response, next: NextFunction): void => {
	try {
		const accessToken = req.cookies.access_token;
		if (!accessToken) {
			req.user = { id: null, role: GUEST };
			logger.info(`No access token found for IP: ${req.ip}. Assigning GUEST role.`);
			next();
			return;
		}
		// Verify the access token and get the user
		const user = verifyAccessToken(accessToken);
		if (user) {
			req.user = user;
		} else {
			req.user = { id: null, role: GUEST };
			logger.info(`Invalid access token for IP: ${req.ip}. Assigning GUEST role.`);
		}
	} catch {
		// If the token is invalid, set the user to null
		req.user = { id: null, role: GUEST };
		logger.warn(`Invalid or expired access token for IP: ${req.ip}. Assigning GUEST role.`);
	}
	next();
};

/**
 * Authorizes roles to access a route.
 *
 * @param {string[]} roles The roles to authorize
 * @returns A middleware function that checks if the user has the required role
 */
export const authorizeRole = (roles: string[]) => {
	return (req: CustomRequest, res: Response, next: NextFunction): void => {
		if (!req.user || !req.user.id || !roles.includes(req.user.role)) {
			logger.warn(
				`Unauthorized access attempt by user ${req.user?.id || 'unknown'} from IP: ${req.ip}. Required roles: ${roles.join(', ')}, but found role: ${req.user?.role || 'GUEST'}.`
			);
			res.status(403).json({ status: 403, message: 'Access denied' });
			return;
		}
		next();
	};
};
