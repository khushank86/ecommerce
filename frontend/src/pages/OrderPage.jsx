import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Button, Divider, Card, CardMedia, CardContent, Grid, Paper, Container, Stack,
  CircularProgress, Alert, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Rating, Tooltip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Define the Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // Deep Indigo
    },
    secondary: {
      main: '#ff4081', // Bright Pink
    },
    success: {
      main: '#4CAF50', // Green for delivered status
    },
    warning: {
      main: '#FFC107', // Amber for pending/shipping status
    },
    info: {
        main: '#2196F3', // Blue for informational messages
    },
    background: {
      default: '#f4f6f8', // Light grey background
      paper: '#ffffff', // White for cards and papers
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif', // Modern sans-serif font
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
        },
      },
    },
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                backgroundColor: '#ffffff',
                color: 'rgba(0, 0, 0, 0.87)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                fontSize: '0.875rem',
                border: '1px solid #ddd',
                padding: '12px',
            },
            arrow: {
                color: '#ffffff',
            },
        },
    },
  },
});

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const navigate = useNavigate();

  const [showPayPalDialog, setShowPayPalDialog] = useState(false);
  const [selectedItemToReorder, setSelectedItemToReorder] = useState(null);
  const paypalRef = useRef(null);

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
      line1: '', city: '', state: '', zip: '', country: 'India'
  });
  
  const [quantity, setQuantity] = useState(1);

  // Function to format an address object into a string
  const formatAddress = (address) => {
    if (!address) return null;
    const { address_line1, address_line2, city, state, zip_code, country } = address;
    return `${address_line1}${address_line2 ? `, ${address_line2}` : ''}, ${city}, ${state} ${zip_code}, ${country}`;
  };
  
  // Fetch user profile, addresses, and orders
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('You are not logged in. Please log in to view your orders.');
        setIsLoading(false);
        navigate('/login');
        return;
      }

      try {
        const userFromStorage = JSON.parse(localStorage.getItem('user'));
        if (userFromStorage) {
            setUser(userFromStorage);
        }

        const addressRes = await fetch('http://localhost:5000/user/addresses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!addressRes.ok) throw new Error('Failed to fetch addresses');
        const addressesData = await addressRes.json();
        const defaultAddress = addressesData.find(addr => addr.is_default);
        setUserAddress(formatAddress(defaultAddress));

        const ordersRes = await fetch('http://localhost:5000/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!ordersRes.ok) throw new Error('Failed to fetch orders');
        const ordersData = await ordersRes.json();
        setOrders(ordersData);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);
  
  // PayPal Script Loader
  useEffect(() => {
    if (showPayPalDialog && selectedItemToReorder) {
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }
      const renderPayPalButtons = () => {
          if (paypalRef.current && window.paypal) {
              window.paypal.Buttons({
                  createOrder: (data, actions) => {
                      const itemPrice = parseFloat(selectedItemToReorder.price) || 0;
                      const totalAmount = (itemPrice * quantity).toFixed(2);
                      return actions.order.create({
                          purchase_units: [{ amount: { value: totalAmount } }]
                      });
                  },
                  onApprove: (data, actions) => {
                      return actions.order.capture().then(details => {
                          toast.success(`Successfully ordered ${quantity} of "${selectedItemToReorder.name}"!`);
                          setShowPayPalDialog(false);
                          setSelectedItemToReorder(null);
                          setOrders([]); 
                      });
                  },
                  onError: (err) => {
                      toast.error("An error occurred during payment.");
                      setShowPayPalDialog(false);
                  }
              }).render(paypalRef.current);
          }
      };

      if (!window.paypal) {
        const script = document.createElement('script');
        script.src = 'https://www.paypal.com/sdk/js?client-id=AXa2PL8lJEEoKPO8nKbAN3h6qtRxbK3OTY46-PLESpSN2soahg38DuLUv8nwbQA5C5HJXLHhDZTkyRnD';
        script.async = true;
        script.onload = renderPayPalButtons;
        document.body.appendChild(script);
      } else {
        renderPayPalButtons();
      }
    }
  }, [showPayPalDialog, selectedItemToReorder, quantity]);

  const handleBuyNowItem = (item) => {
    setSelectedItemToReorder(item);
    setQuantity(1);
    if (userAddress) {
      setShowPayPalDialog(true);
    } else {
      setIsAddressDialogOpen(true);
    }
  };
  
  const handleSaveAddressAndContinue = async () => {
      if (!newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.zip) {
          toast.error("Please fill all address fields.");
          return;
      }
      
      const token = localStorage.getItem('token');
      const addressPayload = {
          address_line1: newAddress.line1,
          city: newAddress.city,
          state: newAddress.state,
          zip_code: newAddress.zip,
          country: newAddress.country,
          is_default: true
      };

      toast.info("Saving your address...");
      try {
          const response = await fetch('http://localhost:5000/user/address', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(addressPayload)
          });
          if (!response.ok) throw new Error("Failed to save address");
          
          const savedAddress = await response.json();
          setUserAddress(formatAddress(savedAddress));
          toast.success("Address saved successfully!");
          
          setIsAddressDialogOpen(false);
          setShowPayPalDialog(true);

      } catch (err) {
          toast.error("Could not save address. Please try again.");
          console.error(err);
      }
  };

  const handleClosePayPalDialog = () => {
    setShowPayPalDialog(false);
    setSelectedItemToReorder(null);
  };

  const handleOpenReviewDialog = (item) => {
    setReviewingItem(item);
    setIsReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setIsReviewDialogOpen(false);
    setReviewingItem(null);
    setRating(0);
    setReviewText('');
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.warn("Please provide a rating.");
      return;
    }
    toast.info("Submitting your review...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Review for "${reviewingItem.name}" submitted!`);
    handleCloseReviewDialog();
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', py: 5 }}>
        <Container maxWidth="md">
          <Typography variant="h5" gutterBottom sx={{ mb: 4, textAlign: 'center', color: theme.palette.primary.main }}>
            Your Orders
          </Typography>

          <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: '12px', bgcolor: theme.palette.background.paper }}>
             <Typography variant="h6" sx={{ mb: 1.5, color: theme.palette.primary.dark, display: 'flex', alignItems: 'center' }}>
               <LocalShippingIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
               Your Primary Shipping Address
             </Typography>
             <Typography variant="body1" color="text.secondary" sx={{ pl: 3, mb: 2 }}>
               {userAddress ? userAddress : 'No primary address set. You will be asked to add one when re-ordering.'}
             </Typography>
             <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => navigate('/address')}>
                 Manage Addresses
             </Button>
          </Paper>

          {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>}
          {error && <Alert severity="error">{error}</Alert>}
          
          {!isLoading && !error && orders.length === 0 && (
            <Paper elevation={2} sx={{ p: 5, textAlign: 'center' }}>
              <ShoppingCartIcon sx={{ fontSize: 80, color: theme.palette.info.light, mb: 2 }} />
              <Typography variant="h6" gutterBottom>No orders yet!</Typography>
              <Button variant="contained" color="primary" onClick={() => navigate('/')}>Start Shopping</Button>
            </Paper>
          )}

          {!isLoading && !error && orders.length > 0 && (
            <Stack spacing={4}>
              {orders.map((order) => (
                <Paper key={order.id} elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
                  <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                    <Grid item xs={12} sm={8}>
                      <Typography variant="subtitle1" color="text.secondary"><Box component="span" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>ORDER PLACED:</Box> {order.orderDate}</Typography>
                      <Typography variant="subtitle1" color="text.secondary"><Box component="span" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>TOTAL:</Box> ₹{order.total}</Typography>
                      <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalShippingIcon sx={{ mr: 0.5, fontSize: '1rem', color: theme.palette.primary.main }} />
                        <Box component="span" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>SHIP TO:</Box>&nbsp;
                        <Tooltip
                          title={
                            <React.Fragment>
                              <Typography color="inherit" sx={{ fontWeight: 'bold' }}>{user?.name || order.shippedTo}</Typography>
                              <Typography variant="body2">{userAddress || 'Address not available.'}</Typography>
                            </React.Fragment>
                          }
                          arrow
                        >
                            <span style={{ cursor: 'pointer', color: theme.palette.primary.dark, textDecoration: 'underline' }}>
                                {user?.name || order.shippedTo}
                            </span>
                        </Tooltip>
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="h6" sx={{ color: theme.palette.primary.dark }}>Order ID: {order.id}</Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 3 }} />
                  <Stack spacing={2}>
                    {order.items.map((item, index) => (
                      <Card key={item.id || index} sx={{ display: 'flex', alignItems: 'center', p: 1, boxShadow: 'none', border: '1px solid #f0f0f0' }}>
                        <CardMedia component="img" sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '8px', mr: 2 }} image={item.image} alt={item.name} />
                        <Box sx={{ flexGrow: 1 }}>
                          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{item.name}</Typography>
                            <Typography variant="body2">Qty: {item.qty}</Typography>
                            <Typography variant="body2">Price: ₹{item.price}</Typography>
                          </CardContent>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                          <Button variant="contained" size="small" onClick={() => handleBuyNowItem(item)}>Buy Now</Button>
                          <Button variant="outlined" size="small" onClick={() => handleOpenReviewDialog(item)}>Leave Review</Button>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          {/* Address Capture Dialog */}
          <Dialog open={isAddressDialogOpen} onClose={() => setIsAddressDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary">Add Shipping Address</Typography>
              </DialogTitle>
              <DialogContent dividers>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                      We don't have a default address for you. Please add one to continue.
                  </Typography>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                      <TextField label="Address Line 1" value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} fullWidth required />
                      <TextField label="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} fullWidth required />
                      <TextField label="State / Province" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} fullWidth required />
                      <TextField label="Postal / Zip Code" value={newAddress.zip} onChange={e => setNewAddress({...newAddress, zip: e.target.value})} fullWidth required />
                      <TextField label="Country" value={newAddress.country} onChange={e => setNewAddress({...newAddress, country: e.target.value})} fullWidth required />
                  </Stack>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                  <Button onClick={() => setIsAddressDialogOpen(false)} variant="outlined">Cancel</Button>
                  <Button onClick={handleSaveAddressAndContinue} variant="contained">Save and Continue</Button>
              </DialogActions>
          </Dialog>

          {/* PayPal Payment Dialog */}
          <Dialog open={showPayPalDialog} onClose={handleClosePayPalDialog} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: 'center' }}><Typography variant="h5" color="primary">Complete Your Purchase</Typography></DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {selectedItemToReorder && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, border: '1px solid #eee', borderRadius: '8px' }}>
                  {/* --- NEW: Product Image --- */}
                  <CardMedia
                    component="img"
                    sx={{ width: 100, height: 100, objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }}
                    image={selectedItemToReorder.image}
                    alt={selectedItemToReorder.name}
                  />
                  <Box>
                    <Typography variant="h6">{selectedItemToReorder.name}</Typography>
                    <FormControl sx={{ my: 2, minWidth: 120 }} size="small">
                      <InputLabel>Quantity</InputLabel>
                      <Select
                          value={quantity}
                          label="Quantity"
                          onChange={(e) => setQuantity(e.target.value)}
                      >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(q => (
                              <MenuItem key={q} value={q}>{q}</MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                      Total: ₹{( (parseFloat(selectedItemToReorder.price) || 0) * quantity ).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              )}
              <div ref={paypalRef}></div>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePayPalDialog}>Cancel</Button>
            </DialogActions>
          </Dialog>

          {/* Review Dialog */}
          <Dialog open={isReviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: 'center' }}><Typography variant="h5" color="primary">Leave a Review</Typography></DialogTitle>
            <DialogContent dividers>
              {reviewingItem && (
                <Stack spacing={3} sx={{ pt: 1 }}>
                  <Typography variant="h6">You are reviewing: <strong>{reviewingItem.name}</strong></Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography component="legend">Your Rating:</Typography>
                    <Rating name="product-rating" value={rating} onChange={(e, newVal) => setRating(newVal)} precision={0.5} size="large" />
                  </Box>
                  <TextField label="Your Review (optional)" multiline rows={4} value={reviewText} onChange={e => setReviewText(e.target.value)} fullWidth />
                </Stack>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseReviewDialog} variant="outlined">Cancel</Button>
              <Button onClick={handleSubmitReview} variant="contained">Submit Review</Button>
            </DialogActions>
          </Dialog>

        </Container>
      </Box>
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
};

const App = () => {
  return <OrderPage />;
};

export default App;
