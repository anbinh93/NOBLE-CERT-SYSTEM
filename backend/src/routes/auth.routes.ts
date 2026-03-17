// src/routes/auth.routes.ts
import { Router } from 'express';
import { register, login, refresh, googleSync } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/google-sync', googleSync);

export default router;
