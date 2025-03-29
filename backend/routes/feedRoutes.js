const express = require('express');
const router = express.Router();
const Feed = require('../models/Feed');
const feedparser = require('feedparser');
const fetch = require('node-fetch');

// Get all feeds for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const feeds = await Feed.find({ user: req.params.userId });
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new feed
router.post('/', async (req, res) => {
  try {
    const { url, userId, category } = req.body;
    
    // Fetch and parse the feed
    const response = await fetch(url);
    const feedData = await new Promise((resolve, reject) => {
      const parser = new feedparser();
      const items = [];
      
      parser.on('error', reject);
      parser.on('end', () => resolve(items));
      parser.on('data', (item) => items.push(item));
      
      response.body.pipe(parser);
    });

    const feed = new Feed({
      url,
      user: userId,
      category,
      title: feedData[0]?.feed?.title || 'Untitled Feed',
      description: feedData[0]?.feed?.description || '',
      items: feedData.map(item => ({
        title: item.title,
        link: item.link,
        description: item.description,
        published: item.pubDate,
        author: item.author
      }))
    });

    await feed.save();
    res.status(201).json(feed);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update feed items (mark as read/saved)
router.patch('/:feedId/items/:itemId', async (req, res) => {
  try {
    const { read, saved } = req.body;
    const feed = await Feed.findById(req.params.feedId);
    
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    const item = feed.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (read !== undefined) item.read = read;
    if (saved !== undefined) item.saved = saved;

    await feed.save();
    res.json(feed);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a feed
router.delete('/:id', async (req, res) => {
  try {
    const feed = await Feed.findByIdAndDelete(req.params.id);
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }
    res.json({ message: 'Feed deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 