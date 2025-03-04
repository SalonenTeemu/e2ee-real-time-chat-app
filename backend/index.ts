import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { initializeDatabase } from './db/initDB';
import authRoutes from './routes/authRoutes';
import messageRoutes from './routes/messageRoutes';

const app = express();

export const corsOptions = {
	methods: ['GET', 'POST'],
	allowedHeaders: ['Content-Type'],
	origin: 'http://localhost:3000',
	credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	socket.on('sendMessage', (data) => {
		io.emit('receiveMessage', data);
	});

	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.id);
	});
});

server.listen(5000, () => {
	initializeDatabase();
	console.log('Server running on http://localhost:5000');
});
