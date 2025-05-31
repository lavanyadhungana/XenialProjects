// src/pages/CustomerPage.jsx

import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  TextField,
  Card,
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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

// Import API services
import { customersApi } from '../services/api';

import '../styles/Customers.css'; // You'll need to create this CSS file

/**
 * A reusable component that displays a list of customers.
 * On larger screens, displays a table; on small screens, displays "cards."
 */
function ResponsiveCustomersTable({ customers, actions }) {
  // "actions" is an optional object of callbacks: { onEdit: (customer) => ..., onDelete: (id) => ... }

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // --- RENDER FOR SMALL SCREENS (CARD LAYOUT) ---
  if (isSmallScreen) {
    return (
      <Box>
        {customers.map((customer) => (
          <div key={customer.id} className="customer-card">
            <div className="customer-card-row">
              <span className="customer-card-key">ID:</span>
              <span>{customer.id}</span>
            </div>
            <div className="customer-card-row">
              <span className="customer-card-key">Name:</span>
              <span>{`${customer.first_name} ${customer.last_name}`}</span>
            </div>
            <div className="customer-card-row">
              <span className="customer-card-key">Email:</span>
              <span>{customer.email_address}</span>
            </div>
            <div className="customer-card-row">
              <span className="customer-card-key">Phone:</span>
              <span>{customer.phone_number}</span>
            </div>
            <div className="customer-card-row">
              <span className="customer-card-key">Dietary Requirements:</span>
              <span>{customer.dietary_requirements || 'None'}</span>
            </div>
            {actions && (
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                {actions.onEdit && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => actions.onEdit(customer)}
                    startIcon={<EditIcon />}
                  >
                    Edit
                  </Button>
                )}
                {actions.onDelete && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => actions.onDelete(customer.id)}
                    startIcon={<DeleteIcon />}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            )}
          </div>
        ))}
      </Box>
    );
  }

  // --- RENDER FOR MEDIUM+ SCREENS (TABLE LAYOUT) ---
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <table width="100%" style={{ borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f7f7f7' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>First Name</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Last Name</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Email</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Phone</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Dietary Requirements</th>
            {actions && <th style={{ border: '1px solid #ccc', padding: '8px' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{customer.id}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{customer.first_name}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{customer.last_name}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{customer.email_address}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{customer.phone_number}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{customer.dietary_requirements || 'None'}</td>
              {actions && (
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  <IconButton 
                    color="primary" 
                    onClick={() => actions.onEdit(customer)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    onClick={() => actions.onDelete(customer.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

function CustomerPage() {
  const [tabValue, setTabValue] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [randomPassword, setRandomPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ----- For "Add Customer" -----
  const [newCustomerData, setNewCustomerData] = useState({
    first_name: '',
    last_name: '',
    email_address: '',
    phone_number: '',
    dietary_requirements: '',
    password: ''
  });

  // ----- For "Search & Update" -----
  const [searchParams, setSearchParams] = useState({
    first_name: '',
    last_name: '',
    email_address: '',
    phone_number: '',
    page: 1,
    limit: 10,
    sort_by: 'first_name',
    sort_order: 'asc'
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // ----- For "View & Filter" -----
  const [filteredList, setFilteredList] = useState([]);

  // Removed useEffect hook to avoid loading data on component mount

  // Only fetch customers when explicitly needed
  const fetchCustomers = async () => {
    // Check if data is already loaded - avoid redundant request
    if (dataLoaded && customers.length > 0) return;
    
    setIsLoading(true);
    try {
      // The backend requires at least one valid search parameter
      const searchRequest = {
        first_name: 'a', // Using a single character that will match most names
        page: 1,
        limit: 50
      };
      
      const response = await customersApi.searchCustomers(searchRequest);
      
      if (response && response.customers) {
        setCustomers(response.customers);
        setFilteredList(response.customers);
        setDataLoaded(true);
      } else {
        console.error('Unexpected response format:', response);
        setCustomers([]);
        setFilteredList([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert(error.message || 'Failed to fetch customers');
      setCustomers([]);
      setFilteredList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== TAB CHANGE ====================
  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
    // Reset states when changing tabs
    setSearchResults([]);
    setSelectedCustomer(null);
    
    // Only load customer data when switching to the Search tab
    if (newValue === 1 && !dataLoaded) {
      fetchCustomers();
    }
  };

  // ============================================================
  // ===============     ADD NEW CUSTOMER     =================
  // ============================================================
  const handleNewCustomerChange = (e) => {
    setNewCustomerData({ ...newCustomerData, [e.target.name]: e.target.value });
  };

  const generateRandomPassword = () => {
    // Generate a random password (8-12 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = Math.floor(Math.random() * 5) + 8; // 8-12 characters
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  };

  const handleAddCustomer = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!newCustomerData.first_name || !newCustomerData.last_name || 
          !newCustomerData.email_address || !newCustomerData.phone_number) {
        alert('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      // Generate random password if not provided
      let customerData = { ...newCustomerData };
      if (!customerData.password) {
        const password = generateRandomPassword();
        setRandomPassword(password);
        customerData.password = password;
      }

      // Create customer object matching CustomerAddRequest
      const customerAddRequest = {
        ...customerData
      };

      const response = await customersApi.addCustomer(customerAddRequest);
      
      // Check if response has customer property as per CustomerAddResponse
      if (response && response.customer) {
        alert(`Customer account created for ${response.customer.first_name} ${response.customer.last_name} with ID: ${response.customer.id}`);
      } else {
        alert('Customer added successfully');
      }
      
      // No need to refresh data here, we'll load it when needed
      setDataLoaded(false); // Mark data as outdated

      // Clear form
      setNewCustomerData({
        first_name: '',
        last_name: '',
        email_address: '',
        phone_number: '',
        dietary_requirements: '',
        password: ''
      });
    } catch (error) {
      alert(error.message || 'Failed to add customer');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // ===============  SEARCH & UPDATE / DELETE  =================
  // ============================================================
  const handleSearchParamChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const doSearch = async () => {
    setIsLoading(true);
    try {
      // Create search request matching CustomerSearchRequest
      const searchRequest = {
        first_name: searchParams.first_name || '',
        last_name: searchParams.last_name || '',
        email_address: searchParams.email_address || '',
        phone_number: searchParams.phone_number || '',
        page: searchParams.page,
        limit: searchParams.limit,
        sort_by: searchParams.sort_by,
        sort_order: searchParams.sort_order
      };
      
      // Make sure at least one search parameter is provided
      if (!searchRequest.first_name && !searchRequest.last_name && 
          !searchRequest.email_address && !searchRequest.phone_number) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }
      
      const response = await customersApi.searchCustomers(searchRequest);
      
      // Check if response has customers property as per CustomerSearchResponse
      if (response && response.customers) {
        setSearchResults(response.customers);
      } else {
        console.error('Unexpected response format:', response);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(error.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setSelectedCustomer(null);
      setIsLoading(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer({ ...customer });
  };

  const handleSelectedChange = (e) => {
    setSelectedCustomer({ ...selectedCustomer, [e.target.name]: e.target.value });
  };

  const handleSaveUpdates = async () => {
    try {
      setIsLoading(true);
      
      if (!selectedCustomer) return;
      
      // Create update request matching CustomerUpdateRequest
      const updateRequest = {
        id: selectedCustomer.id,
        email_address: selectedCustomer.email_address,
        phone_number: selectedCustomer.phone_number,
        first_name: selectedCustomer.first_name,
        last_name: selectedCustomer.last_name,
        dietary_requirements: selectedCustomer.dietary_requirements || ''
      };
      
      const response = await customersApi.updateCustomer(updateRequest);
      
      // Check if response has customer property as per CustomerUpdateResponse
      if (response && response.customer) {
        alert(`Customer ${response.customer.id} updated.`);
      } else {
        alert('Customer updated successfully');
      }
      
      // Mark data as outdated
      setDataLoaded(false);
      
      // Reset selection
      setSelectedCustomer(null);
      
      // Update search results if necessary
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

  // Delete customer
  const handleDeleteClick = (id) => {
    // Find customer from search results if available, otherwise check main list
    const customer = searchResults.length > 0 
      ? searchResults.find(c => c.id === id)
      : customers.find(c => c.id === id);
      
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      
      if (!customerToDelete) return;
      
      await customersApi.deleteCustomer(customerToDelete.id);
      alert(`Customer ${customerToDelete.first_name} ${customerToDelete.last_name} deleted.`);
      
      // Mark data as outdated
      setDataLoaded(false);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      
      // Reset selected customer if it was the deleted one
      if (selectedCustomer && selectedCustomer.id === customerToDelete.id) {
        setSelectedCustomer(null);
      }
      
      // Update search results if necessary
      if (searchResults.length > 0) {
        doSearch();
      }
    } catch (error) {
      alert(error.message || 'Delete failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // ===============    VIEW & FILTER  LIST     =================
  // ============================================================
  const applyFilter = async () => {
    // Make sure we have data first
    if (!dataLoaded) {
      await fetchCustomers();
    }
    
    setIsLoading(true);
    try {
      // Create search request for filtering
      const filterRequest = {
        first_name: searchParams.first_name || '',
        last_name: searchParams.last_name || '',
        email_address: searchParams.email_address || '',
        phone_number: searchParams.phone_number || '',
        page: 1,
        limit: 50,
        sort_by: 'id',
        sort_order: 'asc'
      };
      
      // Make sure at least one filter parameter is provided
      if (!filterRequest.first_name && !filterRequest.last_name && 
          !filterRequest.email_address && !filterRequest.phone_number) {
        setFilteredList(customers); // Show all customers if no filter
        setIsLoading(false);
        return;
      }
      
      const response = await customersApi.searchCustomers(filterRequest);
      
      // Check if response has customers property
      if (response && response.customers) {
        setFilteredList(response.customers);
      } else {
        console.error('Unexpected response format:', response);
        setFilteredList([]);
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
    setSearchParams({
      first_name: '',
      last_name: '',
      email_address: '',
      phone_number: '',
      page: 1,
      limit: 10,
      sort_by: 'id',
      sort_order: 'asc'
    });
    setFilteredList(customers); // Reset to show all customers
  };

  const smallScreen = useMediaQuery("(max-width: 768px)");

  // ============================================================
  // ===============    RENDER THE UI (Tabs)    =================
  // ============================================================
  return (
    <Box sx={{ width: '100%', alignContent: 'flex-start' }}>
      <Typography variant="h4" gutterBottom>
        Customer Management
      </Typography>

      <Tabs 
        value={tabValue} 
        onChange={handleChangeTab} 
        sx={{ mb: 2 }} 
        orientation={smallScreen ? "vertical" : "horizontal"}
      >
        <Tab label="Add Customer" />
        <Tab label="Search & Update" />
        {/*<Tab label="View All Customers"/>*/}
      </Tabs>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ---------------- TAB 1: ADD CUSTOMER ---------------- */}
      {tabValue === 0 && !isLoading && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add a New Customer
          </Typography>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    name="first_name"
                    value={newCustomerData.first_name}
                    onChange={handleNewCustomerChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    name="last_name"
                    value={newCustomerData.last_name}
                    onChange={handleNewCustomerChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email Address"
                    name="email_address"
                    type="email"
                    value={newCustomerData.email_address}
                    onChange={handleNewCustomerChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone Number"
                    name="phone_number"
                    value={newCustomerData.phone_number}
                    onChange={handleNewCustomerChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Dietary Requirements"
                    name="dietary_requirements"
                    value={newCustomerData.dietary_requirements}
                    onChange={handleNewCustomerChange}
                    multiline
                    rows={2}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Password (Optional)"
                    name="password"
                    type="password"
                    value={newCustomerData.password}
                    onChange={handleNewCustomerChange}
                    fullWidth
                    helperText="Leave blank to generate a random password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleAddCustomer}>
                    Add Customer
                  </Button>
                </Grid>
                
                {randomPassword && (
                  <Grid item xs={12}>
                    <Card sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Generated Password
                      </Typography>
                      <Typography>
                        A temporary password has been generated: <strong>{randomPassword}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Please provide this password to the customer or email it to them. 
                        They can use the "Forgot Password" option later to change it.
                      </Typography>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ---------------- TAB 2: SEARCH & UPDATE ---------------- */}
      {tabValue === 1 && !isLoading && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Search & Update / Delete
          </Typography>
          {/* SEARCH FIELDS */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
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
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Email"
                    name="email_address"
                    value={searchParams.email_address}
                    onChange={handleSearchParamChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Phone Number"
                    name="phone_number"
                    value={searchParams.phone_number}
                    onChange={handleSearchParamChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="outlined" onClick={doSearch} sx={{ mt: 2 }}>
                    Search
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* SEARCH RESULTS */}
          {searchResults.length > 0 && (
            <>
              <Typography variant="subtitle1">Search Results</Typography>
              <ResponsiveCustomersTable
                customers={searchResults}
                actions={{
                  onEdit: handleSelectCustomer,
                  onDelete: handleDeleteClick,
                }}
              />
            </>
          )}

          {/* EDIT SELECTED CUSTOMER */}
          {selectedCustomer && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Editing Customer: {selectedCustomer.id}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name"
                      name="first_name"
                      value={selectedCustomer.first_name}
                      onChange={handleSelectedChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name"
                      name="last_name"
                      value={selectedCustomer.last_name}
                      onChange={handleSelectedChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      name="email_address"
                      value={selectedCustomer.email_address}
                      onChange={handleSelectedChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone"
                      name="phone_number"
                      value={selectedCustomer.phone_number}
                      onChange={handleSelectedChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Dietary Requirements"
                      name="dietary_requirements"
                      value={selectedCustomer.dietary_requirements || ''}
                      onChange={handleSelectedChange}
                      multiline
                      rows={2}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" onClick={handleSaveUpdates}>
                      Save Updates
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Customer Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {customerToDelete && (
              <>
                Are you sure you want to delete the account for {customerToDelete.first_name} {customerToDelete.last_name}?
                <br /><br />
                This action cannot be undone, and all associated data will be permanently removed.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerPage;