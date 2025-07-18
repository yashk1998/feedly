"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Placeholder for admin functionality
router.get('/stats', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    const authReq = req;
    res.json({ message: 'Admin stats coming soon', userId: authReq.userId });
});
exports.default = router;
//# sourceMappingURL=admin.js.map