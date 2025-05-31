// src/pages/AdminLoginPage.jsx - Updated with link to Signup page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  Link
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RestaurantIcon from '@mui/icons-material/Restaurant';

// Import API service
import apiService from '../services/apiService';
import authApi from '../services/authApi';

function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    email_address: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  // Check if admin is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Basic check if token exists
        if (!authApi.isAuthenticated()) {
          setCheckingAuth(false);
          return;
        }
        
        // Verify with backend that token is valid and belongs to an admin
        const isAdminAuth = await authApi.isAdminAuthenticated();
        
        if (isAdminAuth) {
          // Redirect to dashboard if already logged in as admin
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        // Clear token if there's an issue
        apiService.clearToken();
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAuthStatus();
  }, [navigate]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (error) {
      setError(null);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!credentials.email_address || !credentials.password) {
        setError('Email and password are required');
        setIsLoading(false);
        return;
      }
      
      // Create login request matching AdminLoginRequest format
      const loginRequest = {
        email_address: credentials.email_address,
        password: credentials.password
      };
      
      // Call the API to log in
      const response = await authApi.loginAdmin(loginRequest);
      
      // Check if we got a token back as per AuthResponse
      if (response && response.token) {
        // Save email in localStorage if remember me is checked
        if (rememberMe) {
          localStorage.setItem('remember_admin_email', credentials.email_address);
        } else {
          localStorage.removeItem('remember_admin_email');
        }
        
        // Verify the token is for an admin
        const isAdmin = await authApi.isAdminAuthenticated();
        
        if (!isAdmin) {
          setError('This account does not have administrator privileges');
          apiService.clearToken();
          setIsLoading(false);
          return;
        }
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        setError('Login failed - No authentication token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load remembered email if available
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remember_admin_email');
    if (rememberedEmail) {
      setCredentials(prev => ({
        ...prev,
        email_address: rememberedEmail
      }));
      setRememberMe(true);
    }
  }, []);
  
  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          width: '100vw',
          background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))'
        }}
      >
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }
  
  return (
    <Box 
      className="admin-login-container"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: 2
      }}
    >
      <Container maxWidth="xs" sx={{ py: 3 }}>
        <Paper
          elevation={4}
          className="admin-login-card"
          sx={{
            p: isMobile ? 3 : 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            width: '100%',
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 3 
          }}>
            <Box sx={{ 
              bgcolor: theme.palette.primary.main, 
              borderRadius: '50%', 
              p: 1,
              display: 'flex',
              mb: 2
            }}>
              <RestaurantIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography 
              component="h1" 
              variant="h5" 
              align="center" 
              fontWeight="bold"
              sx={{ 
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: theme.palette.primary.dark
              }}
            >
              Admin Login
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary" 
              align="center"
              sx={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Sign in to your administrator account
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email_address"
              label="Email Address"
              name="email_address"
              autoComplete="email"
              autoFocus
              value={credentials.email_address}
              onChange={handleInputChange}
              disabled={isLoading}
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiInputLabel-root.Mui-focused': {
                  color: theme.palette.primary.main
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleInputChange}
              disabled={isLoading}
              size={isMobile ? "small" : "medium"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                      size={isMobile ? "small" : "medium"}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputLabel-root.Mui-focused': {
                  color: theme.palette.primary.main
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                }
              }}
            />
            
            <FormControlLabel
              control={
                <Checkbox 
                  value="remember" 
                  color="primary" 
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  disabled={isLoading}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '&.Mui-checked': {
                      color: theme.palette.primary.main
                    }
                  }}
                />
              }
              label="Remember me"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: isMobile ? 1 : 1.5,
                fontSize: isMobile ? '0.875rem' : '1rem',
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Need an admin account?{' '}
                <Link component={RouterLink} to="/signup" variant="body2" sx={{ color: theme.palette.primary.main }}>
                  Sign up
                </Link>
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Admin access only. Contact the system administrator if you need assistance.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default AdminLoginPage;