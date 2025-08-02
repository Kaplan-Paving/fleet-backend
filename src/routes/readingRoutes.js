import express from 'express';
import {
    createReading,
    getReadingsByKaplanUnit,
    getAllReadings
} from '../controllers/readingController.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import { protect } from '../middlewares/auth.js';
import { checkEditPermission } from '../middlewares/checkEditPermission.js';


const router = express.Router();

// You can restrict with permissions if needed
router.post('/', protect, createReading);
router.get('/', protect, getAllReadings);
router.get('/:kaplanUnitNo', protect, getReadingsByKaplanUnit);

export default router;
