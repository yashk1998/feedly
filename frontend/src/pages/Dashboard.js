import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, OpenInNew, BookmarkAdd, BookmarkRemove } from '@mui/icons-material';
import { useStore } from '../store';
import AddFeedDialog from '../components/AddFeedDialog';
import { POPULAR_FEEDS } from '../constants';
import { extractImageFromContent, formatPublishedDate } from '../utils/feedUtils';

const Dashboard = () => {
  const {
    feeds,
    addFeed,
    fetchFeeds,
    loading: storeLoading,
    error: storeError,
    token,
  } = useStore();

  const [openAddFeed, setOpenAddFeed] = useState(false);
  const [displayFeeds, setDisplayFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchFeeds();
    } else {
      setDisplayFeeds(POPULAR_FEEDS.map(f => ({ ...f, isPopular: true })));
    }
  }, [token, fetchFeeds]);

  useEffect(() => {
    if (token && feeds.length > 0) {
      setDisplayFeeds(POPULAR_FEEDS.map(f => ({ ...f, isPopular: true })));
    } else if (!token) {
      setDisplayFeeds(POPULAR_FEEDS.map(f => ({ ...f, isPopular: true })));
    }
    setIsLoading(storeLoading);
    setError(storeError);
  }, [feeds, token, storeLoading, storeError]);

  const handleAddFeed = async url => {
    try {
      await addFeed(url);
      setOpenAddFeed(false);
    } catch (err) {
      console.error('Failed to add feed:', err);
    }
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5">Discover Feeds</Typography>
        {token && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddFeed(true)}
          >
            Add Feed
          </Button>
        )}
      </Paper>

      {isLoading && (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {displayFeeds.map(feed => (
          <Grid item xs={12} sm={6} md={4} key={feed.url}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div">
                  {feed.title}
                </Typography>
                <Chip label={feed.category || 'Unknown'} size="small" sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {feed.description || 'Popular feed suggestion.'}
                </Typography>
              </CardContent>
              <CardActions>
                {token && (
                  <Tooltip title="Add this feed to your list">
                    <IconButton size="small" onClick={() => handleAddFeed(feed.url)}>
                      <BookmarkAdd />
                    </IconButton>
                  </Tooltip>
                )}
                <Button size="small" href={feed.url} target="_blank" startIcon={<OpenInNew />}>
                  Visit
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <AddFeedDialog
        open={openAddFeed}
        onClose={() => setOpenAddFeed(false)}
        onAddFeed={handleAddFeed}
      />
    </Box>
  );
};

export default Dashboard;
