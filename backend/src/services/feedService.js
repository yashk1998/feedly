const Parser = require('rss-parser');
const Feed = require('../models/Feed');
const { logger } = require('../utils/logger');
const { cacheFeed, getCachedFeed } = require('./redisService');

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'content'],
      ['media:content', 'image', { keepAttributes: true }],
      ['media:thumbnail', 'thumbnail', { keepAttributes: true }]
    ]
  }
});

const extractImage = (item) => {
  if (item.image) return item.image.$.url;
  if (item.thumbnail) return item.thumbnail.$.url;
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) return imgMatch[1];
  }
  return null;
};

const fetchFeed = async (url) => {
  try {
    const feed = await parser.parseURL(url);
    return {
      title: feed.title,
      description: feed.description,
      image: feed.image?.url,
      items: feed.items.map(item => ({
        title: item.title,
        description: item.contentSnippet || item.description,
        link: item.link,
        published: item.pubDate ? new Date(item.pubDate) : new Date(),
        content: item.content,
        image: extractImage(item)
      }))
    };
  } catch (error) {
    logger.error('Error fetching feed:', error);
    throw new Error('Failed to fetch feed');
  }
};

const updateFeed = async (feedId, userId) => {
  try {
    const feed = await Feed.findOne({ _id: feedId, user: userId });
    if (!feed) throw new Error('Feed not found');

    const feedData = await fetchFeed(feed.url);
    
    // Update feed metadata
    feed.title = feedData.title;
    feed.description = feedData.description;
    feed.image = feedData.image;
    feed.lastFetched = new Date();

    // Update items
    const existingItems = new Map(feed.items.map(item => [item.link, item]));
    const newItems = feedData.items.map(item => {
      const existingItem = existingItems.get(item.link);
      if (existingItem) {
        return {
          ...existingItem.toObject(),
          title: item.title,
          description: item.description,
          content: item.content,
          image: item.image
        };
      }
      return item;
    });

    feed.items = newItems;
    await feed.save();

    // Cache the updated feed
    await cacheFeed(feedId, feed);

    return feed;
  } catch (error) {
    logger.error('Error updating feed:', error);
    throw error;
  }
};

const addFeed = async (url, userId) => {
  try {
    const feedData = await fetchFeed(url);
    const feed = new Feed({
      ...feedData,
      url,
      user: userId,
      lastFetched: new Date()
    });

    await feed.save();
    
    // Cache the new feed
    await cacheFeed(feed._id, feed);

    return feed;
  } catch (error) {
    logger.error('Error adding feed:', error);
    throw error;
  }
};

const deleteFeed = async (feedId, userId) => {
  try {
    const feed = await Feed.findOneAndDelete({ _id: feedId, user: userId });
    if (!feed) throw new Error('Feed not found');
    return feed;
  } catch (error) {
    logger.error('Error deleting feed:', error);
    throw error;
  }
};

const updateFeedItem = async (feedId, itemId, userId, updates) => {
  try {
    const feed = await Feed.findOne({ _id: feedId, user: userId });
    if (!feed) throw new Error('Feed not found');

    const item = feed.items.id(itemId);
    if (!item) throw new Error('Item not found');

    Object.assign(item, updates);
    await feed.save();

    // Update cache
    await cacheFeed(feedId, feed);

    return item;
  } catch (error) {
    logger.error('Error updating feed item:', error);
    throw error;
  }
};

const getFeed = async (feedId, userId) => {
  try {
    // Try to get from cache first
    const cachedFeed = await getCachedFeed(feedId);
    if (cachedFeed) {
      return cachedFeed;
    }

    // If not in cache, get from database
    const feed = await Feed.findOne({ _id: feedId, user: userId });
    if (!feed) throw new Error('Feed not found');

    // Cache the feed
    await cacheFeed(feedId, feed);

    return feed;
  } catch (error) {
    logger.error('Error getting feed:', error);
    throw error;
  }
};

module.exports = {
  fetchFeed,
  updateFeed,
  addFeed,
  deleteFeed,
  updateFeedItem,
  getFeed
}; 