import React, { useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  CardMedia,
  CardActions,
  Chip,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useFeeds } from '../hooks/useFeeds';
import { useAuth } from '../hooks/useAuth';
import AddFeedDialog from '../components/AddFeedDialog';
import { POPULAR_FEEDS, ROUTES } from '../constants';
import { truncateText, calculateFeedStats } from '../utils/feedUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const { feeds, loading, error, addFeed } = useFeeds();
  const { user } = useAuth();
  const [openAddFeed, setOpenAddFeed] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleAddFeed = async (url) => {
    const success = await addFeed(url);
    if (success) {
      setOpenAddFeed(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Welcome, {user?.name || 'User'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenAddFeed(true)}
        >
          Add Feed
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} centered>
          <Tab label="Your Feeds" />
          <Tab label="Popular Feeds" />
        </Tabs>
      </Paper>

      {selectedTab === 0 ? (
        <Grid container spacing={3}>
          {feeds.map((feed) => {
            const stats = calculateFeedStats(feed);
            return (
              <Grid item xs={12} md={6} lg={4} key={feed._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 6,
                    }
                  }}
                >
                  {feed.image && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={feed.image}
                      alt={feed.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="h2">
                      {feed.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {truncateText(feed.description)}
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <Chip label={feed.category || 'Uncategorized'} size="small" />
                      <Chip 
                        label={`${stats.unread} unread`} 
                        size="small" 
                        variant="outlined" 
                        color={stats.unread > 0 ? 'primary' : 'default'}
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => navigate(ROUTES.FEED.replace(':feedId', feed._id))}
                      endIcon={<OpenInNewIcon />}
                    >
                      View Feed
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {POPULAR_FEEDS.map((feed) => (
            <Grid item xs={12} md={6} lg={4} key={feed.url}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 6,
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {feed.title}
                  </Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <Chip label={feed.category} size="small" />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleAddFeed(feed.url)}
                    endIcon={<OpenInNewIcon />}
                  >
                    Add Feed
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <AddFeedDialog
        open={openAddFeed}
        onClose={() => setOpenAddFeed(false)}
        onAdd={handleAddFeed}
      />
    </Box>
  );
};

export default Dashboard; 