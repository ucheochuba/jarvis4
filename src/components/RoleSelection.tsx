import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Container } from '@mui/material';

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Please select your role
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/mentor')}
            sx={{
              minWidth: 200,
              height: 60,
              fontSize: '1.2rem'
            }}
          >
            Mentor
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/technician')}
            sx={{
              minWidth: 200,
              height: 60,
              fontSize: '1.2rem'
            }}
          >
            Technician
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default RoleSelection; 