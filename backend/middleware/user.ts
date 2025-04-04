import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService';
import { GUEST } from '../utils/constants';

/**
 * Custom request object to include the user.
 */
export interface CustomRequest extends Request {
	user?: any;
}

/**
 * Sets the user on the request object.
 */
export const authenticateUserMiddleware = (req: CustomRequest, res: Response, next: NextFunction): void => {
	try {
		const accessToken = req.cookies.access_token;
		if (!accessToken) {
			req.user = { id: null, role: GUEST };
			next();
			return;
		}
		// Verify the access token and get the user
		const user = verifyAccessToken(accessToken);
		req.user = user;
	} catch {
		// If the token is invalid, set the user to null
		req.user = { id: null, role: GUEST };
	}
	next();
};

/**
 * Authorizes roles to access a route.
 *
 * @param roles The roles to authorize
 */
export const authorizeRole = (roles: string[]) => {
	return (req: CustomRequest, res: Response, next: NextFunction): void => {
		if (!req.user || !req.user.id || !roles.includes(req.user.role)) {
			res.status(403).json({ status: 403, message: 'Access denied' });
			return;
		}
		next();
	};
};
