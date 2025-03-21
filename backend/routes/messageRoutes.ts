import express from 'express';
import { getChatMessages } from '../controllers/messageController';
import { authorizeRole } from '../middleware/user';
import { ADMIN, USER } from '../utils/constants';

const messageRoutes = express.Router({ mergeParams: true });

messageRoutes.get('/:chatId', authorizeRole([ADMIN, USER]), getChatMessages);

export default messageRoutes;
