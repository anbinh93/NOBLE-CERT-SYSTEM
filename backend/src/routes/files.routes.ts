import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { streamFile } from '../controllers/files.controller';

const router = Router();

router.get('/:id', catchAsync(streamFile));

export default router;

