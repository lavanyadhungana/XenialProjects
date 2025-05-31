// src/pages/ReservationsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Chip,
  CardContent,
  Grid,
  useMediaQuery,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  CircularProgress,
  Paper,
  Divider,
  Tooltip
} from '@mui/material';

import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import EventIcon from '@mui/icons-material/Event';
import CommentIcon from '@mui/icons-material/Comment';

import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import AvailabilityTab from '../components/AvailabilityTab';

// Import API services
import { reservationsApi, timeSlotsApi } from '../services/api';

import '../styles/Reservations.css';

// Format time properly
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  // If already in 12-hour format with AM/PM, return as is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  
  // Try to convert 24-hour format to 12-hour format
  try {
    // Handle both HH:MM:SS and HH:MM formats
    const timeParts = timeString.split(':');
    if (timeParts.length < 2) return timeString;
    
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes)) return timeString;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (e) {
    return timeString; // Fallback to original on error
  }
};

/**
 * A reusable component that displays a list of reservations.
 * On larger screens, displays a table; on small screens, displays "cards."
 * 
 * @param {Object} props Component props
 * @param {Array} props.reservations Array of reservation objects to display
 * @param {Object} props.actions Optional action handlers (onEdit, onCancel, onAttend)
 * @param {Function} props.onRowClick Optional handler for clicking a reservation row
 * @param {Boolean} props.isLoading Optional loading state
 * @param {Boolean} props.showDetails Optional flag to show/hide additional details
 */
/**
 * A reusable component that displays a list of reservations.
 * On larger screens, displays a table; on small screens, displays "cards."
 * 
 * @param {Object} props Component props
 * @param {Array} props.reservations Array of reservation objects to display
 * @param {Object} props.actions Optional action handlers (onEdit, onCancel, onAttend)
 * @param {Function} props.onRowClick Optional handler for clicking a reservation row
 * @param {Boolean} props.isLoading Optional loading state
 * @param {Boolean} props.showDetails Optional flag to show/hide additional details
 */
