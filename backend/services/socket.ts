import { Server } from 'socket.io';
import http from 'http';
import * as cookie from 'cookie';
import { verifyAccessToken } from './authService';
import { sanitizeMessage } from '../utils/sanitize';
import { encryptMessage } from '../utils/encryption';
import { saveMessage } from '../db/queries/message';

/**
 * Setup the socket.io server
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

			const decoded = verifyAccessToken(token);
			if (!decoded) {
				return next(new Error('Authentication error: Invalid token'));
			}

			socket.data = { user: decoded };
			return next();
		} catch (error) {
			console.error(error);
			return next(new Error('Authentication error: Invalid token or cookie parsing failed'));
		}
	});

	io.on('connect', (socket) => {
		console.log('User connected:', socket.data.user.username);

		socket.on('joinChat', (chatId) => {
			socket.join(chatId);
			console.log(`User joined chat room: ${chatId}`);
		});

		socket.on('leaveChat', (chatId) => {
			socket.leave(chatId);
			console.log(`User left chat room: ${chatId}`);
		});

		socket.on('sendMessage', async ({ chatId, senderId, content }) => {
			console.log('Message received:', content);
			const sanitizedMessage = sanitizeMessage(content);
			const encryptedMessage = encryptMessage(sanitizedMessage);

			const newMessage: any = await saveMessage(chatId, senderId, encryptedMessage);

			io.to(chatId).emit('receiveMessage', {
				chatId,
				senderId,
				content: sanitizedMessage,
				createdAt: newMessage.created_at,
			});
		});

		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.data.user.username);
		});
	});
};
