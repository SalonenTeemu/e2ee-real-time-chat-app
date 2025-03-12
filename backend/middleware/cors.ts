/**
 * CORS middleware
 */
export const corsOptions = {
	origin: process.env.FRONTEND_URL,
	methods: ['GET', 'POST'],
	credentials: true,
	allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
	exposedHeaders: ['Authorization'],
};
