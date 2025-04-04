import { Server } from 'socket.io';
import http from 'http';
import * as cookie from 'cookie';
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
		console.log(`User ${socket.data.user.id} connected`);

		// Store the socket ID for the user
		userSockets[socket.data.user.id] = socket.id;

		socket.on('sendMessage', async ({ chatId, content }) => {
			const senderId = socket.data.user.id;
			console.log(`User ${senderId} sent a message to chat ${chatId}`);

			// Sanitize and encrypt the message before saving it
			const sanitizedMessage = sanitizeMessage(content);
			const encryptedMessage = encryptMessage(sanitizedMessage);

			const newMessage = await saveMessage(chatId, senderId, encryptedMessage);

			// Send to sender
			io.to(userSockets[senderId]).emit('receiveMessage', {
				chatId,
				senderId,
				content: sanitizedMessage,
				createdAt: newMessage.created_at,
			});

			// Send to recipient if they are online
			const recipientId = newMessage.recipientId;
			if (userSockets[recipientId]) {
				io.to(userSockets[recipientId]).emit('receiveMessage', {
					chatId,
					senderId,
					content: sanitizedMessage,
					createdAt: newMessage.created_at,
				});
			} else {
				console.log(`User ${recipientId} is offline. Message saved so they can retrieve it later.`);
			}
		});

		socket.on('disconnect', () => {
			console.log(`User ${socket.data.user.id} disconnected`);
			// Remove socket ID from the userSockets record on disconnect
			delete userSockets[socket.data.user.id];
		});
	});
};
