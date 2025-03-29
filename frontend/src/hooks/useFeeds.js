import { useState, useEffect } from 'react';
import { feedAPI } from '../services/api';
import { useStore } from '../store';

export const useFeeds = () => {
  const { feeds, setFeeds, addFeed: addFeedToStore, updateFeed: updateFeedInStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await feedAPI.getAllFeeds();
      setFeeds(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch feeds');
      console.error('Error fetching feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  const addFeed = async (url) => {
    try {
      setError(null);
      const response = await feedAPI.addFeed(url);
      addFeedToStore(response.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add feed');
      console.error('Error adding feed:', err);
      return false;
    }
  };

  const updateFeed = async (feedId, data) => {
    try {
      setError(null);
      const response = await feedAPI.updateFeed(feedId, data);
      updateFeedInStore(feedId, response.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update feed');
      console.error('Error updating feed:', err);
      return false;
    }
  };

  const updateFeedItem = async (feedId, itemId, data) => {
    try {
      setError(null);
      const response = await feedAPI.updateFeedItem(feedId, itemId, data);
      updateFeedInStore(feedId, response.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update feed item');
      console.error('Error updating feed item:', err);
      return false;
    }
  };

  const bookmarkItem = async (feedId, itemId) => {
    try {
      setError(null);
      const response = await feedAPI.bookmarkItem(feedId, itemId);
      updateFeedInStore(feedId, response.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to bookmark item');
      console.error('Error bookmarking item:', err);
      return false;
    }
  };

  return {
    feeds,
    loading,
    error,
    fetchFeeds,
    addFeed,
    updateFeed,
    updateFeedItem,
    bookmarkItem,
  };
}; 