import express from 'express';
import { startChat } from '../controllers/chatController';
import { authorizeRole } from '../middleware/user';
import { ADMIN, USER } from '../utils/constants';

const chatRoutes = express.Router({ mergeParams: true });

chatRoutes.post('/start', authorizeRole([ADMIN, USER]), startChat);

export default chatRoutes;
