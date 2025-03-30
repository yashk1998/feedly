import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useStore } from '../store';

const Settings = () => {
  const { user, theme, viewMode, setTheme, setViewMode } = useStore();

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Display Settings
          </Typography>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Theme</InputLabel>
            <Select value={theme} label="Theme" onChange={e => setTheme(e.target.value)}>
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>View Mode</InputLabel>
            <Select value={viewMode} label="View Mode" onChange={e => setViewMode(e.target.value)}>
              <MenuItem value="list">List View</MenuItem>
              <MenuItem value="grid">Grid View</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{user?.name}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1">{user?.email}</Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Feed Settings
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Auto-refresh Interval (seconds)
            </Typography>
            <Slider
              value={300} // 5 minutes default
              min={60}
              max={3600}
              step={60}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={value => `${value / 60} minutes`}
            />
          </Box>

          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Mark items as read automatically"
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default Settings;
