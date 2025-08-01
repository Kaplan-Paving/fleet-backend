import User from '../models/User.js'; // Adjust the path to your User model
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto'; // Node.js module for generating random data
dotenv.config();




/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin)
 */
export const getUsers = async (req, res) => {
    try {
        // Fetch all users but exclude their passwords from the response
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Create a new user, generate a random password, and send it back.
 * @route   POST /api/users/create
 * @access  Private (Admin)
 */
export const createUserWithGeneratedPassword = async (req, res) => {
    // 1. Get the form data from the AddUpdateUserCard
    const { name, identificationNumber, email, contact } = req.body;

    // 2. Validate the required fields from the frontend form
    if (!name || !identificationNumber || !email) {
        return res.status(400).json({ message: 'Name, Identification Number, and Email are required.' });
    }

    try {
        // 3. Check if a user with the same email or userId already exists
        const userExists = await User.findOne({ $or: [{ email }, { userId: identificationNumber }] });
        if (userExists) {
            return res.status(409).json({ message: 'User with this email or ID already exists.' });
        }

        // 4. Generate a secure random password
        const generatedPassword = crypto.randomBytes(8).toString('hex'); // Creates a 16-character hex string

        // 5. Hash the generated password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(generatedPassword, salt);

        // 6. Create and save the new user
        const newUser = new User({
            name,
            userId: identificationNumber,
            email,
            contactNo: contact,
            password: hashedPassword,
            // You can set default role, permissions, etc. here if needed
        });
        await newUser.save();

        // 7. Send a success response that INCLUDES the generated password
        // The frontend will use this password for the CSV download.
        res.status(201).json({
            message: `User ${name} created successfully.`,
            generatedPassword: generatedPassword // This is crucial for the download feature
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

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
 * @desc    Authenticate a user and return the COMPLETE user object
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
        return res.status(400).json({ message: 'Please provide both a login ID and password.' });
    }

    try {
        // Find the user by either their email or their userId
        const user = await User.findOne({
            $or: [{ email: loginId }, { userId: loginId }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            partitioned: true,
            path: '/',
            maxAge: 24 * 60 * 60 * 1000
        });

        // ✅ FIX: Send back a clean user object without the password.
        // This ensures the frontend receives the full user profile, including permissions,
        // immediately after logging in.
        const userForClient = {
            _id: user._id,
            name: user.name,
            userId: user.userId,
            email: user.email,
            role: user.role,
            permissions: user.permissions, // Make sure to include this!
            // ... include any other non-sensitive fields
        };

        res.status(200).json({
            user: userForClient
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

/**
 * @desc    Update a user's details. It assigns role-based permissions
 * but allows them to be overridden by manually set permissions.
 * @route   PUT /api/users/:id
 * @access  Private (Admin)
 */
export const updateUser = async (req, res) => {
    try {
        const updateData = req.body;
        console.log("this is hit", updateData)

        // 1. If a role is specified, determine the base permissions for that role.
        if (updateData.role) {
            let rolePermissions = {
                'Dashboard': { view: true, edit: false },
            };

            switch (updateData.role) {
                case 'admin':
                case 'super_admin':
                    rolePermissions = {
                        'Dashboard': { view: true, edit: true },
                        'Fleet Assets': { view: true, edit: true },
                        'Repair Ticketing': { view: true, edit: true },
                        'Maintenance': { view: true, edit: true },
                        'Operators Module': { view: true, edit: true },
                        'Report': { view: true, edit: true },
                        'Admin Control': { view: true, edit: true },
                    };
                    break;
                case 'operator':
                    rolePermissions['Repair Ticketing'] = { view: true, edit: true };
                    rolePermissions['Operators Module'] = { view: true, edit: true };
                    break;
                case 'mechanic':
                    rolePermissions['Maintenance'] = { view: true, edit: true };
                    rolePermissions['Repair Ticketing'] = { view: true, edit: false };
                    break;
                default:
                    break;
            }

            // 2. Merge the role-based permissions with any manually specified permissions from the frontend.
            // The manually specified permissions will take precedence.
            updateData.permissions = { ...rolePermissions, ...updateData.permissions };
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: 'Error updating user', error: error.message });
    }
};
