import { io } from 'socket.io-client';

/**
 * Socket.io client instance
 */
const socket = io(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}`, {
	transports: ['websocket'],
	reconnection: true,
	reconnectionAttempts: 5,
	reconnectionDelay: 3000,
	withCredentials: true,
});

socket.on('connect', () => {
	console.log('Connected to WebSocket server:', socket.id);
});

socket.on('disconnect', (reason) => {
	console.log('Disconnected:', reason);
	if (reason === 'io server disconnect') {
		socket.connect();
	}
});

socket.on('connect_error', (error) => {
	console.error('Connection error:', error.message);
	if (error.message === 'xhr poll error') {
		socket.connect();
	}
	alert('Connection error. Please refresh the page.');
});

socket.on('error', (error) => {
	console.error('Server error:', error);
	alert('Server error occurred. Try again later.');
});

export default socket;
