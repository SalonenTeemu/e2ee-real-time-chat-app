import express from 'express';
import { register, login, logout, getUserProfile } from '../controllers/authController';
import { authorizeRole } from '../middleware/user';
import { ADMIN, USER } from '../utils/constants';

const authRoutes = express.Router({ mergeParams: true });

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
authRoutes.get('/me', authorizeRole([USER, ADMIN]), getUserProfile);

export default authRoutes;
