import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import RoleSelection from './components/RoleSelection';
import MentorView from './components/MentorView';
import VideoDetection from './components/VideoDetection';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/mentor" element={<MentorView />} />
          <Route path="/technician" element={<div>Technician View (Coming Soon)</div>} />
          <Route path="/video-detection" element={<VideoDetection />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
