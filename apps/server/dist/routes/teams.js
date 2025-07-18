"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Placeholder for teams functionality
router.get('/', auth_1.requireAuth, async (req, res) => {
    res.json({ message: 'Teams feature coming soon' });
});
exports.default = router;
//# sourceMappingURL=teams.js.map