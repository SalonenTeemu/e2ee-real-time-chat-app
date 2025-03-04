import express from 'express';
import { register, login } from '../controllers/authController';

const authRoutes = express.Router({ mergeParams: true });

authRoutes.post('/register', register);
authRoutes.post('/login', login);

export default authRoutes;
