// src/App.jsx - Updated with Theme Provider and AdminSignupPage
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import ResponsiveDrawer from './components/ResponsiveDrawer';
import ReservationsPage from './pages/ReservationsPage';
import CustomersPage from './pages/CustomersPage';
import DashboardPage from './pages/DashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSignupPage from './pages/AdminSignupPage'; // Import the new signup page
import ProtectedRoute from './components/ProtectedRoute';
import { Box, Toolbar, CssBaseline } from '@mui/material';
import theme from './theme'; // Import the custom theme

// Create a layout component for the protected routes
const ProtectedLayout = () => (
  <ProtectedRoute>
    <Box sx={{ display: 'flex-start' }}>
      <ResponsiveDrawer />
      {/* The main content area (beside or below the drawer) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' }
        }}
      >
        {/* Add top padding to offset the fixed AppBar */}
        <Toolbar />
        <Outlet /> {/* This is where child routes will render */}
      </Box>
    </Box>
  </ProtectedRoute>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        {/* Reset CSS for the entire app */}
        <CssBaseline />
        
        <Routes>
          {/* Public auth routes - completely separate with no inherited styles */}
          <Route path="/login" element={
            <Box sx={{ 
              height: '100vh',
              width: '100vw',
              margin: 0,
              padding: 0,
              position: 'absolute',
              top: 0,
              left: 0
            }}>
              <AdminLoginPage />
            </Box>
          } />
          
          <Route path="/signup" element={
            <Box sx={{ 
              height: '100vh',
              width: '100vw',
              margin: 0,
              padding: 0,
              position: 'absolute',
              top: 0,
              left: 0
            }}>
              <AdminSignupPage />
            </Box>
          } />
          
          {/* Protected admin routes with drawer layout */}
          <Route path="/*" element={<ProtectedLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="customers" element={<CustomersPage />} />
          </Route>
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;