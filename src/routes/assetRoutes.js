import express from 'express';
import {
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    deleteAsset
} from '../controllers/assetController.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import { protect } from '../middlewares/auth.js';
const router = express.Router();

// Permissions required for each operation
router.post('/', protect, createAsset);
router.get('/', protect, getAllAssets);
router.get('/:id', protect, checkPermission(['view_asset']), getAssetById);
router.put('/:id', protect, checkPermission(['edit_asset']), updateAsset);
router.delete('/:id', protect, checkPermission(['delete_asset']), deleteAsset);

export default router;
