// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SaveIcon from '@mui/icons-material/Save';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import EventIcon from '@mui/icons-material/Event';
import MenuBookIcon from '@mui/icons-material/MenuBook';

// Import API services
import { restaurantApi, announcementsApi, menuApi } from '../services/api';

// Import CSS
import '../styles/Dashboard.css';

/**
 * A component for managing restaurant operating hours
 */
function OperatingHoursSection({ hours, onUpdate }) {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const [localHours, setLocalHours] = useState(hours);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setLocalHours(hours);
  }, [hours]);
  
  const handleHoursChange = (day, field, value) => {
    setLocalHours({
      ...localHours,
      [day]: {
        ...localHours[day],
        [field]: value
      }
    });
  };
  
  const handleSaveHours = async () => {
    setIsLoading(true);
    try {
      // Convert hours object to array format required by RestaurantHoursUpdateRequest
      // Note: API expects day_of_the_week to be 0-6 where 0 is Sunday, but our UI uses monday-sunday
      // So we need to convert: Monday (0) -> 1, Tuesday (1) -> 2, ..., Sunday (6) -> 0
      const hoursArray = daysOfWeek.map((day, index) => {
        // Remap days to match API expectation (0 = Sunday, 1 = Monday, etc.)
        const apiDayIndex = (index + 1) % 7; // Convert 0-6 (mon-sun) to 1-0 (mon-sun)
        
        return {
          day_of_the_week: apiDayIndex,
          time_open: localHours[day].open,
          time_closed: localHours[day].close,
          is_closed: localHours[day].closed
        };
      });
      
      await restaurantApi.updateRestaurantHours(hoursArray);
      onUpdate(localHours);
      alert('Operating hours updated successfully');
    } catch (error) {
      console.error('Error updating hours:', error);
      alert(error.message || 'Failed to update hours');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="dashboard-card">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Restaurant Operating Hours
        </Typography>
        
        {daysOfWeek.map((day, index) => (
          <div key={day} className="hours-day">
            <div className="hours-day-name">{dayLabels[index]}</div>
            <div className="hours-inputs">
              <TextField
                label="Open"
                type="time"
                value={localHours[day].open}
                onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                disabled={localHours[day].closed}
                size="small"
                sx={{ width: 120, mr: 2 }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
              <TextField
                label="Close"
                type="time"
                value={localHours[day].close}
                onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                disabled={localHours[day].closed}
                size="small"
                sx={{ width: 120 }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
              <FormControlLabel
                className="hours-closed"
                control={
                  <Switch
                    checked={localHours[day].closed}
                    onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                  />
                }
                label="Closed"
              />
            </div>
          </div>
        ))}
        
        <Button 
          variant="contained" 
          startIcon={isLoading ? null : <SaveIcon />}
          onClick={handleSaveHours}
          sx={{ mt: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Save Hours'}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * A component for managing restaurant table capacity
 */
/**
 * A component for managing restaurant table capacity - simplified for small tables only
 */
function TableCapacitySection({ capacity, totalTables, onUpdate }) {
  const [localTotalTables, setLocalTotalTables] = useState(totalTables);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setLocalTotalTables(totalTables);
  }, [totalTables]);
  
  const handleTotalTablesChange = (value) => {
    const numValue = parseInt(value, 10) || 0;
    setLocalTotalTables(numValue);
  };
  
  const handleSaveCapacity = async () => {
    setIsLoading(true);
    try {
      // Calculate total seating capacity (2 seats per table)
      const seatingCapacity = localTotalTables * 2;
      
      // Create request matching RestaurantSeatingUpdateRequest
      const seatingData = {
        seating_capacity: seatingCapacity,
        tables_count: localTotalTables
      };
      
      await restaurantApi.updateSeatingCapacity(seatingData);
      
      // Update with simplified capacity object (all small tables)
      const updatedCapacity = {
        smallTables: localTotalTables,
        mediumTables: 0,
        largeTables: 0
      };
      
      onUpdate(updatedCapacity, localTotalTables);
      alert('Seating capacity updated successfully');
    } catch (error) {
      console.error('Error updating seating capacity:', error);
      alert(error.message || 'Failed to update seating capacity');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="dashboard-card">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Seating Capacity
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Total Tables (Small - 2 people each)"
              type="number"
              fullWidth
              value={localTotalTables}
              onChange={(e) => handleTotalTablesChange(e.target.value)}
              inputProps={{ min: 0 }}
              helperText="Each table seats 2 people"
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total Capacity: {localTotalTables * 2} people ({localTotalTables} tables × 2 seats)
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={isLoading ? null : <SaveIcon />}
          onClick={handleSaveCapacity}
          sx={{ mt: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Save Capacity'}
        </Button>
      </CardContent>
    </Card>
  );
}
/**
 * Component for managing special events/announcements
 */
function SpecialEventsSection() {
  const [events, setEvents] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await announcementsApi.getAllAnnouncements();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      alert(error.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenDialog = (event = null) => {
    if (event) {
      setCurrentEvent(event);
      setTitle(event.title);
      setDescription(event.description || '');
      setStartDate(event.start_date || '');
      setEndDate(event.end_date || '');
      setIsActive(event.is_active !== undefined ? event.is_active : true);
      setIsEditing(true);
    } else {
      setCurrentEvent(null);
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setIsActive(true);
      setIsEditing(false);
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  const handleSaveEvent = async () => {
    setIsLoading(true);
    try {
      if (!title) {
        alert('Title is required');
        setIsLoading(false);
        return;
      }
      
      // Validate dates if both are provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          alert('End date must be after start date');
          setIsLoading(false);
          return;
        }
      }
      
      // Create event object matching AnnouncementCreateRequest or AnnouncementUpdateRequest
      const eventData = {
        title,
        description,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isActive
      };
      
      if (isEditing && currentEvent) {
        await announcementsApi.updateAnnouncement({ 
          id: currentEvent.id, 
          ...eventData 
        });
      } else {
        await announcementsApi.createAnnouncement(eventData);
      }
      
      fetchEvents();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert(error.message || 'Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteClick = (event) => {
    setCurrentEvent(event);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      await announcementsApi.deleteAnnouncement(currentEvent.id);
      fetchEvents();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert(error.message || 'Failed to delete event');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Special Events & Announcements</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddCircleIcon />} 
          onClick={() => handleOpenDialog()}
          disabled={isLoading}
        >
          Add New Event
        </Button>
      </Box>
      
      {isLoading && events.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              No events or announcements yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        events.map((event) => (
          <Card key={event.id} className="event-card">
            <CardContent>
              <div className="event-dates">
                {formatDate(event.start_date)}
                {event.end_date && event.start_date !== event.end_date && ` - ${formatDate(event.end_date)}`}
              </div>
              <div className="event-title">{event.title}</div>
              <div className="event-description">{event.description}</div>
              <div className="event-status">
                Status: {event.is_active ? 'Active' : 'Inactive'}
              </div>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <IconButton 
                  color="primary" 
                  onClick={() => handleOpenDialog(event)}
                  sx={{ mr: 1 }}
                  disabled={isLoading}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  color="error"
                  onClick={() => handleDeleteClick(event)}
                  disabled={isLoading}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
      
      {/* Add/Edit Event Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Event' : 'Add New Event'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Event Title"
                fullWidth
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date (Optional)"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={isActive} 
                    onChange={(e) => setIsActive(e.target.checked)} 
                  />
                } 
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveEvent} 
            variant="contained" 
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : (isEditing ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the event "{currentEvent?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/**
 * Component for managing menu items
 */
function MenuItemsSection() {
  const [menuItems, setMenuItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter state
  const [filterCategory, setFilterCategory] = useState('');
  
  // Form state
  const [dishName, setDishName] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchTags();
  }, []);
  
  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const data = await menuApi.getAllMenuItems();
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      alert(error.message || 'Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      // Categories from the SQL insert statements
      const data = [
        "Antipasti",
        "Insalate",
        "Pasta",
        "Pizza",
        "Secondi",
        "Dolci",
        "Contorni",
        "Bevande"
      ];
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  const fetchTags = async () => {
    try {
      // In a real application, this would be an API call
      // For now, we'll use a predefined list
      const data = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", 
                    "Pescatarian", "Spicy", "Organic", "Signature", "Popular", "Seasonal", 
                    "Alcoholic", "Non-Alcoholic", "Premium"];
      setAvailableTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };
  
  const handleOpenDialog = (item = null) => {
    if (item) {
      setCurrentItem(item);
      setDishName(item.dish_name);
      setDishDescription(item.dish_description || '');
      setDishPrice(item.price || '');
      setCategory(item.category);
      setSelectedTags(item.dish_tags || []);
      setIsActive(item.active !== undefined ? item.active : true);
      setIsEditing(true);
    } else {
      setCurrentItem(null);
      setDishName('');
      setDishDescription('');
      setDishPrice('');
      setCategory(categories.length > 0 ? categories[0] : '');
      setSelectedTags([]);
      setIsActive(true);
      setIsEditing(false);
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const handleSaveMenuItem = async () => {
    setIsLoading(true);
    try {
      if (!dishName || !category || !dishPrice) {
        alert('Please fill in all required fields');
        setIsLoading(false);
        return;
      }
      
      // Make sure price is a positive number
      const price = parseFloat(dishPrice);
      if (isNaN(price) || price <= 0) {
        alert('Price must be a positive number');
        setIsLoading(false);
        return;
      }
      
      // Create menu item data matching MenuItemAddRequest or MenuItemUpdateRequest
      const menuItemData = {
        dish_name: dishName,
        dish_description: dishDescription || '',
        category,
        dish_tags: selectedTags,
        price,
        active: isActive
      };
      
      if (isEditing && currentItem) {
        await menuApi.updateMenuItem({ 
          id: currentItem.id, 
          ...menuItemData 
        });
      } else {
        await menuApi.addMenuItem(menuItemData);
      }
      
      fetchMenuItems();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert(error.message || 'Failed to save menu item');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteClick = (item) => {
    setCurrentItem(item);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      await menuApi.deleteMenuItem(currentItem.id);
      fetchMenuItems();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert(error.message || 'Failed to delete menu item');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredItems = filterCategory 
    ? menuItems.filter(item => item.category === filterCategory)
    : menuItems;
    
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Menu Items</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddCircleIcon />} 
          onClick={() => handleOpenDialog()}
          disabled={isLoading}
        >
          Add Menu Item
        </Button>
      </Box>
      
      <Card className="dashboard-card" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Filter by Category"
                  sx={{ minWidth: '100px' }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={6}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                <Button 
                  variant="outlined"
                  onClick={() => setFilterCategory('')}
                  disabled={!filterCategory || isLoading}
                >
                  Clear Filter
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {isLoading && filteredItems.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredItems.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              No menu items found
            </Typography>
          </CardContent>
        </Card>
      ) : (
        filteredItems.map((item) => (
          <Card key={item.id} className="menu-item-card">
            <CardContent>
              <div className="menu-item-header">
                <div className="menu-item-title">{item.dish_name}</div>
                <div className="menu-item-price">${parseFloat(item.price).toFixed(2)}</div>
                <div className="menu-item-category">{item.category}</div>
              </div>
              
              {item.dish_description && (
                <div className="menu-item-description">{item.dish_description}</div>
              )}
              
              {item.dish_tags && item.dish_tags.length > 0 && (
                <div className="menu-item-tags">
                  {item.dish_tags.map((tag) => (
                    <span key={tag} className="menu-tag">{tag}</span>
                  ))}
                </div>
              )}
              
              <div className="menu-item-status">
                Status: {item.active !== false ? 'Active' : 'Inactive'}
              </div>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <IconButton 
                  color="primary" 
                  onClick={() => handleOpenDialog(item)}
                  sx={{ mr: 1 }}
                  disabled={isLoading}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  color="error"
                  onClick={() => handleDeleteClick(item)}
                  disabled={isLoading}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
      
      {/* Add/Edit Menu Item Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Dish Name"
                fullWidth
                required
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={dishDescription}
                onChange={(e) => setDishDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Price"
                type="number"
                fullWidth
                required
                value={dishPrice}
                onChange={(e) => setDishPrice(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={isActive} 
                    onChange={(e) => setIsActive(e.target.checked)} 
                  />
                } 
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Dietary & Special Tags</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {availableTags.map((tag) => (
                  <Box
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`tag-chip ${selectedTags.includes(tag) ? 'selected' : 'unselected'}`}
                    sx={{ cursor: 'pointer' }}
                  >
                    {tag}
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveMenuItem} 
            variant="contained" 
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : (isEditing ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the menu item "{currentItem?.dish_name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/**
 * Main Dashboard Page Component
 */
function DashboardPage() {
  const [tabValue, setTabValue] = useState(0);
  const [restaurantData, setRestaurantData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // On component mount, load restaurant info
  useEffect(() => {
    fetchRestaurantInfo();
  }, []);
  
  const fetchRestaurantInfo = async () => {
    try {
      setIsLoading(true);
      
      // Get restaurant info
      const infoResponse = await restaurantApi.getRestaurantInfo();
      
      // Get restaurant hours
      const hoursResponse = await restaurantApi.getRestaurantHours();
      
      // Get seating capacity
      const seatingResponse = await restaurantApi.getSeatingCapacity();
      
      // Convert hours from array to object format for UI
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const hoursObj = {};
      
      // Initialize default hours structure
      daysOfWeek.forEach(day => {
        hoursObj[day] = {
          open: '09:00',
          close: '17:00',
          closed: false
        };
      });
      
      // Update with actual data from API
      hoursResponse.forEach(dayInfo => {
        const dayName = daysOfWeek[dayInfo.day_of_the_week];
        hoursObj[dayName] = {
          open: dayInfo.time_open,
          close: dayInfo.time_closed,
          closed: dayInfo.is_closed
        };
      });
      
      // Simplified table capacity - all tables are small (2 seats each)
      const totalTables = seatingResponse.tables_count;
      
      const tableCapacity = {
        smallTables: totalTables,
        mediumTables: 0,
        largeTables: 0
      };
      
      // Combine all data
      const data = {
        ...infoResponse,
        operatingHours: hoursObj,
        tableCapacity,
        totalTables
      };
      
      setRestaurantData(data);
    } catch (error) {
      console.error('Error fetching restaurant information:', error);
      alert(error.message || 'Failed to load restaurant information');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleUpdateHours = async (updatedHours) => {
    setRestaurantData({
      ...restaurantData,
      operatingHours: updatedHours
    });
  };
  
  const handleUpdateCapacity = async (updatedCapacity, updatedTotalTables) => {
    setRestaurantData({
      ...restaurantData,
      tableCapacity: updatedCapacity,
      totalTables: updatedTotalTables
    });
  };
  
  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading restaurant information...</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%' }} >
      <Typography variant="h4" gutterBottom>
        Restaurant Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleChangeTab} 
          orientation={smallScreen ? "vertical" : "horizontal"}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="General" 
            icon={<RestaurantIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Special Events" 
            icon={<EventIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Menu" 
            icon={<MenuBookIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* General Tab - Restaurant information, hours, capacity */}
      {tabValue === 0 && (
        <Box>
          <Grid container spacing={3} flexDirection='column'>
            <Grid item xs={12}>
              <Card className="dashboard-card">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Restaurant Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Restaurant Name"
                        fullWidth
                        value={restaurantData.restaurant_name || restaurantData.name || ''}
                        InputProps={{ readOnly: true }}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        fullWidth
                        value={restaurantData.restaurant_email_address || restaurantData.email || ''}
                        InputProps={{ readOnly: true }}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Phone"
                        fullWidth
                        value={restaurantData.restaurant_phone_number || restaurantData.phone || ''}
                        InputProps={{ readOnly: true }}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Address"
                        fullWidth
                        value={restaurantData.restaurant_address || restaurantData.address || ''}
                        InputProps={{ readOnly: true }}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <OperatingHoursSection 
                hours={restaurantData.operatingHours} 
                onUpdate={handleUpdateHours} 
              />
            </Grid>
            
            <Grid item xs={12}>
              <TableCapacitySection 
                capacity={restaurantData.tableCapacity}
                totalTables={restaurantData.totalTables}
                onUpdate={handleUpdateCapacity}
              />
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Special Events Tab */}
      {tabValue === 1 && (
        <SpecialEventsSection />
      )}
      
      {/* Menu Tab */}
      {tabValue === 2 && (
        <MenuItemsSection />
      )}
    </Box>
  );
}

export default DashboardPage;