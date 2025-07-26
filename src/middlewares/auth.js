import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // 1. Import your User model

/**
 * Middleware to verify JWT from an HttpOnly cookie and attach user to the request.
 * This is the primary middleware for session-based web authentication.
 */
export const verifyToken = async (req, res, next) => {
    // 2. Read the token from the 'token' cookie instead of the Authorization header
    const token = req.cookies.token;

    if (!token) {
        // No cookie found, user is not authenticated
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // 3. Verify the token is valid
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Use the ID from the token to find the fresh user data from the database
        // This is more secure as it ensures the user still exists and has up-to-date permissions.
        // We exclude the password from the user object we attach to the request.
        req.user = await User.findById(decoded.userId).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        next(); // 5. User is valid, proceed to the next middleware or route handler
    } catch (err) {
        // This will catch errors from jwt.verify (e.g., expired or malformed token)
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

/**
 * Middleware to authorize users based on their roles.
 * This should be used *after* the verifyToken middleware.
 */
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // The `req.user` object is attached by the `verifyToken` middleware.
        // We check if the user's role is included in the list of allowed roles.
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: You do not have permission to perform this action.' });
        }
        next();
    };
};
