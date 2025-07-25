import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Divider, Card, CardContent, Grid, Paper, Container, Stack, CircularProgress, Alert,
  TextField, Checkbox, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Theme definition for consistent styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', 
    },
    secondary: {
      main: '#ff4081', 
    },
    background: {
      default: '#f4f6f8', 
      paper: '#ffffff', 
    },
     success: {
      main: '#4CAF50',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif', 
    h5: {
      fontWeight: 700,
      color: '#333',
    },
    h6: {
      fontWeight: 600,
      color: '#444',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', 
          textTransform: 'none', 
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '10px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)', 
           '&:hover': {
            transform: 'scale(1.01)', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
          },
        },
      },
    },
  },
});


const AddressPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentAddress, setCurrentAddress] = useState({
    id: null,
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    is_default: false,
  });
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [addressToDeleteId, setAddressToDeleteId] = useState(null);

  const navigate = useNavigate();

  // Fetches addresses from the backend when the component mounts
  const fetchAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please log in to manage your addresses.');
        setIsLoading(false);
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/user/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Your session has expired or is invalid. Please log in again.');
        setIsLoading(false);
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch addresses');
      }

      const data = await response.json();
      setAddresses(data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      if (err instanceof SyntaxError) {
          setError('Received an unexpected response from the server. Please check backend status.');
      } else {
          setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []); 

  // Handles changes in the address form fields
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handles submitting the form to add or edit an address
  const handleAddEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to save addresses.');
      navigate('/login');
      return;
    }

    if (!currentAddress.address_line1 || !currentAddress.city || !currentAddress.state || !currentAddress.zip_code || !currentAddress.country) {
      toast.error('Please fill in all required address fields.');
      return;
    }

    try {
      let response;
      if (formMode === 'add') {
        response = await fetch('http://localhost:5000/user/address', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(currentAddress)
        });
      } else { 
        response = await fetch(`http://localhost:5000/user/address/${currentAddress.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(currentAddress)
        });
      }

      if (!response.ok) {
        const errorData = await response.json(); 
        throw new Error(errorData.error || `Failed to ${formMode} address`);
      }

      toast.success(`Address ${formMode === 'add' ? 'added' : 'updated'} successfully!`);
      resetForm();
      fetchAddresses(); 
    } catch (err) {
      console.error(`Error ${formMode}ing address:`, err);
      toast.error(err.message || `Could not ${formMode} address.`);
    }
  };
  
  // Sets up the form for editing an existing address
  const handleEditClick = (address) => {
    setFormMode('edit');
    setCurrentAddress({ ...address });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resets the form to its initial "add" state
  const resetForm = () => {
    setFormMode('add');
    setCurrentAddress({
      id: null, address_line1: '', address_line2: '', city: '', state: '', zip_code: '', country: '', is_default: false,
    });
  };

  // Opens the delete confirmation dialog
  const handleDeleteClick = (addressId) => {
    setAddressToDeleteId(addressId);
    setIsConfirmDialogOpen(true);
  };

  // Confirms and executes the address deletion
  const confirmDeleteAddress = async () => {
    setIsConfirmDialogOpen(false);
    if (!addressToDeleteId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to delete addresses.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/user/address/${addressToDeleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete address');
      }

      toast.success('Address deleted successfully!');
      fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
      toast.error(err.message || 'Could not delete address.');
    } finally {
      setAddressToDeleteId(null);
    }
  };

  // Sets a selected address as the default one
  const handleSetDefault = async (addressId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to set default address.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/user/address/${addressId}/set-default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default address');
      }

      toast.success('Default address updated!');
      fetchAddresses(); 
    } catch (err) {
      console.error('Error setting default address:', err);
      toast.error(err.message || 'Could not set default address.');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', py: 5 }}>
        <Container maxWidth="md">
          <Typography variant="h5" gutterBottom sx={{ mb: 4, textAlign: 'center', color: theme.palette.primary.main }}>
            Your Shipping Addresses
          </Typography>

          {/* Address Add/Edit Form */}
          <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ mb: 3, color: theme.palette.primary.dark }}>
              {formMode === 'add' ? 'Add New Address' : 'Edit Address'}
            </Typography>
            <Box component="form" onSubmit={handleAddEditSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField fullWidth label="Address Line 1" name="address_line1" value={currentAddress.address_line1} onChange={handleFormChange} required size="small" />
              <TextField fullWidth label="Address Line 2 (Optional)" name="address_line2" value={currentAddress.address_line2} onChange={handleFormChange} size="small" />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField fullWidth label="City" name="city" value={currentAddress.city} onChange={handleFormChange} required size="small" /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="State" name="state" value={currentAddress.state} onChange={handleFormChange} required size="small" /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Zip Code" name="zip_code" value={currentAddress.zip_code} onChange={handleFormChange} required size="small" /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Country" name="country" value={currentAddress.country} onChange={handleFormChange} required size="small" /></Grid>
              </Grid>
              <FormControlLabel control={<Checkbox checked={currentAddress.is_default} onChange={handleFormChange} name="is_default" color="primary" />} label="Set as default address" />
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button variant="contained" type="submit" color="primary">{formMode === 'add' ? 'Add Address' : 'Update Address'}</Button>
                {formMode === 'edit' && (<Button variant="outlined" onClick={resetForm}>Cancel Edit</Button>)}
              </Stack>
            </Box>
          </Paper>

          {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>}
          {error && <Alert severity="error">{error}</Alert>}
          
          {!isLoading && !error && addresses.length === 0 && (
            <Alert severity="info">You haven't saved any addresses yet. Use the form above to add your first one!</Alert>
          )}

          {/* Display Existing Addresses */}
          {!isLoading && !error && addresses.length > 0 && (
            <Stack spacing={3}>
              {addresses.map((address) => (
                <Card key={address.id} sx={{ p: 2, borderRadius: '10px', position: 'relative' }}>
                  {address.is_default && (
                    <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', color: theme.palette.success.main }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: '1.2rem', mr: 0.5 }} />
                      <Typography variant="body2" fontWeight="bold">Default</Typography>
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="body1">{address.address_line1}{address.address_line2 && `, ${address.address_line2}`}</Typography>
                    <Typography variant="body1">{address.city}, {address.state} - {address.zip_code}</Typography>
                    <Typography variant="body1">{address.country}</Typography>
                  </CardContent>
                  <Stack direction="row" spacing={1} sx={{ mt: 2, px: 2, pb: 1 }}>
                    <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => handleEditClick(address)}>Edit</Button>
                    <Button variant="outlined" size="small" color="secondary" startIcon={<DeleteIcon />} onClick={() => handleDeleteClick(address.id)}>Delete</Button>
                    {!address.is_default && (
                      <Button variant="outlined" size="small" startIcon={<StarIcon />} onClick={() => handleSetDefault(address.id)}>Set as Default</Button>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Container>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onClose={() => setIsConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this address? This action cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteAddress} color="secondary" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
};

const App = () => {
  return <AddressPage />;
};

export default App;
