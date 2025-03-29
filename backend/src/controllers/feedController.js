const feedService = require('../services/feedService');
const { logger } = require('../utils/logger');

const getAllFeeds = async (req, res) => {
  try {
    const feeds = await Feed.find({ user: req.user._id })
      .sort({ lastFetched: -1 });
    res.json(feeds);
  } catch (error) {
    logger.error('Error getting feeds:', error);
    res.status(500).json({ message: 'Error fetching feeds' });
  }
};

const getFeed = async (req, res) => {
  try {
    const feed = await Feed.findOne({
      _id: req.params.feedId,
      user: req.user._id
    });

    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    res.json(feed);
  } catch (error) {
    logger.error('Error getting feed:', error);
    res.status(500).json({ message: 'Error fetching feed' });
  }
};

const addFeed = async (req, res) => {
  try {
    const { url } = req.body;
    const feed = await feedService.addFeed(url, req.user._id);
    res.status(201).json(feed);
  } catch (error) {
    logger.error('Error adding feed:', error);
    res.status(400).json({ message: error.message });
  }
};

const updateFeed = async (req, res) => {
  try {
    const feed = await feedService.updateFeed(req.params.feedId, req.user._id);
    res.json(feed);
  } catch (error) {
    logger.error('Error updating feed:', error);
    res.status(400).json({ message: error.message });
  }
};

const deleteFeed = async (req, res) => {
  try {
    await feedService.deleteFeed(req.params.feedId, req.user._id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting feed:', error);
    res.status(400).json({ message: error.message });
  }
};

const updateFeedItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;
    const item = await feedService.updateFeedItem(
      req.params.feedId,
      itemId,
      req.user._id,
      updates
    );
    res.json(item);
  } catch (error) {
    logger.error('Error updating feed item:', error);
    res.status(400).json({ message: error.message });
  }
};

const bookmarkItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const feed = await Feed.findOne({
      _id: req.params.feedId,
      user: req.user._id
    });

    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    const item = feed.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.bookmarked = !item.bookmarked;
    await feed.save();

    res.json(item);
  } catch (error) {
    logger.error('Error bookmarking item:', error);
    res.status(500).json({ message: 'Error bookmarking item' });
  }
};

module.exports = {
  getAllFeeds,
  getFeed,
  addFeed,
  updateFeed,
  deleteFeed,
  updateFeedItem,
  bookmarkItem
}; 