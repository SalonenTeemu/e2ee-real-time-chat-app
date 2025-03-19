import express from 'express';
import { searchUsers } from '../controllers/userController';
import { authorizeRole } from '../middleware/user';
import { ADMIN, USER } from '../utils/constants';

const userRoutes = express.Router({ mergeParams: true });

userRoutes.get('/search', authorizeRole([ADMIN, USER]), searchUsers);

export default userRoutes;
