/**
 * Updates the `lastSeen` timestamp for the authenticated user on each request.
 * This should be placed after your authentication middleware.
 */
export const updateLastSeen = async (req, res, next) => {
    // The `verifyToken` middleware should have already attached the user to req.user
    if (req.user) {
        try {
            // We update the database in the background and don't wait for it to complete.
            // This prevents slowing down the API response.
            req.user.lastSeen = new Date();
            req.user.save();
        } catch (error) {
            // Log the error but don't block the request
            console.error('Could not update lastSeen timestamp:', error);
        }
    }
    next(); // Always continue to the actual route handler
};
