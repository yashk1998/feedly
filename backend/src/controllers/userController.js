const User = require('../models/User');
const { logger } = require('../utils/logger');
const { cacheUserPreferences, getCachedUserPreferences } = require('../services/redisService');

const getPreferences = async (req, res) => {
  try {
    // Try to get from cache first
    const cachedPreferences = await getCachedUserPreferences(req.user.id);
    if (cachedPreferences) {
      return res.json(cachedPreferences);
    }

    const user = await User.findById(req.user.id).select('preferences');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cache the preferences
    await cacheUserPreferences(req.user.id, user.preferences);

    res.json(user.preferences);
  } catch (error) {
    logger.error('Get preferences error:', error);
    res.status(500).json({ message: 'Error fetching preferences' });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const { theme, viewMode, autoRefresh, autoRefreshInterval } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'preferences.theme': theme,
          'preferences.viewMode': viewMode,
          'preferences.autoRefresh': autoRefresh,
          'preferences.autoRefreshInterval': autoRefreshInterval
        }
      },
      { new: true }
    ).select('preferences');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update cache
    await cacheUserPreferences(req.user.id, user.preferences);

    res.json(user.preferences);
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ message: 'Error updating preferences' });
  }
};

module.exports = {
  getPreferences,
  updatePreferences
}; 