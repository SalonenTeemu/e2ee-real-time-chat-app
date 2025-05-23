import express from 'express';
import { getRecipientPublicKey, savePublicKey } from '../controllers/keyController';
import { authorizeRole } from '../middleware/user';
import { ADMIN, USER } from '../utils/constants';

const keyRoutes = express.Router({ mergeParams: true });

keyRoutes.post('/', authorizeRole([ADMIN, USER]), savePublicKey);
keyRoutes.get('/recipient/:chatId', authorizeRole([ADMIN, USER]), getRecipientPublicKey);

export default keyRoutes;
