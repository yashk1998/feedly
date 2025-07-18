"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAdmin = exports.requireAuth = void 0;
const express_1 = require("@clerk/express");
const index_1 = require("../index");
const index_2 = require("../index");
const requireAuth = async (req, res, next) => {
    try {
        const { userId } = (0, express_1.getAuth)(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.userId = userId;
        // Optionally fetch user from database
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            // Create user if doesn't exist (first time login)
            const clerkUser = req.auth?.user;
            if (clerkUser) {
                const newUser = await index_1.prisma.user.create({
                    data: {
                        id: userId,
                        email: clerkUser.emailAddresses[0]?.emailAddress || '',
                        name: clerkUser.fullName || '',
                        tz: clerkUser.publicMetadata?.timezone || null
                    }
                });
                req.user = newUser;
            }
        }
        else {
            req.user = user;
        }
        next();
    }
    catch (error) {
        index_2.logger.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = (req, res, next) => {
    if (req.user?.email !== 'yash.khivasara@gmail.com') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const optionalAuth = async (req, res, next) => {
    try {
        const { userId } = (0, express_1.getAuth)(req);
        if (userId) {
            req.userId = userId;
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId }
            });
            req.user = user;
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