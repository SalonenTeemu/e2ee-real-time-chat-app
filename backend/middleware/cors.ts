/**
 * CORS middleware options.
 */
export const corsOptions = {
	origin: `http://localhost:${process.env.FRONTEND_PORT || 3000}`,
	methods: ['GET', 'POST'],
	credentials: true,
	allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
	exposedHeaders: ['Authorization'],
};
