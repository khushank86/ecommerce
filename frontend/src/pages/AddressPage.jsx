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
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


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
    body1: {
      fontSize: '1rem',
      color: '#555',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#777',
    },
    subtitle1: {
      fontWeight: 500,
      color: '#666',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', 
          textTransform: 'none', 
        },
        outlined: {
          borderColor: '#ccc',
          color: '#555',
          '&:hover': {
            borderColor: '#999',
            backgroundColor: '#f0f0f0',
          },
        },
        containedPrimary: {
          backgroundColor: '#3f51b5',
          '&:hover': {
            backgroundColor: '#303f9f',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', 
          '&:hover': {
            transform: 'translateY(-5px)', 
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)', 
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '10px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)', 
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', 
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
        const errorData = await response.json(); // Attempt to parse error JSON
        throw new Error(errorData.error || 'Failed to fetch addresses');
      }

      const data = await response.json();
      setAddresses(data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      
      if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
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

  
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  
  const handleAddEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to save addresses.');
      navigate('/login');
      return;
    }

    // Basic validation
    if (!currentAddress.address_line1 || !currentAddress.city || !currentAddress.state || !currentAddress.zip_code || !currentAddress.country) {
      toast.error('Please fill in all required address fields.');
      return;
    }

    try {
      let response;
      if (formMode === 'add') {
        response = await fetch('http://localhost:5000/user/address', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(currentAddress)
        });
      } else { 
        response = await fetch(`http://localhost:5000/user/address/${currentAddress.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
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
      
      if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
          toast.error(`Server responded with an unexpected format. Please ensure your backend is running correctly and serving JSON.`);
      } else {
          toast.error(err.message || `Could not ${formMode} address.`);
      }
    }
  };

  
  const handleEditClick = (address) => {
    setFormMode('edit');
    setCurrentAddress({ ...address });
  };

  
  const resetForm = () => {
    setFormMode('add');
    setCurrentAddress({
      id: null,
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      is_default: false,
    });
  };

  
  const handleDeleteClick = (addressId) => {
    setAddressToDeleteId(addressId);
    setIsConfirmDialogOpen(true);
  };

  
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete address');
      }

      toast.success('Address deleted successfully!');
      fetchAddresses(); // Re-fetch addresses
    } catch (err) {
      console.error('Error deleting address:', err);
      if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
          toast.error(`Server responded with an unexpected format during delete. Please ensure your backend is running correctly and serving JSON.`);
      } else {
          toast.error(err.message || 'Could not delete address.');
      }
    } finally {
      setAddressToDeleteId(null);
    }
  };

  
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default address');
      }

      toast.success('Default address updated!');
      fetchAddresses(); 
    } catch (err) {
      console.error('Error setting default address:', err);
      if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
          toast.error(`Server responded with an unexpected format during set default. Please ensure your backend is running correctly and serving JSON.`);
      } else {
          toast.error(err.message || 'Could not set default address.');
      }
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
              <TextField
                fullWidth
                label="Address Line 1"
                name="address_line1"
                value={currentAddress.address_line1}
                onChange={handleFormChange}
                required
                size="small"
              />
              <TextField
                fullWidth
                label="Address Line 2 (Optional)"
                name="address_line2"
                value={currentAddress.address_line2}
                onChange={handleFormChange}
                size="small"
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={currentAddress.city}
                    onChange={handleFormChange}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State"
                    name="state"
                    value={currentAddress.state}
                    onChange={handleFormChange}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    name="zip_code"
                    value={currentAddress.zip_code}
                    onChange={handleFormChange}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="country"
                    value={currentAddress.country}
                    onChange={handleFormChange}
                    required
                    size="small"
                  />
                </Grid>
              </Grid>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentAddress.is_default}
                    onChange={handleFormChange}
                    name="is_default"
                    color="primary"
                  />
                }
                label="Set as default address"
              />
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button variant="contained" type="submit" color="primary">
                  {formMode === 'add' ? 'Add Address' : 'Update Address'}
                </Button>
                {formMode === 'edit' && (
                  <Button variant="outlined" onClick={resetForm}>
                    Cancel Edit
                  </Button>
                )}
              </Stack>
            </Box>
          </Paper>

          
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <CircularProgress />
              <Typography variant="h6" sx={{ ml: 2 }}>Loading addresses...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} action={
              error.includes('log in') && (
                <Button color="inherit" size="small" onClick={() => navigate('/login')}>
                  LOGIN
                </Button>
              )
            }>
              {error}
            </Alert>
          )}

          {!isLoading && !error && addresses.length === 0 && (
            <Alert severity="info" action={
              <Button color="inherit" size="small" onClick={resetForm}>
                ADD FIRST ADDRESS
              </Button>
            }>
              You haven't saved any addresses yet.
            </Alert>
          )}

          {/* Display Existing Addresses */}
          {!isLoading && !error && addresses.length > 0 && (
            <Stack spacing={3}>
              {addresses.map((address) => (
                <Card key={address.id} sx={{ p: 2, borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative' }}>
                  {address.is_default && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', color: theme.palette.primary.main }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: '1.2rem', mr: 0.5 }} />
                      <Typography variant="body2" fontWeight="bold">Default</Typography>
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: theme.palette.primary.dark }}>
                      <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
                      Address:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 0.5 }}>
                      {address.address_line1} {address.address_line2 && `, ${address.address_line2}`}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 0.5 }}>
                      {address.city}, {address.state} - {address.zip_code}
                    </Typography>
                    <Typography variant="body1">
                      {address.country}
                    </Typography>
                  </CardContent>
                  <Stack direction="row" spacing={1} sx={{ mt: 2, px: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditClick(address)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(address.id)}
                    >
                      Delete
                    </Button>
                    {!address.is_default && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<StarIcon />}
                        onClick={() => handleSetDefault(address.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Container>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            Are you sure you want to delete this address? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteAddress} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <ToastContainer position="top-right" autoClose={1000} />
    </ThemeProvider>
  );
};



const App = () => {
  return <AddressPage />;
};

export default App;
