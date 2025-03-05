import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL, {
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

export default socket;
