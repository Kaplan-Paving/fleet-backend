import User from '../models/User.js'; // Adjust the path to your User model
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

/**
 * @desc    Register (create) a new user
 * @route   POST /api/auth/register
 * @access  Public (or Admin)
 */
export const register = async (req, res) => {
    // 1. Destructure all relevant fields from the request body
    const { name, userId, email, contactNo, password, role, payRate, permissions } = req.body;

    // 2. Add robust validation
    if (!name || !userId || !email || !contactNo || !password) {
        return res.status(400).json({ message: 'Please provide all required fields: name, userId, email, contactNo, and password.' });
    }

    try {
        // 3. Check if user already exists by email OR userId
        const userExists = await User.findOne({ $or: [{ email }, { userId }] });
        if (userExists) {
            return res.status(409).json({ message: 'A user with this email or User ID already exists.' });
        }

        // 4. Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create the new user with all schema fields
        const user = new User({
            name,
            userId,
            email,
            contactNo,
            password: hashedPassword,
            role,
            payRate,
            permissions
        });

        await user.save();

        // 6. Respond successfully (but without sending back sensitive info)
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                _id: user._id,
                name: user.name,
                userId: user.userId,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        // Handle potential Mongoose validation errors or other server errors
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
};

/**
 * @desc    Authenticate a user and get a token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    // 1. Allow login with either email or userId
    const { loginId, password } = req.body;

    if (!loginId || !password) {
        return res.status(400).json({ message: 'Please provide both a login ID and password.' });
    }

    try {
        // 2. Find the user by either their email or their userId
        const user = await User.findOne({
            $or: [{ email: loginId }, { userId: loginId }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 3. Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 4. Create a JWT with the user's MongoDB _id
        const token = jwt.sign(
            { userId: user._id, role: user.role }, // Use user._id for consistency
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
        );

        // 5. Set the token in a secure, HttpOnly cookie (BEST PRACTICE)
        res.cookie('token', token, {
            httpOnly: true, // Prevents client-side JS from accessing the cookie
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'strict',
            path: '/',// Helps prevent CSRF attacks
            maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
        });

        // 6. Send back public user data in the response body
        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                userId: user.userId,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
};


export const logout = (req, res) => {
    console.log('--- LOGOUT ROUTE HIT ---');

    // The options here MUST be identical to the login function's options
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/', // ✅ Crucial: This must match the login path
        expires: new Date(0)
    });

    res.status(200).json({ message: 'Logged out successfully' });
};