function ResponsiveReservationsTable({ 
  reservations, 
  actions, 
  onRowClick,
  isLoading = false,
  showDetails = true 
}) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));


  // Helper to normalize reservation data from API response
  // Based on the format from searchReservations() in the backend
  const normalizeReservation = (res) => {
    // Format date properly
    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid date
        
        return new Intl.DateTimeFormat('en-AU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).format(date);
      } catch (e) {
        return dateString; // Fallback to original on error
      }
    };
    
  
    
    return {
      id: res.id || '',
      displayId: res.display_id || res.id || '',
      type: res.type || (res.display_id?.startsWith('C-') ? 'customer' : 'guest'),
      customerId: res.customer_id || 'N/A',
      firstName: res.first_name || '',
      lastName: res.last_name || '',
      fullName: `${res.first_name || ''} ${res.last_name || ''}`.trim(),
      email: res.email || '',
      phone: res.phone || '',
      date: formatDate(res.date || ''),
      timeSlot: `${formatTime(res.slot_start || '')} - ${formatTime(res.slot_end || '')}`.trim(),
      startTime: formatTime(res.slot_start || ''),
      endTime: formatTime(res.slot_end || ''),
      guests: res.number_of_guests || 0,
      tables: res.number_of_tables || 0,
      status: res.status || 'unknown',
      comments: res.comments_for_admin || '',
      createdAt: res.created_at || '',
      updatedAt: res.updated_at || '',
      maxTables: res.max_tables || 0,
      reservedTables: res.reserved_tables || 0,
      availableTables: res.available_tables || 0,
      rawDate: res.date || '' // Keep the original date for sorting
    };
  };

  // Helper to determine if a reservation can be edited/cancelled
  const canModify = (status) => status !== 'cancelled' && status !== 'attended' && status !== 'no_show';

  // Helper to render status badge
  const renderStatusBadge = (status) => {
    const statusColors = {
      upcoming: { color: 'primary', icon: <AccessTimeIcon fontSize="small" /> },
      attended: { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
      no_show: { color: 'warning', icon: <InfoIcon fontSize="small" /> },
      cancelled: { color: 'error', icon: <CancelIcon fontSize="small" /> },
      unknown: { color: 'default', icon: null }
    };

    const statusConfig = statusColors[status.toLowerCase()] || statusColors.unknown;

    return (
      <Chip
        icon={statusConfig.icon}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={statusConfig.color}
        size="small"
        variant="outlined"
        sx={{
          fontWeight: 'medium',
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />
    );
  };

  // --- RENDER FOR SMALL SCREENS (CARD LAYOUT) ---
  if (isSmallScreen) {
    if (reservations.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No reservations found
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        {reservations.map((res) => {
          const reservation = normalizeReservation(res);
          
          return (
            <Paper
              key={reservation.displayId}
              elevation={1}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 1,
                transition: 'all 0.2s',
                cursor: onRowClick ? 'pointer' : 'default',
                '&:hover': {
                  boxShadow: onRowClick ? 3 : 1,
                  bgcolor: onRowClick ? 'rgba(0, 0, 0, 0.01)' : 'transparent'
                }
              }}
              onClick={onRowClick ? () => onRowClick(res) : undefined}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                    {reservation.fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ID: {reservation.displayId}
                  </Typography>
                  {reservation.email && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {reservation.email}
                    </Typography>
                  )}
                  {reservation.phone && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {reservation.phone}
                    </Typography>
                  )}
                </Box>
                {renderStatusBadge(reservation.status)}
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventIcon color="action" sx={{ mr: 1.5, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.primary">
                      {reservation.date}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reservation.timeSlot}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon color="action" sx={{ mr: 1.5, fontSize: 20 }} />
                  <Typography variant="body2">
                    {reservation.guests} guest{reservation.guests !== 1 ? 's' : ''}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TableRestaurantIcon color="action" sx={{ mr: 1.5, fontSize: 20 }} />
                    <Typography variant="body2">
                      {reservation.tables} table{reservation.tables !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  
                  {/* Display availability info */}
                  {showDetails && (
                    <Tooltip 
                      title={`Tables: ${reservation.reservedTables}/${reservation.maxTables} reserved`}
                      arrow
                    >
                      <Chip
                        size="small"
                        label={`${reservation.availableTables} free`}
                        color={reservation.availableTables > 0 ? "success" : "error"}
                        variant="outlined"
                      />
                    </Tooltip>
                  )}
                </Box>

                {reservation.comments && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <CommentIcon color="action" sx={{ mr: 1.5, fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {reservation.comments}
                    </Typography>
                  </Box>
                )}
                
                {/* Show created/updated timestamps if details are enabled */}
                {showDetails && reservation.createdAt && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Created: {new Date(reservation.createdAt).toLocaleString()}
                    </Typography>
                    {reservation.updatedAt && reservation.updatedAt !== reservation.createdAt && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Updated: {new Date(reservation.updatedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              {actions && canModify(reservation.status) && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  {actions.onEdit && (
                    <Tooltip title="Edit reservation">
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.onEdit(res);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {actions.onAttend && (
                    <Tooltip title="Mark as attended">
                      <IconButton 
                        size="small" 
                        color="success" 
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.onAttend(reservation.displayId);
                        }}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {actions.onCancel && (
                    <Tooltip title="Cancel reservation">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.onCancel(reservation.displayId);
                        }}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>
    );
  }

  // --- RENDER FOR MEDIUM+ SCREENS (TABLE LAYOUT) ---
  return (
    <Box sx={{ 
      overflowX: 'auto', 
      boxShadow: 1, 
      borderRadius: 1, 
      bgcolor: 'background.paper',
      mb: 3
    }}>
      {reservations.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No reservations found
          </Typography>
        </Box>
      ) : (
        <table 
          style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            borderSpacing: 0 
          }}
        >
          <thead>
            <tr style={{ backgroundColor: theme.palette.grey[50] }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, borderBottom: `1px solid ${theme.palette.divider}` }}>ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, borderBottom: `1px solid ${theme.palette.divider}` }}>Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, borderBottom: `1px solid ${theme.palette.divider}` }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, borderBottom: `1px solid ${theme.palette.divider}` }}>Time</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, borderBottom: `1px solid ${theme.palette.divider}` }}>Guests</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, borderBottom: `1px solid ${theme.palette.divider}` }}>Tables</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, borderBottom: `1px solid ${theme.palette.divider}` }}>Status</th>
              {showDetails && (
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  Comments
                </th>
              )}
              {actions && (
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {reservations.map((res, index) => {
              const reservation = normalizeReservation(res);
              const isModifiable = canModify(reservation.status);
              
              return (
                <tr 
                  key={reservation.displayId}
                  onClick={onRowClick ? () => onRowClick(res) : undefined}
                  style={{ 
                    backgroundColor: index % 2 === 0 ? 'transparent' : theme.palette.grey[50],
                    cursor: onRowClick ? 'pointer' : 'default'
                  }}
                >
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" component="div" fontWeight="medium">
                      {reservation.displayId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reservation.type}
                    </Typography>
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" noWrap>
                      {reservation.fullName}
                    </Typography>
                    {reservation.customerId !== 'N/A' && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        ID: {reservation.customerId}
                      </Typography>
                    )}
                    {reservation.email && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {reservation.email}
                      </Typography>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2">{reservation.date}</Typography>
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2">{reservation.timeSlot}</Typography>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2">{reservation.guests}</Typography>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2">{reservation.tables}</Typography>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    {renderStatusBadge(reservation.status)}
                  </td>
                  
                  {showDetails && (
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, maxWidth: '250px' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {reservation.comments || '—'}
                      </Typography>
                    </td>
                  )}
                  
                  {actions && (
                    <td style={{ padding: '8px 16px', textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {actions.onEdit && isModifiable && (
                          <Tooltip title="Edit reservation">
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={(e) => {
                                e.stopPropagation();
                                actions.onEdit(res);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {actions.onAttend && isModifiable && (
                          <Tooltip title="Mark as attended">
                            <IconButton 
                              size="small" 
                              color="success" 
                              onClick={(e) => {
                                e.stopPropagation();
                                actions.onAttend(reservation.displayId);
                              }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {actions.onCancel && isModifiable && (
                          <Tooltip title="Cancel reservation">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={(e) => {
                                e.stopPropagation();
                                actions.onCancel(reservation.displayId);
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {!isModifiable && (
                          <Typography variant="caption" color="text.secondary">
                            No actions available
                          </Typography>
                        )}
                      </Box>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Box>
  );
}

function ReservationsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [reservations, setReservations] = useState([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ----- For "Add Reservation" -----
  const [newResData, setNewResData] = useState({
    type: 'guest', // 'guest' or 'customer'
    customer_id: '',
    guest_first_name: '',
    guest_last_name: '',
    guest_email: '',
    guest_phone: '',
    reservation_date: '',
    slot_start: '',
    slot_end: '',
    number_of_guests: 1,
    number_of_tables: 1,
    comments_for_admin: '',
  });

  // ----- For "Search & Update" -----
  const [searchMode, setSearchMode] = useState('id'); // 'id', 'guest', 'customer'
  const [searchParams, setSearchParams] = useState({
    display_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date: '',
    status: '',
    page: 1,
    limit: 10,
    sortField: 'date',
    sortOrder: 'desc'
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // For controlling whether we are "moving date/time" of the selected reservation
  const [moveDate, setMoveDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]); // result of getAvailability
  const [selectedSlot, setSelectedSlot] = useState('');

  // ----- For "View & Filter" -----
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filteredList, setFilteredList] = useState([]);

  // On component mount, load all reservations
  useEffect(() => {
    fetchReservations();
  }, []);

  async function fetchReservations() {
    setIsLoading(true);
    try {
      // Create a filter request with no filters to get all reservations
      const filterParams = {
        status: '',
        start_date: '',
        end_date: '',
        type: 'customer',
        page: 1,
        limit: 50, // Get more results
        sortField: 'date',
        sortOrder: 'desc'
      };
      
      const response = await reservationsApi.filterReservations(filterParams);
      
      // Check if response has reservations property as per ReservationSearchResponse
      if (response && response.reservations) {
        setReservations(response.reservations);
        
        // Update filtered list if filters are applied
        if (filterStatus || filterDate || filterStartDate || filterEndDate || filterType) {
          applyFilter(response.reservations);
        } else {
          setFilteredList(response.reservations);
        }
      } else {
        console.error('Unexpected response format:', response);
        setReservations([]);
        setFilteredList([]);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      alert(error.message || 'Failed to fetch reservations');
      setReservations([]);
      setFilteredList([]);
    } finally {
      setIsLoading(false);
    }
  }

  // ==================== TAB CHANGE ====================
  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
    // Reset states when changing tabs
    setSearchResults([]);
    setSelectedReservation(null);
    setMoveDate('');
    setAvailableSlots([]);
    setSelectedSlot('');
  };

  // ============================================================
  // ===============        ADD NEW LOGIC       =================
  // ============================================================
  const handleNewResChange = (e) => {
    setNewResData({ ...newResData, [e.target.name]: e.target.value });
  };

  const handleAddReservation = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (newResData.type === 'guest') {
        if (!newResData.guest_first_name || !newResData.guest_last_name || 
            !newResData.guest_email || !newResData.guest_phone) {
          alert('Please enter guest first name, last name, email and phone number');
          setIsLoading(false);
          return;
        }
      } else if (newResData.type === 'customer') {
        if (!newResData.customer_id) {
          alert('Please enter customer ID');
          setIsLoading(false);
          return;
        }
      }
      
      if (!newResData.reservation_date || !newResData.slot_start) {
        alert('Please select date and time');
        setIsLoading(false);
        return;
      }

      // Create appropriate request based on reservation type
      if (newResData.type === 'guest') {
        // Create object matching GuestReservationCreateRequest
        const guestRequest = {
          guest_first_name: newResData.guest_first_name,
          guest_last_name: newResData.guest_last_name,
          guest_email: newResData.guest_email,
          guest_phone: newResData.guest_phone,
          number_of_guests: parseInt(newResData.number_of_guests, 10),
          number_of_tables: Math.ceil(parseInt(newResData.number_of_guests, 10) / 2),
          comments_for_admin: newResData.comments_for_admin || '',
          reservation_date: newResData.reservation_date,
          slot_start: newResData.slot_start,
          slot_end: newResData.slot_end
        };
        
        const response = await reservationsApi.createGuestReservation(guestRequest);
        
        // Check if response has reservation property as per GuestReservationCreateResponse
        if (response && response.reservation) {
          alert(`Guest reservation created with ID: ${response.reservation.display_id || response.reservation.id}`);
        } else {
          alert('Guest reservation created successfully');
        }
      } else {
        // Create object matching CustomerReservationCreateRequest
        const customerRequest = {
          customer_id: newResData.customer_id,
          number_of_guests: parseInt(newResData.number_of_guests, 10),
          number_of_tables: Math.ceil(parseInt(newResData.number_of_guests, 10) / 2),
          comments_for_admin: newResData.comments_for_admin || '',
          reservation_date: newResData.reservation_date,
          slot_start: newResData.slot_start,
          slot_end: newResData.slot_end
        };
        
        const response = await reservationsApi.createCustomerReservation(customerRequest);
        
        // Check if response has reservation property as per CustomerReservationCreateResponse
        if (response && response.reservation) {
          alert(`Customer reservation created with ID: ${response.reservation.display_id || response.reservation.id}`);
        } else {
          alert('Customer reservation created successfully');
        }
      }
      
      // Refresh the list
      fetchReservations();

      // Clear form
      setNewResData({
        type: 'guest',
        customer_id: '',
        guest_first_name: '',
        guest_last_name: '',
        guest_email: '',
        guest_phone: '',
        reservation_date: '',
        slot_start: '',
        slot_end: '',
        number_of_guests: 1,
        number_of_tables: 1,
        comments_for_admin: '',
      });
    } catch (error) {
      alert(error.message || 'Failed to create reservation');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // ===============  SEARCH & UPDATE / CANCEL  =================
  // ============================================================
  const handleSearchModeChange = (e) => {
    setSearchMode(e.target.value);
    // Clear search results, selected reservation
    setSearchResults([]);
    setSelectedReservation(null);
  };

  const handleSearchParamChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const doSearch = async () => {
    setIsLoading(true);
    try {
      let response;
      
      if (searchMode === 'id') {
        // Create object matching ReservationSearchByIdRequest
        const searchRequest = {
          display_id: searchParams.display_id,
          page: searchParams.page,
          limit: searchParams.limit
        };
        
        if (!searchRequest.display_id) {
          setSearchResults([]);
          setIsLoading(false);
          return;
        }
        
        response = await reservationsApi.searchReservationsById(searchRequest);
      } else if (searchMode === 'guest') {
        // Create object matching ReservationSearchGuestRequest
        const searchRequest = {
          first_name: searchParams.first_name || '',
          last_name: searchParams.last_name || '',
          email: searchParams.email || '',
          phone: searchParams.phone || '',
          date: searchParams.date || '',
          status: searchParams.status || '',
          page: searchParams.page,
          limit: searchParams.limit,
          sortField: searchParams.sortField,
          sortOrder: searchParams.sortOrder
        };
        
        // Make sure at least one search parameter is provided
        if (!searchRequest.first_name && !searchRequest.last_name && 
            !searchRequest.email && !searchRequest.phone && 
            !searchRequest.date && !searchRequest.status) {
          setSearchResults([]);
          setIsLoading(false);
          return;
        }
        
        response = await reservationsApi.searchGuestReservations(searchRequest);
      } else if (searchMode === 'customer') {
        // Create object matching ReservationSearchCustomerRequest
        const searchRequest = {
          first_name: searchParams.first_name || '',
          last_name: searchParams.last_name || '',
          email: searchParams.email || '',
          phone: searchParams.phone || '',
          date: searchParams.date || '',
          status: searchParams.status || '',
          page: searchParams.page,
          limit: searchParams.limit,
          sortField: searchParams.sortField,
          sortOrder: searchParams.sortOrder
        };
        
        // Make sure at least one search parameter is provided
        if (!searchRequest.first_name && !searchRequest.last_name && 
            !searchRequest.email && !searchRequest.phone && 
            !searchRequest.date && !searchRequest.status) {
          setSearchResults([]);
          setIsLoading(false);
          return;
        }
        
        response = await reservationsApi.searchCustomerReservations(searchRequest);
      }
      
      // Check if response has reservations property as per ReservationSearchResponse
      if (response && response.reservations) {
        setSearchResults(response.reservations);
      } else {
        console.error('Unexpected response format:', response);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(error.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setSelectedReservation(null);
      setIsLoading(false);
    }
  };

  const handleSelectReservation = (res) => {
    setSelectedReservation({ ...res });
    // Reset move-date/time UI
    setMoveDate('');
    setAvailableSlots([]);
    setSelectedSlot('');
  };

  const handleSelectedChange = (e) => {
    setSelectedReservation({ ...selectedReservation, [e.target.name]: e.target.value });
  };

  const handleSaveUpdates = async () => {
    setIsLoading(true);
    try {
      if (!selectedReservation) return;
      
      // Format the number_of_guests field properly as a number if it's a string
      const guestsCount = typeof selectedReservation.number_of_guests === 'string' 
        ? parseInt(selectedReservation.number_of_guests, 10) 
        : selectedReservation.number_of_guests || 
          (typeof selectedReservation.guests === 'string' 
            ? parseInt(selectedReservation.guests, 10) 
            : selectedReservation.guests);
      
      // Create object matching ReservationUpdateRequest
      const updateRequest = {
        display_id: selectedReservation.display_id || selectedReservation.id,
        number_of_guests: guestsCount,
        number_of_tables: selectedReservation.number_of_tables || selectedReservation.tables || Math.ceil(guestsCount / 2),
        comments_for_admin: selectedReservation.comments_for_admin || selectedReservation.comments || ''
      };
      
      // Include guest fields if it's a guest reservation
      if (selectedReservation.type === 'guest' || (selectedReservation.display_id && selectedReservation.display_id.startsWith('G-'))) {
        updateRequest.guest_first_name = selectedReservation.guest_first_name || selectedReservation.first_name;
        updateRequest.guest_last_name = selectedReservation.guest_last_name || selectedReservation.last_name;
        updateRequest.guest_email = selectedReservation.guest_email || selectedReservation.email;
        updateRequest.guest_phone = selectedReservation.guest_phone || selectedReservation.phone;
      }
      
      const response = await reservationsApi.updateReservation(updateRequest);
      
      // Check if response has reservation property as per ReservationUpdateResponse
      if (response && response.reservation) {
        alert(`Reservation ${response.reservation.display_id || response.reservation.id} updated.`);
      } else {
        alert('Reservation updated successfully');
      }
      
      // Refresh the list
      fetchReservations();
      
      // Reset the selected reservation
      setSelectedReservation(null);
      
      // Update search results if applicable
      if (searchResults.length > 0) {
        doSearch();
      }
    } catch (error) {
      alert(error.message || 'Update failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const smallScreen = useMediaQuery("(max-width: 768px)");

  // Cancel reservation
  const handleCancelClick = (displayId) => {
    const reservation = [...reservations, ...searchResults, ...filteredList].find(r => 
      (r.display_id && r.display_id === displayId) || (r.id === displayId)
    );
    setReservationToCancel(reservation);
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setReservationToCancel(null);
  };

  const handleConfirmCancel = async () => {
    setIsLoading(true);
    try {
      if (!reservationToCancel) return;
      
      // Create object matching ReservationCancelRequest
      const cancelRequest = {
        display_id: reservationToCancel.display_id || reservationToCancel.id
      };
      
      const response = await reservationsApi.cancelReservation(cancelRequest);
      
      // Check if response has reservation property as per ReservationCancelResponse
      if (response && response.reservation) {
        alert(`Reservation ${response.reservation.display_id || response.reservation.id} canceled.`);
      } else {
        alert('Reservation canceled successfully');
      }
      
      // Refresh data
      fetchReservations();
      
      // Update search results if applicable
      if (searchResults.length > 0) {
        doSearch();
      }
      
      // Close dialog
      setCancelDialogOpen(false);
      setReservationToCancel(null);
      
      // Reset selected reservation if it was the canceled one
      if (selectedReservation && 
          (selectedReservation.display_id === reservationToCancel.display_id || 
           selectedReservation.id === reservationToCancel.id)) {
        setSelectedReservation(null);
      }
    } catch (error) {
      alert(error.message || 'Cancellation failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark attended
  const handleMarkAttended = async (displayId) => {
    setIsLoading(true);
    try {
      // Create object matching ReservationStatusUpdateRequest
      const statusRequest = {
        display_id: displayId,
        status: 'attended'
      };
      
      const response = await reservationsApi.updateReservationStatus(statusRequest);
      
      // Check if response has reservation property as per ReservationStatusUpdateResponse
      if (response && response.reservation) {
        alert(`Reservation ${response.reservation.display_id || response.reservation.id} marked as attended.`);
      } else {
        alert('Reservation marked as attended successfully');
      }
      
      // Refresh data
      fetchReservations();
      
      // Update search results if applicable
      if (searchResults.length > 0) {
        doSearch();
      }
      
      // Reset selected reservation if it was the one marked attended
      if (selectedReservation && 
          (selectedReservation.display_id === displayId || selectedReservation.id === displayId)) {
        setSelectedReservation(null);
      }
    } catch (error) {
      alert(error.message || 'Update failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // =============== Move Date/Time Workflow ===============
  const handleMoveDateChange = (e) => {
    setMoveDate(e.target.value);
    // Clear previously selected slot when date changes
    setSelectedSlot('');
    setAvailableSlots([]);
  };

  const handleCheckAvailability = async () => {
    setIsLoading(true);
    try {
      if (!moveDate) {
        alert('Please select a date first.');
        setIsLoading(false);
        return;
      }
      
      const ret = await timeSlotsApi.getAvailability(moveDate);
      const slots = ret['time_slots']
      console.log(slots)
      
      if (!slots || slots.length === 0) {
        alert('No available time slots for this date.');
        setAvailableSlots([]);
      } else {
        setAvailableSlots(slots);
      }
      
      setSelectedSlot('');
    } catch (error) {
      alert(error.message || 'Failed to check availability');
      console.error(error);
      setAvailableSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSlot = (e) => {
    setSelectedSlot(e.target.value);
  };

  const handleConfirmMove = async () => {
    setIsLoading(true);
    try {
      if (!selectedReservation) return;
      
      if (!moveDate || !selectedSlot) {
        alert('Please choose a new date and time slot.');
        setIsLoading(false);
        return;
      }
      
      // Find the selected slot details
      const slotDetails = availableSlots.find(slot => slot.slot_start === selectedSlot);
      
      if (!slotDetails) {
        alert('Invalid time slot selected.');
        setIsLoading(false);
        return;
      }
      
      // Create object matching ReservationTimeSlotUpdateRequest
      const updateRequest = {
        display_id: selectedReservation.display_id || selectedReservation.id,
        reservation_date: moveDate,
        slot_start: slotDetails.slot_start,
        slot_end: slotDetails.slot_end,
        number_of_tables: selectedReservation.number_of_tables || selectedReservation.tables || 
          Math.ceil((selectedReservation.number_of_guests || selectedReservation.guests) / 2)
      };
      
      const response = await reservationsApi.updateReservationTimeSlot(updateRequest);
      
      // Check if response has reservation property as per ReservationTimeSlotUpdateResponse
      if (response && response.reservation) {
        alert(`Date/Time updated to ${moveDate}, ${slotDetails.slot_start} - ${slotDetails.slot_end}.`);
      } else {
        alert('Reservation date and time updated successfully');
      }
      
      // Refresh the list
      fetchReservations();
      
      // Reset selected reservation
      setSelectedReservation(null);
      setMoveDate('');
      setAvailableSlots([]);
      setSelectedSlot('');
      
      // Update search results if applicable
      if (searchResults.length > 0) {
        doSearch();
      }
    } catch (error) {
      alert(error.message || 'Update failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // ===============    VIEW & FILTER  LIST     =================
  // ============================================================
  const handleFilterStatus = (e) => setFilterStatus(e.target.value);
  const handleFilterDate = (e) => setFilterDate(e.target.value);
  const handleFilterStartDate = (e) => setFilterStartDate(e.target.value);
  const handleFilterEndDate = (e) => setFilterEndDate(e.target.value);
  const handleFilterType = (e) => setFilterType(e.target.value);

  const applyFilter = async () => {
    setIsLoading(true);
    try {
      // Create object matching ReservationFilterRequest
      const filterRequest = {
        status: filterStatus || '',
        start_date: filterStartDate || filterDate || '',
        end_date: filterEndDate || (filterDate ? filterDate : ''),
        type: filterType || '',
        page: 1,
        limit: 50,
        sortField: 'date',
        sortOrder: 'desc'
      };
      
      // Make sure at least one filter parameter is provided
      if (!filterRequest.status && !filterRequest.start_date && 
          !filterRequest.end_date && !filterRequest.type) {
        setFilteredList(reservations); // Show all reservations if no filter
        setIsLoading(false);
        return;
      }

      if (filterType === "all") {
        const customerFilterRequest = {
          status: filterStatus || '',
          start_date: filterStartDate || filterDate || '',
          end_date: filterEndDate || (filterDate ? filterDate : ''),
          type: 'customer',
          page: 1,
          limit: 50,
          sortField: 'date',
          sortOrder: 'desc'
        };
        const first_response = await reservationsApi.filterReservations(customerFilterRequest);

        const guestFilterRequest = {
          status: filterStatus || '',
          start_date: filterStartDate || filterDate || '',
          end_date: filterEndDate || (filterDate ? filterDate : ''),
          type: 'guest',
          page: 1,
          limit: 50,
          sortField: 'date',
          sortOrder: 'desc'
        }; 

        const second_response = await reservationsApi.filterReservations(guestFilterRequest);
        const all_reservations = first_response.reservations.concat(second_response.reservations)
        setFilteredList(all_reservations);
        console.log("ALL RESERVATIONS")

      } else {
        const response = await reservationsApi.filterReservations(filterRequest)
        // Check if response has reservations property
        if (response && response.reservations) {
          console.log(response.reservations)
          setFilteredList(response.reservations);
        } else {
          console.error('Unexpected response format:', response);
          setFilteredList([]);
        }
      }
    } catch (error) {
      console.error('Filter error:', error);
      alert(error.message || 'Filter failed');
      setFilteredList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilter = () => {
    setFilterStatus('');
    setFilterDate('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterType('');
    setFilteredList(reservations); // Reset to show all reservations
  };

  // Handle "Add Reservation" action from Availability tab
  const handleAddReservationFromAvailability = (date, startTime = '', endTime = '') => {
    setTabValue(1); // Switch to Add Reservation tab
    
    // Update the form with selected date and time
    setNewResData(prev => ({
      ...prev,
      reservation_date: date,
      slot_start: formatTime(startTime),
      slot_end: endTime
    }));
  };

  const renderSelectedReservation = (reservation) => {
    if (!reservation) return null;
  
    // Determine type and relevant fields
    const isGuest = reservation.type === 'guest' || 
                   (reservation.display_id && reservation.display_id.startsWith('G-'));
    
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Editing Reservation: {reservation.display_id || reservation.id}
          </Typography>
          <Grid container spacing={2}>
            {isGuest && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    name="guest_first_name"
                    value={reservation.guest_first_name || reservation.first_name || ''}
                    onChange={handleSelectedChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    name="guest_last_name"
                    value={reservation.guest_last_name || reservation.last_name || ''}
                    onChange={handleSelectedChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    name="guest_email"
                    value={reservation.guest_email || reservation.email || ''}
                    onChange={handleSelectedChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone"
                    name="guest_phone"
                    value={reservation.guest_phone || reservation.phone || ''}
                    onChange={handleSelectedChange}
                    fullWidth
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Number of Guests"
                type="number"
                name="number_of_guests"
                value={reservation.number_of_guests || reservation.guests || 1}
                onChange={handleSelectedChange}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Comments"
                name="comments_for_admin"
                value={reservation.comments_for_admin || reservation.comments || ''}
                onChange={handleSelectedChange}
                multiline
                rows={2}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                onClick={handleSaveUpdates}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Save Updates'}
              </Button>
            </Grid>
          </Grid>
  
          {/* Move Date/Time Workflow */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="subtitle2">Change Reservation Date/Time</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="New Date"
                  type="date"
                  value={moveDate}
                  onChange={handleMoveDateChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button 
                  variant="outlined" 
                  onClick={handleCheckAvailability} 
                  sx={{ mt: 1 }}
                  fullWidth
                  disabled={isLoading || !moveDate}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Check Availability'}
                </Button>
              </Grid>
            </Grid>
            {availableSlots.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">Select an available time slot:</Typography>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Time Slot</InputLabel>
                  <Select
                    value={selectedSlot}
                    label="Time Slot"
                    onChange={handleSelectSlot}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300, // Makes dropdown scrollable
                          width: 'auto',
                        },
                      },
                    }}
                  >
                    {availableSlots.map((slotObj) => (
                      <MenuItem 
                        key={slotObj.slot_start} 
                        value={slotObj.slot_start}
                        sx={{ 
                          '&.Mui-selected': { 
                            backgroundColor: '#e3f2fd' 
                          },
                          '&:hover': { 
                            backgroundColor: '#f5f5f5' 
                          }
                        }}
                      >
                        {slotObj.slot_start} - {slotObj.slot_end} (Tables left: {slotObj.available_tables})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConfirmMove}
                  sx={{ mt: 2 }}
                  disabled={isLoading || !selectedSlot}
                  fullWidth
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Confirm Date/Time Change'}
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // ===============    RENDER THE UI (Tabs)    =================
  // ============================================================
  return (
    <Box sx={{ width: '100%', alignContent: 'flex-start' }}>
      <Typography variant="h4" gutterBottom>
        Reservation Management
      </Typography>

      <Tabs 
        value={tabValue} 
        onChange={handleChangeTab} 
        sx={{ mb: 2 }} 
        orientation={smallScreen ? "vertical" : "horizontal"}
      >
        <Tab label="Availability" />
        <Tab label="Add Reservation" />
        <Tab label="Search & Update" />
        <Tab label="View & Filter" />
      </Tabs>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

       {/* AVAILABILITY TAB */}
       {tabValue === 0 && (
        <AvailabilityTab onAddReservation={handleAddReservationFromAvailability} />
      )}

      {/* ---------------- TAB 1: ADD RESERVATION ---------------- */}
      {tabValue === 1 && !isLoading && (
        <Box sx={{ p: 2 }} id="add-reservation-form">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add a New Reservation
            {newResData.reservation_date && newResData.slot_start && (
              <Chip 
                label={`For: ${newResData.reservation_date} at ${newResData.slot_start}`} 
                color="primary" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                {/* Reservation Type */}
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      name="type"
                      value={newResData.type}
                      label="Type"
                      onChange={handleNewResChange}
                    >
                      <MenuItem value="guest">Guest</MenuItem>
                      <MenuItem value="customer">Customer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* If guest => show name, if customer => show customerId */}
                {newResData.type === 'guest' ? (
                  <>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="Guest First Name"
                        name="guest_first_name"
                        value={newResData.guest_first_name}
                        onChange={handleNewResChange}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="Guest Last Name"
                        name="guest_last_name"
                        value={newResData.guest_last_name}
                        onChange={handleNewResChange}
                        fullWidth
                        required
                      />
                    </Grid>
                  </>                  
                ) : (
                  <Grid item xs={12} sm={6} md={8}>
                    <TextField
                      label="Customer ID"
                      name="customer_id"
                      value={newResData.id}
                      onChange={handleNewResChange}
                      fullWidth
                      required
                    />
                  </Grid>
                )}

                {newResData.type === 'guest' ? (
                  <>
                    <Grid item xs={12} sm={6} md={6}>
                      <TextField
                        label="Email"
                        name="guest_email"
                        type="email"
                        value={newResData.guest_email}
                        onChange={handleNewResChange}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6}>
                      <TextField
                        label="Phone"
                        name="guest_phone"
                        value={newResData.guest_phone}
                        onChange={handleNewResChange}
                        fullWidth
                        required
                      />
                    </Grid>
                  </>                  
                ) : null}
                
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Date"
                    type="date"
                    name="reservation_date"
                    value={newResData.reservation_date}
                    onChange={handleNewResChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Start Time"
                    name="slot_start"
                    placeholder="e.g. 12:00 PM"
                    value={newResData.slot_start}
                    onChange={handleNewResChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    label="Number of Guests"
                    type="number"
                    name="number_of_guests"
                    value={newResData.number_of_guests}
                    onChange={handleNewResChange}
                    fullWidth
                    required
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Comments"
                    name="comments_for_admin"
                    value={newResData.comments_for_admin}
                    onChange={handleNewResChange}
                    multiline
                    rows={2}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    onClick={handleAddReservation}
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Add Reservation'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ---------------- TAB 2: SEARCH & UPDATE ---------------- */}
      {tabValue === 2 && !isLoading && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Search & Update / Cancel
          </Typography>
          {/* SEARCH FIELDS */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Search Mode</InputLabel>
                <Select value={searchMode} label="Search Mode" onChange={handleSearchModeChange}>
                  <MenuItem value="id">Booking ID</MenuItem>
                  <MenuItem value="guest">Guest</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                </Select>
              </FormControl>

              {/* If bookingId */}
              {searchMode === 'id' && (
                <TextField
                  label="Booking ID"
                  name="display_id"
                  value={searchParams.display_id}
                  onChange={handleSearchParamChange}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              )}

              {/* If guest or customer */}
              {(searchMode === 'guest' || searchMode === 'customer') && (
                <Grid container spacing={2}>
                  {searchMode === 'guest' && (
                    <>
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          label="First Name"
                          name="first_name"
                          value={searchParams.first_name}
                          onChange={handleSearchParamChange}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          label="Last Name"
                          name="last_name"
                          value={searchParams.last_name}
                          onChange={handleSearchParamChange}
                          fullWidth
                        />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Email"
                      name="email"
                      value={searchParams.email}
                      onChange={handleSearchParamChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Phone"
                      name="phone"
                      value={searchParams.phone}
                      onChange={handleSearchParamChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Date"
                      type="date"
                      name="date"
                      value={searchParams.date}
                      onChange={handleSearchParamChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={searchParams.status}
                        label="Status"
                        name="status"
                        onChange={handleSearchParamChange}
                      >
                        <MenuItem value="">Any</MenuItem>
                        <MenuItem value="upcoming">Upcoming</MenuItem>
                        <MenuItem value="attended">Attended</MenuItem>
                        <MenuItem value="no_show">No Show</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              <Button 
                variant="outlined" 
                onClick={doSearch} 
                sx={{ mt: 2 }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </CardContent>
          </Card>

          {/* SEARCH RESULTS */}
          {searchResults.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Search Results</Typography>
              <ResponsiveReservationsTable
                reservations={searchResults}
                actions={{
                  onEdit: handleSelectReservation,
                  onCancel: handleCancelClick,
                  onAttend: handleMarkAttended,
                }}
              />
            </>
          )}

          {/* EDIT SELECTED RESERVATION */}
          {renderSelectedReservation(selectedReservation)}
        </Box>
      )}

      {/* ---------------- TAB 3: VIEW & FILTER ---------------- */}
      {tabValue === 3 && !isLoading && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            View All Reservations
          </Typography>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      name="status"
                      onChange={handleFilterStatus}
                      sx={{ minWidth: '180px' }}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="upcoming">Upcoming</MenuItem>
                      <MenuItem value="attended">Attended</MenuItem>
                      <MenuItem value="no_show">No Show</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Single Date"
                    type="date"
                    value={filterDate}
                    onChange={handleFilterDate}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={filterStartDate}
                    onChange={handleFilterStartDate}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    disabled={!!filterDate}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={filterEndDate}
                    onChange={handleFilterEndDate}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    disabled={!!filterDate}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filterType}
                      label="Type"
                      name="type"
                      onChange={handleFilterType}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="customer">Customer</MenuItem>
                      <MenuItem value="guest">Guest</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={applyFilter}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Apply Filter'}
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={clearFilter}
                      disabled={isLoading}
                    >
                      Clear Filter
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box sx={{ mt: 2 }}>
            {filteredList.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography align="center" color="textSecondary">
                    No reservations found matching your filters.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Showing {filteredList.length} reservation{filteredList.length !== 1 ? 's' : ''}
                </Typography>
                <ResponsiveReservationsTable
                  reservations={filteredList}
                  actions={{
                    onEdit: handleSelectReservation,
                    onCancel: handleCancelClick,
                    onAttend: handleMarkAttended,
                  }}
                />
              </>
            )}
          </Box>
          {/* EDIT SELECTED RESERVATION */}
          {renderSelectedReservation(selectedReservation)}
        </Box>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancelDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Reservation Cancellation"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {reservationToCancel && (
              <>
                Are you sure you want to cancel the reservation {reservationToCancel.display_id || reservationToCancel.id}?
                <br /><br />
                <strong>Details:</strong><br />
                Date: {reservationToCancel.date || reservationToCancel.reservation_date}<br />
                Time: {reservationToCancel.time || 
                      (reservationToCancel.slot_start && reservationToCancel.slot_end ? 
                       `${reservationToCancel.slot_start} - ${reservationToCancel.slot_end}` : '')}<br />
                {reservationToCancel.type === 'guest' || 
                (reservationToCancel.display_id && reservationToCancel.display_id.startsWith('G-'))
                  ? `Guest: ${reservationToCancel.guest_first_name || reservationToCancel.first_name || ''} ${reservationToCancel.guest_last_name || reservationToCancel.last_name || ''}` 
                  : `Customer ID: ${reservationToCancel.customer_id || ''}`}
                <br /><br />
                This action cannot be undone.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>No, Keep It</Button>
          <Button 
            onClick={handleConfirmCancel} 
            color="error" 
            autoFocus
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Yes, Cancel Reservation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ReservationsPage;