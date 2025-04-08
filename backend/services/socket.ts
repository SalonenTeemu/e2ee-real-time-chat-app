import { Server } from 'socket.io';
import http from 'http';
import * as cookie from 'cookie';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyAccessToken } from './authService';
import { sanitizeMessage } from '../utils/sanitize';
import { encryptMessage } from '../utils/encryption';
import { saveMessage } from '../db/queries/message';

/**
 * Setup the socket.io server.
 *
 * @param server {http.Server} The server instance
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

			if (!cookieHeader) {
				return next(new Error('Authentication error: No cookies sent'));
			}

			const cookies = cookie.parse(cookieHeader);
			const token = cookies?.access_token;

			if (!token) {
				return next(new Error('Authentication error: No token found in cookies'));
			}

			// Verify the access token
			const decoded = verifyAccessToken(token);
			if (!decoded) {
				return next(new Error('Authentication error: Invalid token'));
			}

			// Attach the user data to the socket object
			socket.data = { user: decoded };
			return next();
		} catch (error) {
			console.error(error);
			return next(new Error('Authentication error: Invalid token or cookie parsing failed'));
		}
	});

	io.on('connect', (socket) => {
		const userId = socket.data.user.id;

		console.log(`User ${userId} connected`);

		// Store the socket ID for the user
		userSockets[userId] = socket.id;

		socket.on('sendMessage', async ({ chatId, content }) => {
			try {
				await rateLimiter.consume(userId); // Rate limit check

				console.log(`User ${userId} sent a message to chat ${chatId}`);

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
					console.log(`User ${recipientId} is offline. Message saved so they can retrieve it later.`);
				}
			} catch {
				// Rate limit exceeded
				socket.emit('error', {
					type: 'RateLimit',
					message: 'Too many messages. Please slow down.',
				});
			}
		});

		socket.on('disconnect', () => {
			console.log(`User ${userId} disconnected`);
			// Remove socket ID from the userSockets record on disconnect
			delete userSockets[userId];
		});
	});
};
