const { createClient } = require('redis');
const { logger } = require('../utils/logger');
const config = require('../config/config');

const client = createClient({
    username: config.redis.username,
    password: config.redis.password,
    socket: {
        host: config.redis.host,
        port: config.redis.port
    }
});

client.on('error', (err) => {
    logger.error('Redis Client Error:', err);
});

client.on('connect', () => {
    logger.info('Redis Client Connected');
});

const connect = async () => {
    try {
        if (!client.isOpen) {
            await client.connect();
        }
    } catch (error) {
        logger.error('Redis Connection Error:', error);
        throw error;
    }
};

const disconnect = async () => {
    try {
        if (client.isOpen) {
            await client.disconnect();
        }
    } catch (error) {
        logger.error('Redis Disconnection Error:', error);
        throw error;
    }
};

const set = async (key, value, expireSeconds = null) => {
    try {
        await connect();
        await client.set(key, JSON.stringify(value));
        if (expireSeconds) {
            await client.expire(key, expireSeconds);
        }
    } catch (error) {
        logger.error('Redis Set Error:', error);
        throw error;
    }
};

const get = async (key) => {
    try {
        await connect();
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        logger.error('Redis Get Error:', error);
        throw error;
    }
};

const del = async (key) => {
    try {
        await connect();
        await client.del(key);
    } catch (error) {
        logger.error('Redis Delete Error:', error);
        throw error;
    }
};

const exists = async (key) => {
    try {
        await connect();
        return await client.exists(key);
    } catch (error) {
        logger.error('Redis Exists Error:', error);
        throw error;
    }
};

// Cache feed data
const cacheFeed = async (feedId, feedData, expireSeconds = 3600) => {
    const key = `feed:${feedId}`;
    await set(key, feedData, expireSeconds);
};

const getCachedFeed = async (feedId) => {
    const key = `feed:${feedId}`;
    return await get(key);
};

// Cache user preferences
const cacheUserPreferences = async (userId, preferences) => {
    const key = `user:${userId}:preferences`;
    await set(key, preferences);
};

const getCachedUserPreferences = async (userId) => {
    const key = `user:${userId}:preferences`;
    return await get(key);
};

module.exports = {
    connect,
    disconnect,
    set,
    get,
    del,
    exists,
    cacheFeed,
    getCachedFeed,
    cacheUserPreferences,
    getCachedUserPreferences
}; 