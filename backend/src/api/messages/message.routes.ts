import { Router } from 'express';
import { createMessage, getMessages, updateMessage } from './message.controller';
import { protect, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.route('/')
    .post(createMessage)
    .get(protect, authorize('admin'), getMessages);

router.route('/:id')
    .put(protect, authorize('admin'), updateMessage);

export default router;