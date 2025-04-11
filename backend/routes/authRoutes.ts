import express from 'express';
import { register, login, logout, getUserProfile, refresh, verifyPassword } from '../controllers/authController';
import { authorizeRole } from '../middleware/user';
import { ADMIN, USER } from '../utils/constants';

const authRoutes = express.Router({ mergeParams: true });

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
authRoutes.get('/me', authorizeRole([USER, ADMIN]), getUserProfile);
authRoutes.post('/refresh', refresh);
authRoutes.post('/verify-password', authorizeRole([USER, ADMIN]), verifyPassword);

export default authRoutes;
