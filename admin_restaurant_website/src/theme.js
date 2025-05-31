// src/theme.js
import { createTheme } from '@mui/material/styles';

// Creating a custom theme to match the public website
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#A93226', // Deep red accent from public site
      light: '#C0392B',
      dark: '#922B21',
      contrastText: '#fff',
    },
    secondary: {
      main: '#34495E', // Dark blue-gray
      light: '#5D6D7E',
      dark: '#2C3E50',
      contrastText: '#fff',
    },
    error: {
      main: '#E74C3C',
    },
    warning: {
      main: '#F39C12',
    },
    info: {
      main: '#3498DB',
    },
    success: {
      main: '#27AE60',
    },
    background: {
      default: '#F5F5F5',
      paper: '#fff',
    },
    text: {
      primary: '#333333',
      secondary: '#6c6c6c',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  typography: {
    fontFamily: [
      'Cormorant Garamond',
      'Georgia',
      'serif',
    ].join(','),
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none', // Avoid all-caps buttons
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#333',
        },
      },
    },
  },
});

export default theme;