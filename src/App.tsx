import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import RoleSelection from './components/RoleSelection';
import MentorView from './components/MentorView';
import DockWorkerView from './components/DockWorkerView';

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
          <Route path="/dock-worker" element={<DockWorkerView />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
