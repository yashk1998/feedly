const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getAllFeeds,
  getFeed,
  addFeed,
  updateFeed,
  deleteFeed,
  updateFeedItem,
  bookmarkItem
} = require('../controllers/feedController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Feed routes
router.get('/', getAllFeeds);
router.get('/:feedId', getFeed);
router.post('/', addFeed);
router.put('/:feedId', updateFeed);
router.delete('/:feedId', deleteFeed);

// Feed item routes
router.put('/:feedId/items/:itemId', updateFeedItem);
router.post('/:feedId/items/:itemId/bookmark', bookmarkItem);

module.exports = router; 