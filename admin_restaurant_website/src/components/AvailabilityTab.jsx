// src/components/AvailabilityTab.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { timeSlotsApi } from '../services/api';

const AvailabilityTab = ({ onAddReservation }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // State for the selected date and availability data
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  const [availability, setAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // Fetch availability when component mounts or date changes
  useEffect(() => {
    fetchAvailability(selectedDate);
    // Reset selected time when date changes
    setSelectedTimeSlot(null);
  }, [selectedDate]);

  // Function to fetch availability for a given date
  const fetchAvailability = async (date) => {
    setIsLoading(true);
    try {
      const response = await timeSlotsApi.getAvailability(date);
      
      if (response && response.time_slots && Array.isArray(response.time_slots)) {
        // Format the time slots for our component
        const formattedSlots = response.time_slots
          // Only show available slots
          .filter(slot => slot.is_available && slot.available_tables > 0)
          // Map to the format expected by the component
          .map(slot => ({
            id: slot.id,
            time: slot.time, // The formatted time (e.g., "5:00 PM")
            startTime: slot.slot_start,
            endTime: slot.slot_end,
            tablesRemaining: slot.available_tables,
            totalTables: slot.max_tables
          }));
        
        setAvailability(formattedSlots);
      } else {
        console.error('Unexpected response format:', response);
        setAvailability([]);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      alert('Failed to fetch availability: ' + error.message);
      setAvailability([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Check next day
  const handleCheckNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay.toISOString().split('T')[0]);
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slotId, event) => {
    // Stop the event from propagating to parent elements if coming from a button
    if (event) {
      event.stopPropagation();
    }
    setSelectedTimeSlot(slotId === selectedTimeSlot ? null : slotId);
  };

  // Navigate to Add Reservation with selected date and time
  const handleAddReservationWithTime = () => {
    if (selectedTimeSlot) {
      // Find the corresponding slot details for the selected slot
      const selectedSlot = availability.find(s => s.id === selectedTimeSlot);
      if (selectedSlot) {
        onAddReservation(selectedDate, selectedSlot.startTime, selectedSlot.endTime);
      } else {
        onAddReservation(selectedDate);
      }
    } else {
      onAddReservation(selectedDate);
    }
  };

  // Get formatted display time for a slot
  const getDisplayTime = (slot) => {
    return slot.time || slot.startTime;
  };

  // Get the selected slot from availability
  const getSelectedSlot = () => {
    return availability.find(s => s.id === selectedTimeSlot);
  };

  // Render time slot cards for small screens
  const renderTimeSlotCards = () => {
    if (availability.length === 0) {
      return (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="text.secondary">
              No available time slots for this date.
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return availability.map((slot) => (
      <Card 
        key={slot.id} 
        sx={{ 
          mb: 2, 
          cursor: 'pointer',
          border: selectedTimeSlot === slot.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }
        }}
        onClick={() => handleTimeSlotSelect(slot.id)}
      >
        <CardContent>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="h6">{getDisplayTime(slot)}</Typography>
              <Typography variant="body2" color="text.secondary">
                to {slot.endTime}
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              {slot.tablesRemaining > 7 ? (
                <Chip label="High Availability" color="success" size="small" />
              ) : slot.tablesRemaining > 3 ? (
                <Chip label="Medium Availability" color="info" size="small" />
              ) : (
                <Chip label="Limited Availability" color="warning" size="small" />
              )}
            </Grid>
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="body2">
                {slot.tablesRemaining} of {slot.totalTables} tables available
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    ));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Check Table Availability
      </Typography>
      
      {/* Date Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Select Date"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Time slots for {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Availability Display */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : isSmallScreen ? (
        // Card view for small screens
        <Box>
          {renderTimeSlotCards()}
        </Box>
      ) : (
        // Table view for larger screens - FIXED TO PREVENT CLICK PROPAGATION ISSUES
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time Slot</TableCell>
                <TableCell align="center">Tables Available</TableCell>
                <TableCell align="center">Total Tables</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {availability.length > 0 ? (
                availability.map((slot) => (
                  <TableRow 
                    key={slot.id}
                    selected={selectedTimeSlot === slot.id}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                      '&.Mui-selected': { backgroundColor: '#e3f2fd' },
                      '&.Mui-selected:hover': { backgroundColor: '#bbdefb' }
                    }}
                  >
                    <TableCell onClick={() => handleTimeSlotSelect(slot.id)}>
                      {getDisplayTime(slot)} - {slot.endTime}
                    </TableCell>
                    <TableCell align="center" onClick={() => handleTimeSlotSelect(slot.id)}>
                      {slot.tablesRemaining}
                    </TableCell>
                    <TableCell align="center" onClick={() => handleTimeSlotSelect(slot.id)}>
                      {slot.totalTables}
                    </TableCell>
                    <TableCell align="center" onClick={() => handleTimeSlotSelect(slot.id)}>
                      {slot.tablesRemaining > 7 ? (
                        <Chip label="High Availability" color="success" size="small" />
                      ) : slot.tablesRemaining > 3 ? (
                        <Chip label="Medium Availability" color="info" size="small" />
                      ) : (
                        <Chip label="Limited Availability" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        variant={selectedTimeSlot === slot.id ? "contained" : "outlined"} 
                        size="small"
                        onClick={(e) => handleTimeSlotSelect(slot.id, e)}
                      >
                        {selectedTimeSlot === slot.id ? "Selected" : "Select"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No available time slots for this date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Quick Actions */}
      {availability.length > 0 && (
        <Card sx={{ mt: 3, bgcolor: '#f9f9f9' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Quick Actions
            </Typography>
            {selectedTimeSlot && (
              <Typography variant="body2" sx={{ mb: 2, color: 'primary.main' }}>
                Selected time: <strong>
                  {getSelectedSlot() ? getDisplayTime(getSelectedSlot()) : ''}
                </strong> on {new Date(selectedDate).toLocaleDateString()}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              <Button 
                variant="contained" 
                onClick={handleAddReservationWithTime}
                disabled={isSmallScreen && !selectedTimeSlot}
              >
                {selectedTimeSlot 
                  ? `Add Reservation for ${getSelectedSlot() ? getDisplayTime(getSelectedSlot()) : ''}` 
                  : "Add Reservation for this Date"}
              </Button>
              <Button 
                variant="outlined"
                onClick={handleCheckNextDay}
              >
                Check Tomorrow
              </Button>
              {selectedTimeSlot && (
                <Button 
                  variant="text"
                  onClick={() => setSelectedTimeSlot(null)}
                  color="secondary"
                >
                  Clear Selection
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AvailabilityTab;