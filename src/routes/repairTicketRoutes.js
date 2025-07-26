import express from 'express';
import multer from 'multer';
import {
    createRepairTicket,
    getAllRepairTickets,
    deleteRepairTicket,
    updateTicketRanks // 1. Import the new controller
    // ... import your other controllers
} from '../controllers/repairTicketController.js';

const router = express.Router();
const upload = multer();

// ... (your existing POST, GET, DELETE routes)
router.post('/', upload.array('attachments', 5), createRepairTicket);
router.get('/', getAllRepairTickets);
router.delete('/:id', deleteRepairTicket);


// 2. Add the new route for updating ranks
router.put('/ranks', updateTicketRanks);


export default router;
