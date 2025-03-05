import express from 'express';
import cors from 'cors';
import http from 'http';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './db/initDB';
import authRoutes from './routes/authRoutes';
import messageRoutes from './routes/messageRoutes';
import { setupSocket } from './services/socket';

const app = express();
export const corsOptions = {
	methods: ['GET', 'POST'],
	allowedHeaders: ['Content-Type'],
	origin: process.env.FRONTEND_URL,
	credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Create HTTP server and pass it to WebSockets
const server = http.createServer(app);
setupSocket(server);

server.listen(5000, () => {
	initializeDatabase();
	console.log(`Server running on ${process.env.BACKEND_URL}`);
});
