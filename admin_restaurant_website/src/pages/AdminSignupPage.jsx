// src/pages/AdminSignupPage.jsx
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
  Grid,
  useMediaQuery,
  Link
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// Import API service
import authApi from '../services/authApi';

function AdminSignupPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email_address: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({
    first_name: '',
    last_name: '',
    email_address: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  
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
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAuthStatus();
  }, [navigate]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error when user types
    if (error) {
      setError(null);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const validateForm = () => {
    let isValid = true;
    const errors = {
      first_name: '',
      last_name: '',
      email_address: '',
      phone_number: '',
      password: '',
      confirmPassword: ''
    };
    
    // First name validation
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
      isValid = false;
    }
    
    // Last name validation
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
      isValid = false;
    }
    
    // Email validation
    if (!formData.email_address) {
      errors.email_address = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email_address)) {
      errors.email_address = 'Email address is invalid';
      isValid = false;
    }
    
    // Phone number validation
    if (!formData.phone_number) {
      errors.phone_number = 'Phone number is required';
      isValid = false;
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone_number.replace(/[\s-()]/g, ''))) {
      errors.phone_number = 'Please enter a valid phone number';
      isValid = false;
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create signup request object (remove confirmPassword as it's not needed for API)
      const { confirmPassword, ...adminData } = formData;
      
      // Call the API to register admin
      const response = await authApi.registerAdmin(adminData);
      
      // Check if we got a token back
      if (response && response.token) {
        // Verify the token is for an admin
        const isAdmin = await authApi.isAdminAuthenticated();
        
        if (!isAdmin) {
          setError('Registration successful but account does not have administrator privileges');
          authApi.logout();
          setIsLoading(false);
          return;
        }
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        setError('Registration failed - No authentication token received');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
      className="admin-signup-container"
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
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Paper
          elevation={4}
          className="admin-signup-card"
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
              <PersonAddIcon sx={{ fontSize: 40, color: 'white' }} />
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
              Create Admin Account
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary" 
              align="center"
              sx={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Register as a new administrator
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSignup} noValidate sx={{ mt: 1, width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="first_name"
                  label="First Name"
                  name="first_name"
                  autoComplete="given-name"
                  autoFocus
                  value={formData.first_name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  size={isMobile ? "small" : "medium"}
                  error={!!formErrors.first_name}
                  helperText={formErrors.first_name}
                  sx={{
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: theme.palette.primary.main
                    },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="last_name"
                  label="Last Name"
                  name="last_name"
                  autoComplete="family-name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  size={isMobile ? "small" : "medium"}
                  error={!!formErrors.last_name}
                  helperText={formErrors.last_name}
                  sx={{
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: theme.palette.primary.main
                    },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email_address"
                  label="Email Address"
                  name="email_address"
                  autoComplete="email"
                  value={formData.email_address}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  size={isMobile ? "small" : "medium"}
                  error={!!formErrors.email_address}
                  helperText={formErrors.email_address}
                  sx={{
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: theme.palette.primary.main
                    },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="phone_number"
                  label="Phone Number"
                  name="phone_number"
                  autoComplete="tel"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  size={isMobile ? "small" : "medium"}
                  error={!!formErrors.phone_number}
                  helperText={formErrors.phone_number}
                  placeholder="e.g., +1 555-123-4567"
                  sx={{
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: theme.palette.primary.main
                    },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  size={isMobile ? "small" : "medium"}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  size={isMobile ? "small" : "medium"}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={toggleConfirmPasswordVisibility}
                          edge="end"
                          size={isMobile ? "small" : "medium"}
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
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
              </Grid>
            </Grid>
            
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
              {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" variant="body2" sx={{ color: theme.palette.primary.main }}>
                  Sign in
                </Link>
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Admin registration may require approval before account activation.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default AdminSignupPage;