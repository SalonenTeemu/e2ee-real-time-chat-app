import { Server } from 'socket.io';
import http from 'http';
import * as cookie from 'cookie';
import { verifyAccessToken } from './authService';

/**
 * Setup the socket.io server
 *
 * @param server {http.Server} The server instance
 */
export const setupSocket = (server: http.Server) => {
	const io = new Server(server, {
		cors: {
			origin: process.env.FRONTEND_URL,
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

	io.on('connection', (socket) => {
		console.log('User connected:', socket.data.user.id);

		socket.on('sendMessage', (message) => {
			io.emit('receiveMessage', { user: socket.data.user.id, message });
		});

		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.data.user.id);
		});
	});

	io.on('connection', (socket) => {
		console.log('User connected:', socket.data.user.id);

		socket.on('sendMessage', (message) => {
			io.emit('receiveMessage', { user: socket.data.user.id, message });
		});

		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.data.user.id);
		});
	});
};
