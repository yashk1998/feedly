import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  RssFeed as FeedIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useStore } from '../store';

const FeedList = ({ feeds }) => {
  const navigate = useNavigate();
  const { deleteFeed, setSelectedFeed } = useStore();
  const [openCategories, setOpenCategories] = React.useState({});

  const handleCategoryClick = category => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleFeedClick = feed => {
    setSelectedFeed(feed);
    navigate(`/feed/${feed._id}`);
  };

  const handleDeleteFeed = async (e, feedId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this feed?')) {
      await deleteFeed(feedId);
    }
  };

  // Group feeds by category
  const feedsByCategory = feeds.reduce((acc, feed) => {
    const category = feed.category || 'FEEDS';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feed);
    return acc;
  }, {});

  return (
    <List>
      {Object.entries(feedsByCategory).map(([category, categoryFeeds]) => (
        <React.Fragment key={category}>
          <ListItem button onClick={() => handleCategoryClick(category)}>
            <ListItemIcon>
              <FeedIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="subtitle1">
                    {category} ({categoryFeeds.length})
                  </Typography>
                  {openCategories[category] ? <ExpandLess /> : <ExpandMore />}
                </Box>
              }
            />
          </ListItem>
          <Collapse in={openCategories[category]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {categoryFeeds.map(feed => (
                <ListItem
                  key={feed._id}
                  button
                  sx={{ pl: 4 }}
                  onClick={() => handleFeedClick(feed)}
                >
                  <ListItemText primary={feed.title} secondary={`${feed.items.length} items`} />
                  <IconButton edge="end" size="small" onClick={e => handleDeleteFeed(e, feed._id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      ))}
    </List>
  );
};

export default FeedList;
