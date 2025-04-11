import { io, Socket } from 'socket.io-client';
import { log, logError } from '../utils/logger';

let socket: Socket | null = null;

/**
 * Initialize the socket connection to the server and set up event listeners.
 *
 * @param {notificationContext} notificationContext The context for notifications
 * @param {function} handleReceiveMessage The function to handle incoming messages
 */
export const connectSocket = (notificationContext: any, handleReceiveMessage: (data: any) => void) => {
	if (!socket) {
		socket = io(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}`, {
			transports: ['websocket'],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 3000,
			withCredentials: true,
		});

		socket.on('connect', () => {
			log(`Socket connected: ${socket?.id}`);
		});

		socket.on('disconnect', (reason) => {
			log(`Socket disconnected: ${reason}`);
			if (reason === 'io server disconnect') {
				socket?.connect();
			}
		});

		socket.on('connect_error', (error: any) => {
			logError(`Socket connection error: ${error.message}`);
			notificationContext.addNotification('error', 'Connection error. Please refresh the page.');
		});

		socket.on('error', (error: any) => {
			if (error.type === 'RateLimit') {
				notificationContext.addNotification('error', error.message || 'Too many messages. Please slow down.');
			} else {
				notificationContext.addNotification('error', 'Server error occurred. Try again later.');
			}
		});

		// Listen for receiveMessage event here and forward it to the handler function
		socket.on('receiveMessage', (data) => {
			handleReceiveMessage(data);
		});
	} else if (!socket.connected) {
		socket.connect();
	}
};

/**
 * Disconnect the socket and clean up listeners.
 */
export const disconnectSocket = () => {
	if (socket && socket.connected) {
		socket.disconnect();
		socket.removeAllListeners(); // Clean up all listeners
		socket = null;
		log('Socket disconnected and cleaned up.');
	}
};

/**
 * Get the current socket instance.
 */
export const getSocket = () => {
	if (!socket) {
		throw new Error('Socket not initialized. Call connectSocket first.');
	}
	return socket;
};
