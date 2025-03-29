import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useFeeds } from '../hooks/useFeeds';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShareIcon from '@mui/icons-material/Share';
import { ROUTES } from '../constants';
import { formatDate, truncateText, extractImageFromContent } from '../utils/feedUtils';

const FeedView = () => {
  const { feedId } = useParams();
  const { feeds, loading, error, updateFeedItem } = useFeeds();
  const feed = feeds.find(f => f._id === feedId);

  useEffect(() => {
    if (feed) {
      document.title = `${feed.title} - RSS Reader`;
    }
  }, [feed]);

  const handleToggleBookmark = async (itemId, isBookmarked) => {
    await updateFeedItem(feedId, itemId, { isBookmarked: !isBookmarked });
  };

  const handleShare = async (item) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: item.link,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!feed) {
    return (
      <Box p={3}>
        <Alert severity="error">Feed not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {feed.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {feed.description}
        </Typography>
        <Box display="flex" gap={1}>
          <Chip label={feed.category || 'Uncategorized'} size="small" />
          <Chip 
            label={`${feed.items?.length || 0} items`} 
            size="small" 
            variant="outlined" 
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {feed.items?.map((item) => {
          const image = item.image || extractImageFromContent(item.content);
          return (
            <Grid item xs={12} key={item.link}>
              <Card 
                sx={{ 
                  mb: 2,
                  '&:hover': {
                    boxShadow: 6,
                  }
                }}
              >
                {image && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={image}
                    alt={item.title}
                  />
                )}
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h2">
                      {item.title}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleBookmark(item.link, item.isBookmarked)}
                      >
                        {item.isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleShare(item)}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {formatDate(item.published)}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {truncateText(item.description)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => window.open(item.link, '_blank')}
                  >
                    Read More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default FeedView; 