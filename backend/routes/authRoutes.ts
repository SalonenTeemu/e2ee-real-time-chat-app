import express from 'express';
import { register, login, logout } from '../controllers/authController';

const authRoutes = express.Router({ mergeParams: true });

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);

export default authRoutes;
