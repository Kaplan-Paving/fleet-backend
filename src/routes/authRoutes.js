import express from 'express';
import { register, login, logout, createUserWithGeneratedPassword, getUsers, updateUser } from '../controllers/authController.js';
import { authorizeRoles } from '../middlewares/auth.js';
import { protect } from '../middlewares/auth.js';
import { searchUsers, updateUserPayrate, resetPassword, } from '../controllers/authController.js';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
/**
 * @desc    Log a user out / clear the cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
router.post('/logout', logout);
router.get('/admin-only', protect, authorizeRoles('admin', 'super_admin'), (req, res) => {
    res.send('Admin content');
});
router.get('/search', searchUsers);
router.put('/:id/payrate', updateUserPayrate);
router.put('/reset-password', resetPassword);
router.get('/me', protect, (req, res) => {
    // 3. If the code reaches here, it means verifyToken was successful.
    // The user's data is already attached to `req.user` by the middleware.

    // The middleware has already handled the case where req.user might not be found.
    // So we can safely send it back.
    res.status(200).json({ user: req.user });
});
router.post('/create', createUserWithGeneratedPassword);
router.get('/users', getUsers)
router.put('/user/:id', updateUser)

export default router;
