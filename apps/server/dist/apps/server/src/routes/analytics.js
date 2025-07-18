"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Placeholder for analytics functionality
router.get('/kpi', auth_1.requireAuth, async (req, res) => {
    const authReq = req;
    res.json({ message: 'Analytics KPIs coming soon', userId: authReq.userId });
});
exports.default = router;
//# sourceMappingURL=analytics.js.map