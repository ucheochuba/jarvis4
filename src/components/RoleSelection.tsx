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
        <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Welcome
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'text.secondary' }}>
          Please select your role
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/mentor')}
            sx={{
              minWidth: 200,
              height: 60,
              fontSize: '1.2rem',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
                backgroundColor: 'primary.dark',
              },
            }}
          >
            Mentor
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/technician')}
            sx={{
              minWidth: 200,
              height: 60,
              fontSize: '1.2rem',
              color: 'primary.main',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
                backgroundColor: 'secondary.light',
              },
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