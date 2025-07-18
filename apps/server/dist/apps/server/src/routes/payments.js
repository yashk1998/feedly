"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Placeholder for payments functionality
router.post('/webhook', async (req, res) => {
    res.json({ message: 'Webhook received' });
});
router.get('/plans', auth_1.requireAuth, async (req, res) => {
    const authReq = req;
    res.json({ message: 'Plans endpoint coming soon', userId: authReq.userId });
});
exports.default = router;
//# sourceMappingURL=payments.js.map