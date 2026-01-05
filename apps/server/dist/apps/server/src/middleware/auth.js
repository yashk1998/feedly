"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAdmin = exports.requireAuth = void 0;
const index_1 = require("../index");
const index_2 = require("../index");
const users_1 = require("../services/users");
const requireAuth = async (req, res, next) => {
    const clerkReq = req;
    const authReq = req;
    try {
        if (!clerkReq.auth || !clerkReq.auth.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = clerkReq.auth.userId;
        authReq.userId = userId;
        const user = await (0, users_1.syncClerkUser)(userId);
        authReq.user = user;
        next();
    }
    catch (error) {
        index_2.logger.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = (req, res, next) => {
    const authReq = req;
    if (authReq.user?.email !== 'yash.khivasara@gmail.com') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const optionalAuth = async (req, res, next) => {
    const clerkReq = req;
    const authReq = req;
    try {
        if (clerkReq.auth?.userId) {
            const userId = clerkReq.auth.userId;
            authReq.userId = userId;
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId }
            });
            authReq.user = user;
        }
        next();
    }
    catch (error) {
        index_2.logger.error('Optional auth middleware error:', error);
        next(); // Continue without auth
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map