import express from 'express';
import cors from 'cors';
import http from 'http';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './db/initDB';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import messageRoutes from './routes/messageRoutes';
import keyRoutes from './routes/keyRoutes';
import { setupSocket } from './services/socket';
import { authenticateUserMiddleware } from './middleware/user';
import { corsOptions } from './middleware/cors';
import { rateLimiterMiddleware } from './middleware/rateLimiting';
import './utils/tokenCleanupCron';

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(authenticateUserMiddleware);
app.use(rateLimiterMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/key', keyRoutes);

// Create HTTP server and pass it to WebSocket
const server = http.createServer(app);
setupSocket(server);

// Initialize database and start the server
server.listen(process.env.BACKEND_PORT || 5000, async () => {
	await initializeDatabase();
	console.log(`Server running on http://localhost:${process.env.BACKEND_PORT || 5000}`);
});
