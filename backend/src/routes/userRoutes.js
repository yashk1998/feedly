const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { validateRequest } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const preferencesValidation = [
  body('theme').optional().isIn(['light', 'dark']).withMessage('Invalid theme'),
  body('viewMode').optional().isIn(['grid', 'list']).withMessage('Invalid view mode'),
  body('autoRefresh').optional().isBoolean().withMessage('Auto refresh must be a boolean'),
  body('autoRefreshInterval')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Auto refresh interval must be between 1 and 60 minutes')
];

// Routes
router.use(authenticate); // Protect all user routes

router.get('/preferences', userController.getPreferences);
router.put('/preferences', preferencesValidation, validateRequest, userController.updatePreferences);

module.exports = router; 