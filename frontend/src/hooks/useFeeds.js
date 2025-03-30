import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store'; // Assuming store handles feed state
import {
  // Import individual functions instead of feedAPI object
  fetchAllFeeds as apiFetchAllFeeds,
  addNewFeed as apiAddNewFeed,
  removeFeed as apiRemoveFeed,
  updateExistingFeed as apiUpdateExistingFeed,
  updateFeedItemStatus as apiUpdateFeedItemStatus,
} from '../services/api';

// This hook might need significant refactoring depending on how state is managed (Zustand vs local)
// Let's assume Zustand (useStore) is the primary state manager for feeds now.
// This hook could potentially be simplified or removed if all logic moves to the store.

export const useFeeds = () => {
  const {
    feeds,
    setFeeds,
    setLoading,
    setError,
    addFeed: storeAddFeed,
    updateFeed: storeUpdateFeed,
    deleteFeed: storeDeleteFeed,
    updateItem: storeUpdateItem,
    token, // Needed for API calls implicitly via interceptor
  } = useStore();

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Example: Fetch feeds function (might be redundant if store handles it)
  const fetchFeeds = useCallback(async () => {
    if (!token) return; // Don't fetch if not logged in
    setLocalLoading(true);
    setLocalError(null);
    // Use the direct API function
    try {
      const response = await apiFetchAllFeeds();
      // Update store state (assuming store handles this)
      // useStore.setState({ feeds: response.data, loading: false });
      setFeeds(response.data); // Directly update if store exposes setter
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to fetch feeds';
      setLocalError(message);
      setError(message); // Update store error
    } finally {
      setLocalLoading(false);
      setLoading(false); // Update store loading
    }
  }, [token, setFeeds, setLoading, setError]);

  // Example: Add feed function (might be redundant)
  const addFeed = useCallback(
    async (url) => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        // Use the direct API function
        const response = await apiAddNewFeed(url);
        // Update store (assuming store handles this)
        // storeAddFeed(response.data);
        return true; // Indicate success
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || 'Failed to add feed';
        setLocalError(message);
        setError(message);
        return false; // Indicate failure
      } finally {
        setLocalLoading(false);
      }
    },
    [setError] // Add storeAddFeed if used
  );

  // Example: Delete feed (might be redundant)
  const deleteFeed = useCallback(
    async (feedId) => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        // Use the direct API function
        await apiRemoveFeed(feedId);
        // Update store (assuming store handles this)
        // storeDeleteFeed(feedId);
        return true;
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || 'Failed to delete feed';
        setLocalError(message);
        setError(message);
        return false;
      } finally {
        setLocalLoading(false);
      }
    },
    [setError] // Add storeDeleteFeed if used
  );

  // Example: Update feed item (might be redundant)
  const updateFeedItem = useCallback(
    async (feedId, itemId, updates) => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        // Use the direct API function
        const response = await apiUpdateFeedItemStatus(feedId, itemId, updates);
        // Update store (assuming store handles this)
        // storeUpdateItem(feedId, itemId, response.data);
        return response.data;
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || 'Failed to update item';
        setLocalError(message);
        setError(message);
        return null;
      } finally {
        setLocalLoading(false);
      }
    },
    [setError] // Add storeUpdateItem if used
  );

  // Return values needed by components (consider simplifying based on store usage)
  return {
    feeds,
    loading: localLoading,
    error: localError,
    fetchFeeds,
    addFeed,
    deleteFeed,
    updateFeedItem,
  };
};
