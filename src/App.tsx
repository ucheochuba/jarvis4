import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import RoleSelection from './components/RoleSelection';
import MentorView from './components/MentorView';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4A7C72', // dark-green
    },
    secondary: {
      main: '#A9D3F5', // light-blue
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
    },
  },
  typography: {
    fontFamily: "'Public Sans', sans-serif",
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
          <Route path="/technician" element={<MentorView />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
