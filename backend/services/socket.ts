import { Server } from 'socket.io';
import http from 'http';
import * as cookie from 'cookie';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyAccessToken } from './authService';
import { sanitizeMessage } from '../utils/sanitize';
import { encryptMessage } from '../utils/encryption';
import { saveMessage } from '../db/queries/message';
import logger from '../utils/logger';

/**
 * Setup the socket.io server.
 *
 * @param {http.Server} server The HTTP server to attach the socket.io server to
 */
export const setupSocket = (server: http.Server) => {
	const io = new Server(server, {
		cors: {
			origin: `http://localhost:${process.env.FRONTEND_PORT || 3000}`,
			methods: ['GET', 'POST'],
			credentials: true,
		},
	});

	/**
	 * Rate limiter to limit the number of requests from a single user to the socket server.
	 */
	const rateLimiter = new RateLimiterMemory({
		points: 10, // 5 requests
		duration: 10, // per 10 seconds
	});

	// Store socket connections by user ID
	const userSockets: Record<string, string> = {};

	// Middleware to authenticate users using JWT from cookies
	io.use((socket, next) => {
		try {
			const cookieHeader = socket.handshake.headers?.cookie;

			// Check if cookies are present in the request headers and throw an error if not
			if (!cookieHeader) {
				logger.warn('Socket authentication failed: No cookies sent');
				return next(new Error('Authentication error: No cookies sent'));
			}

			const cookies = cookie.parse(cookieHeader);
			const token = cookies?.access_token;

			// Check if the access token is present in the cookies and throw an error if not
			if (!token) {
				logger.warn('Socket authentication failed: No token found in cookies');
				return next(new Error('Authentication error: No token found in cookies'));
			}

			// Verify the access token and throw an error if invalid
			const decoded = verifyAccessToken(token);
			if (!decoded) {
				logger.warn('Socket authentication failed: Invalid token');
				return next(new Error('Authentication error: Invalid token'));
			}

			// Attach the user data to the socket object
			socket.data = { user: decoded };
			return next();
		} catch (error: any) {
			logger.error(`Socket authentication error: ${error.message}`);
			return next(new Error('Authentication error: Invalid token or cookie parsing failed'));
		}
	});

	io.on('connect', (socket) => {
		const userId = socket.data.user.id;

		logger.info(`User ${userId} connected to socket with ID ${socket.id}`);

		// Store the socket ID for the user
		userSockets[userId] = socket.id;

		socket.on('sendMessage', async ({ chatId, content }) => {
			try {
				// Rate limit check
				await rateLimiter.consume(userId);

				logger.info(`User ${userId} sent a message to chat ${chatId}`);

				// Sanitize and encrypt the message before saving it
				const sanitizedMessage = sanitizeMessage(content);
				const encryptedMessage = encryptMessage(sanitizedMessage);

				const newMessage = await saveMessage(chatId, userId, encryptedMessage);

				// Send to sender
				io.to(userSockets[userId]).emit('receiveMessage', {
					chatId,
					senderId: userId,
					content: sanitizedMessage,
					createdAt: newMessage.created_at,
				});

				// Send to recipient if they are online
				const recipientId = newMessage.recipientId;
				if (userSockets[recipientId]) {
					io.to(userSockets[recipientId]).emit('receiveMessage', {
						chatId,
						senderId: userId,
						content: sanitizedMessage,
						createdAt: newMessage.created_at,
					});
				} else {
					logger.info(`User ${recipientId} is offline. Message saved so they can retrieve it later.`);
				}
			} catch (error: any) {
				// Rate limit exceeded so log the error and send a message to the user
				logger.warn(`User ${userId} exceeded socket rate limit for messages: ${error.message}`);
				socket.emit('error', {
					type: 'RateLimit',
					message: 'Too many messages. Please slow down.',
				});
			}
		});

		socket.on('disconnect', () => {
			logger.info(`User ${userId} disconnected from socket with ID ${socket.id}`);
			// Remove socket ID from the userSockets record on disconnect
			delete userSockets[userId];
		});
	});
};
