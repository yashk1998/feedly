const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const feedController = require('../controllers/feedController');
const { validateRequest } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const feedValidation = [
  body('url').isURL().withMessage('Please enter a valid URL'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('category').optional().trim()
];

// Routes
router.use(authenticate); // Protect all feed routes

router.get('/', feedController.getAllFeeds);
router.post('/', feedValidation, validateRequest, feedController.addFeed);
router.get('/:id', feedController.getFeedById);
router.put('/:id', feedValidation, validateRequest, feedController.updateFeedById);
router.delete('/:id', feedController.deleteFeed);
router.put('/:id/items/:itemId', feedController.updateFeedItem);

module.exports = router; 