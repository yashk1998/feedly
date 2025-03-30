import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useStore } from '../store';

const AddFeedDialog = ({ open, onClose }) => {
  const { addFeed } = useStore();
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await addFeed(url, category);
      if (success) {
        setUrl('');
        setCategory('');
        onClose();
      } else {
        setError('Failed to add feed. Please check the URL and try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while adding the feed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Feed</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Feed URL"
              type="url"
              fullWidth
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              error={!!error}
              helperText={error}
            />
            <TextField
              margin="dense"
              label="Category (optional)"
              fullWidth
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Example feeds:
              <ul>
                <li>https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml</li>
                <li>http://feeds.bbci.co.uk/news/rss.xml</li>
                <li>https://www.reutersagency.com/feed/</li>
              </ul>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading || !url}>
            {loading ? 'Adding...' : 'Add Feed'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddFeedDialog;
