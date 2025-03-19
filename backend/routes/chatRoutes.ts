import express from 'express';
import { startChat, getUserChats } from '../controllers/chatController';
import { authorizeRole } from '../middleware/user';
import { ADMIN, USER } from '../utils/constants';

const chatRoutes = express.Router({ mergeParams: true });

chatRoutes.get('/', authorizeRole([ADMIN, USER]), getUserChats);
chatRoutes.post('/start', authorizeRole([ADMIN, USER]), startChat);

export default chatRoutes;
