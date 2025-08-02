/**
 * Middleware to check if a user has 'edit' permission for a specific module.
 * This should be used on routes that modify data (POST, PUT, DELETE).
 * @param {string} module - The name of the module to check (e.g., 'Fleet Assets').
 */
export const checkEditPermission = (module) => {
    return (req, res, next) => {
        // The verifyToken middleware should have already attached the user to req.user
        const user = req.user;
        const userPermissions = user?.permissions;

        // 1. First, check if the user is a global admin by role.
        if (user && (user.role === 'admin' || user.role === 'super_admin')) {
            return next(); // Grant access immediately.
        }

        // 2. Next, check if the user has the "Admin Control" permission, which also grants global edit access.
        if (userPermissions?.get('Admin Control')?.edit) {
            return next(); // Grant access immediately.
        }

        // 3. For all other users, perform the specific permission check for the requested module.
        if (userPermissions?.get(module)?.edit) {
            // User has specific permission, proceed to the controller function.
            next();
        } else {
            // User does not have permission, block the request.
            res.status(403).json({
                message: `Access Denied: You do not have 'edit' permission for the '${module}' module.`
            });
        }
    };
};
