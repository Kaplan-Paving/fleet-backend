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
            secure: true,
            sameSite: 'None',
            partitioned: true,
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
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        secure: true,
        sameSite: 'None',
        partitioned: true,
        path: '/',// Helps prevent CSRF attacks
        expires: new Date(0)
    });

    res.status(200).json({ message: 'Logged out successfully' });
};


/**
 * @desc    Search for users by name, email, or userId
 * @route   GET /api/users/search?q=...
 * @access  Private (Admin)
 */
export const searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(200).json([]); // Return empty array if no query
        }

        // Create a case-insensitive regex for searching
        const searchRegex = new RegExp(query, 'i');

        // Find users matching the query in name, email, or userId fields
        const users = await User.find({
            $or: [
                { name: searchRegex },
                { email: searchRegex },
                { userId: searchRegex }
            ]
        }).select('name email userId payRate').limit(10); // Limit to 10 results for performance

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Update a user's pay rate
 * @route   PUT /api/users/:id/payrate
 * @access  Private (Admin)
 */
export const updateUserPayrate = async (req, res) => {
    try {
        const { payRate } = req.body;
        if (typeof payRate !== 'number') {
            return res.status(400).json({ message: 'Pay rate must be a number.' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { payRate },
            { new: true, runValidators: true }
        ).select('name email userId payRate');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ message: 'Error updating pay rate', error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    const { emailOrId, oldPassword, newPassword } = req.body;

    // --- Validation ---
    if (!emailOrId || !oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    try {
        // --- Find User ---
        const user = await User.findOne({
            $or: [{ email: emailOrId }, { userId: emailOrId }]
        });

        if (!user) {
            return res.status(404).json({ message: 'User with that email or ID not found.' });
        }

        // --- Verify Old Password ---
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect old password.' });
        }

        // --- Hash and Save New Password ---
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
