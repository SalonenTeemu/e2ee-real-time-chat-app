import express from 'express';
import cors from 'cors';
import http from 'http';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './db/initDB';
import authRoutes from './routes/authRoutes';
import { setupSocket } from './services/socket';
import { authenticateUserMiddleware } from './middleware/user';
import { corsOptions } from './middleware/cors';

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(authenticateUserMiddleware);

// Routes
app.use('/api/auth', authRoutes);

// Create HTTP server and pass it to WebSockets
const server = http.createServer(app);
setupSocket(server);

server.listen(5000, () => {
	initializeDatabase();
	console.log(`Server running on ${process.env.BACKEND_URL}`);
});
