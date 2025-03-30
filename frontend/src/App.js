import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useStore } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FeedView from './pages/FeedView';
import Settings from './pages/Settings';
import { Typography } from '@mui/material';

const App = () => {
  const { theme } = useStore();

  const darkTheme = createTheme({
    palette: {
      mode: theme,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  // Placeholder Pages
  const TodayPage = () => (
    <Typography variant="h4" sx={{ p: 3 }}>
      Today&apos;s Feed
    </Typography>
  );
  const SavedPage = () => (
    <Typography variant="h4" sx={{ p: 3 }}>
      Saved Articles
    </Typography>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="feed/:feedId" element={<FeedView />} />
          <Route path="settings" element={<Settings />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="saved" element={<SavedPage />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="feed" element={<FeedView />} />
          <Route path="settings" element={<Settings />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="saved" element={<SavedPage />} />
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
};

export default App;
