const Feed = require('../models/Feed');
const { logger } = require('../utils/logger');
const { updateFeed, getCachedFeed } = require('../services/redisService');

const getAllFeeds = async (req, res) => {
  try {
    const feeds = await Feed.find({ user: req.user.id });
    res.json(feeds);
  } catch (error) {
    logger.error('Get all feeds error:', error);
    res.status(500).json({ message: 'Error fetching feeds' });
  }
};

const getFeedById = async (req, res) => {
  try {
    // Try to get from cache first
    const cachedFeed = await getCachedFeed(req.params.id);
    if (cachedFeed) {
      return res.json(cachedFeed);
    }

    const feed = await Feed.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    res.json(feed);
  } catch (error) {
    logger.error('Get feed error:', error);
    res.status(500).json({ message: 'Error fetching feed' });
  }
};

const addFeed = async (req, res) => {
  try {
    const { url, title, description, category } = req.body;

    // Check if feed already exists for user
    const existingFeed = await Feed.findOne({
      url,
      user: req.user.id
    });

    if (existingFeed) {
      return res.status(400).json({ message: 'Feed already exists' });
    }

    const feed = new Feed({
      url,
      title,
      description,
      category,
      user: req.user.id
    });

    await feed.save();

    // Cache the new feed
    await updateFeed(feed._id, feed);

    res.status(201).json(feed);
  } catch (error) {
    logger.error('Add feed error:', error);
    res.status(500).json({ message: 'Error adding feed' });
  }
};

const updateFeedById = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    const feed = await Feed.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, description, category },
      { new: true }
    );

    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    // Update cache
    await updateFeed(feed._id, feed);

    res.json(feed);
  } catch (error) {
    logger.error('Update feed error:', error);
    res.status(500).json({ message: 'Error updating feed' });
  }
};

const deleteFeed = async (req, res) => {
  try {
    const feed = await Feed.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    res.json({ message: 'Feed deleted successfully' });
  } catch (error) {
    logger.error('Delete feed error:', error);
    res.status(500).json({ message: 'Error deleting feed' });
  }
};

const updateFeedItem = async (req, res) => {
  try {
    const { read, bookmarked } = req.body;
    const feed = await Feed.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    const item = feed.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (read !== undefined) item.read = read;
    if (bookmarked !== undefined) item.bookmarked = bookmarked;

    await feed.save();

    // Update cache
    await updateFeed(feed._id, feed);

    res.json(item);
  } catch (error) {
    logger.error('Update feed item error:', error);
    res.status(500).json({ message: 'Error updating feed item' });
  }
};

module.exports = {
  getAllFeeds,
  getFeedById,
  addFeed,
  updateFeedById,
  deleteFeed,
  updateFeedItem
}; 