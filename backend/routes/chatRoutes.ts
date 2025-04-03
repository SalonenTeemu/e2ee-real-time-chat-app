import express from 'express';
import { startChat, getUserChats, getChat } from '../controllers/chatController';
import { authorizeRole } from '../middleware/user';
import { ADMIN, USER } from '../utils/constants';

const chatRoutes = express.Router({ mergeParams: true });

chatRoutes.get('/', authorizeRole([ADMIN, USER]), getUserChats);
chatRoutes.get('/:chatId', authorizeRole([ADMIN, USER]), getChat);
chatRoutes.post('/start', authorizeRole([ADMIN, USER]), startChat);

export default chatRoutes;
