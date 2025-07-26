export const checkPermission = (requiredPermissions) => {
    // Ensure it's always an array, even if a single string is passed
    const permissionsArray = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        if (!user.permissions || !Array.isArray(user.permissions)) {
            return res.status(403).json({ message: 'Access denied. No permissions assigned.' });
        }

        const hasPermission = permissionsArray.some(permission =>
            user.permissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }

        next();
    };
};
