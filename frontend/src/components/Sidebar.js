import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Divider,
  Box,
  Collapse,
} from '@mui/material';
import { RssFeed, Today, Bookmark, Category, ExpandLess, ExpandMore } from '@mui/icons-material';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { getCategories, groupFeedsByCategory } from '../utils/feedUtils';

const Sidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle }) => {
  const feeds = useStore(state => state.feeds);
  const categories = getCategories(feeds);
  const feedsByCategory = groupFeedsByCategory(feeds);
  const navigate = useNavigate();
  const [openCategories, setOpenCategories] = React.useState({});

  const handleCategoryClick = category => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleFeedClick = feedId => {
    navigate(ROUTES.FEED.replace(':feedId', feedId));
    if (mobileOpen) {
      handleDrawerToggle();
    }
  };

  const handleNavigation = route => {
    navigate(route);
    if (mobileOpen) {
      handleDrawerToggle();
    }
  };

  const drawerContent = (
    <Box>
      <Toolbar />
      <List
        subheader={
          <ListSubheader component="div" sx={{ bgcolor: 'background.paper' }}> 
            Navigation
          </ListSubheader>
        }
      >
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation(ROUTES.TODAY)}>
            <ListItemIcon>
              <Today />
            </ListItemIcon>
            <ListItemText primary="Today" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation(ROUTES.SAVED)}>
            <ListItemIcon>
              <Bookmark />
            </ListItemIcon>
            <ListItemText primary="Read Later" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />

      <List
        subheader={
          <ListSubheader component="div" sx={{ bgcolor: 'background.paper' }}> 
            Your Feeds
          </ListSubheader>
        }
      >
        {categories.map(category => (
          <React.Fragment key={category}>
            <ListItemButton onClick={() => handleCategoryClick(category)}>
              <ListItemIcon>
                <Category fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={category} />
              {openCategories[category] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openCategories[category]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {feedsByCategory[category]?.map(feed => (
                  <ListItemButton
                    key={feed._id}
                    sx={{ pl: 4 }}
                    onClick={() => handleFeedClick(feed._id)}
                  >
                    <ListItemIcon>
                      <RssFeed fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={feed.title} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
