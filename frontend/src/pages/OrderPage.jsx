import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Button, Divider, Card, CardMedia, CardContent, Grid, Paper, Container, Stack,
  CircularProgress, Alert, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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
          textTransform: 'none', // Keep button text as is
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
            transform: 'translateY(-3px)',
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
            transform: 'scale(1.005)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    MuiAccordion: {
        styleOverrides: {
            root: {
                borderRadius: '12px',
                boxShadow: 'none',
                '&:before': {
                    display: 'none',
                },
                '&.Mui-expanded': {
                    margin: '0',
                },
            },
        },
    },
    MuiAccordionSummary: {
        styleOverrides: {
            root: {
                borderRadius: '12px',
                minHeight: '64px',
                '&.Mui-expanded': {
                    minHeight: '64px',
                },
            },
            content: {
                margin: '12px 0',
                '&.Mui-expanded': {
                    margin: '12px 0',
                },
            },
        },
    },
    MuiAccordionDetails: {
        styleOverrides: {
            root: {
                padding: '16px',
            },
        },
    },
  },
});

// Helper function to determine Stepper active step
const getOrderStatusStep = (status) => {
  switch (status) {
    case 'Order Placed': return 0;
    case 'Processing': return 1;
    case 'Shipped': return 2;
    case 'Out for Delivery': return 3;
    case 'Delivered': return 4;
    case 'Cancelled': return 0;
    default: return 0;
  }
};

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const navigate = useNavigate();

  // PayPal related states and ref
  const [showPayPalDialog, setShowPayPalDialog] = useState(false); // Changed name for clarity with Dialog
  const [selectedItemToReorder, setSelectedItemToReorder] = useState(null); // Holds the single item
  const paypalRef = useRef(null); // Ref for PayPal button container

  // Effect to load PayPal script and render buttons
  useEffect(() => {
    // Only proceed if dialog is open and an item is selected
    if (showPayPalDialog && selectedItemToReorder) {
      // Clear previous PayPal buttons if any
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }

      // Check if PayPal SDK is already loaded
      if (!window.paypal) {
        const script = document.createElement('script');
        script.src = 'https://www.paypal.com/sdk/js?client-id=AXa2PL8lJEEoKPO8nKbAN3h6qtRxbK3OTY46-PLESpSN2soahg38DuLUv8nwbQA5C5HJXLHhDZTkyRnD'; // Replace with your actual client ID in production
        script.async = true;
        script.onload = () => {
          // Ensure paypalRef.current is available before rendering buttons
          if (paypalRef.current) {
            window.paypal.Buttons({
              createOrder: (data, actions) => {
                // Use the price and quantity of the selected single item
                const itemPrice = selectedItemToReorder.price || 1500; // Fallback price
                const itemQuantity = selectedItemToReorder.qty || 1; // Fallback quantity
                const totalAmount = (itemPrice * itemQuantity).toFixed(2);

                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: totalAmount
                    }
                  }]
                });
              },
              onApprove: (data, actions) => {
                return actions.order.capture().then(function(details) {
                  toast.success(`Successfully re-ordered "${selectedItemToReorder.name}"!`);
                  console.log('Item re-purchased:', selectedItemToReorder.id, details);

                  // Update orders state: remove the re-ordered item
                  setOrders(prevOrders => {
                    return prevOrders.map(order => {
                      // Find the order that contains this item
                      if (order.items.some(item => item.id === selectedItemToReorder.id)) {
                        const updatedItems = order.items.filter(item => item.id !== selectedItemToReorder.id);
                        // If the order becomes empty, remove the entire order
                        if (updatedItems.length === 0) {
                          return null; // Mark for removal
                        }
                        return { ...order, items: updatedItems };
                      }
                      return order;
                    }).filter(Boolean); // Filter out null orders
                  });

                  // Reset PayPal state after successful payment
                  setShowPayPalDialog(false);
                  setSelectedItemToReorder(null);
                });
              },
              onCancel: (data) => {
                toast.info("PayPal payment cancelled.");
                setShowPayPalDialog(false);
                setSelectedItemToReorder(null);
              },
              onError: (err) => {
                toast.error("An error occurred during PayPal payment.");
                console.error("PayPal Error:", err);
                setShowPayPalDialog(false);
                setSelectedItemToReorder(null);
              }
            }).render(paypalRef.current);
          }
        };
        document.body.appendChild(script);
      } else {
        // If SDK is already loaded, just render buttons
        if (paypalRef.current) {
          window.paypal.Buttons({
            createOrder: (data, actions) => {
              const itemPrice = selectedItemToReorder.price || 1500;
              const itemQuantity = selectedItemToReorder.qty || 1;
              const totalAmount = (itemPrice * itemQuantity).toFixed(2);

              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: totalAmount
                  }
                }]
              });
            },
            onApprove: (data, actions) => {
              return actions.order.capture().then(function(details) {
                toast.success(`Successfully re-ordered "${selectedItemToReorder.name}"!`);
                console.log('Item re-purchased:', selectedItemToReorder.id, details);

                setOrders(prevOrders => {
                  return prevOrders.map(order => {
                    if (order.items.some(item => item.id === selectedItemToReorder.id)) {
                      const updatedItems = order.items.filter(item => item.id !== selectedItemToReorder.id);
                      if (updatedItems.length === 0) {
                        return null;
                      }
                      return { ...order, items: updatedItems };
                    }
                    return order;
                  }).filter(Boolean);
                });

                setShowPayPalDialog(false);
                setSelectedItemToReorder(null);
              });
            },
            onCancel: (data) => {
              toast.info("PayPal payment cancelled.");
              setShowPayPalDialog(false);
              setSelectedItemToReorder(null);
            },
            onError: (err) => {
              toast.error("An error occurred during PayPal payment.");
              console.error("PayPal Error:", err);
              setShowPayPalDialog(false);
              setSelectedItemToReorder(null);
            }
          }).render(paypalRef.current);
        }
      }
    }
  }, [showPayPalDialog, selectedItemToReorder]); // Dependencies for PayPal effect

  // Effect to fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You are not logged in. Please log in to view your orders.');
          setIsLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/orders', {
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
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch orders: ${response.status}`);
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
            setError('Received an unexpected response from the server. Please check backend status.');
        } else {
            setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  // Effect to fetch user address on component mount
  useEffect(() => {
    const fetchUserAddress = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUserAddress('Not logged in.');
          return;
        }

        const response = await fetch('http://localhost:5000/user/address', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.address) {
            setUserAddress(data.address);
          } else {
            setUserAddress('No primary address set. Go to Manage Addresses to add one.');
          }
        } else {
          console.warn('Could not fetch user address:', response.status);
          try {
              const errorData = await response.json();
              setUserAddress(`Error loading primary address: ${errorData.message || response.status}`);
          } catch {
              setUserAddress(`Error loading primary address: ${response.statusText || response.status}`);
          }
        }
      } catch (err) {
        console.error('Error fetching user address:', err);
        if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
            setUserAddress('Error loading primary address: Unexpected server response.');
        } else {
            setUserAddress('Error loading primary address.');
        }
      }
    };

    fetchUserAddress();
  }, [navigate]);

  // Function to handle "Buy Now" for a single item
  const handleBuyNowItem = (item) => {
    setSelectedItemToReorder(item);
    setShowPayPalDialog(true);
  };

  // Function to close the PayPal dialog
  const handleClosePayPalDialog = () => {
    setShowPayPalDialog(false);
    setSelectedItemToReorder(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', py: 5 }}>
        <Container maxWidth="md">
          <Typography variant="h5" gutterBottom sx={{ mb: 4, textAlign: 'center', color: theme.palette.primary.main }}>
            Your Orders
          </Typography>

          {/* User Address Section */}
          <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: '12px', bgcolor: theme.palette.background.paper }}>
            <Typography variant="h6" sx={{ mb: 1.5, color: theme.palette.primary.dark, display: 'flex', alignItems: 'center' }}>
              <LocalShippingIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              Your Primary Shipping Address
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{
              pl: 3,
              mb: (userAddress === 'Not logged in.' || (userAddress && userAddress.startsWith('Error'))) ? 0 : 2
            }}>
              {userAddress ? userAddress : 'Loading your address...'}
            </Typography>
            {userAddress && userAddress !== 'Not logged in.' && !(userAddress && userAddress.startsWith('Error')) && (
                <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/address')}
                >
                    Manage Addresses
                </Button>
            )}
            {userAddress === 'Not logged in.' && (
                 <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/login')}
                >
                    Login to Manage Addresses
                </Button>
            )}
          </Paper>

          {/* Loading State */}
          {isLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Fetching your past orders...</Typography>
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} action={
              (error.includes('log in') || error.includes('session expired')) && (
                <Button color="inherit" size="small" onClick={() => navigate('/login')}>
                  LOGIN
                </Button>
              )
            }>
              {error}
            </Alert>
          )}

          {/* Empty Orders State */}
          {!isLoading && !error && orders.length === 0 && (
            <Paper elevation={2} sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: '12px', bgcolor: theme.palette.background.paper }}>
              <ShoppingCartIcon sx={{ fontSize: 80, color: theme.palette.info.light, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No orders yet!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                It looks like you haven't placed any orders with us.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/')}
              >
                Start Shopping
              </Button>
            </Paper>
          )}

          {/* Orders List */}
          {!isLoading && !error && orders.length > 0 && (
            <Stack spacing={4}>
              {orders.map((order) => (
                <Paper key={order.id} elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: '12px' }}>
                  {/* Order Header Section */}
                  <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="text.secondary">
                        <Box component="span" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>ORDER PLACED:</Box> {order.orderDate}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        <Box component="span" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>TOTAL:</Box> ₹{order.total}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalShippingIcon sx={{ mr: 0.5, fontSize: '1rem', color: theme.palette.primary.main }} />
                        <Box component="span" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>SHIP TO:</Box> {order.shippedTo}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="h6" sx={{ color: theme.palette.primary.dark, mb: 1 }}>
                        Order ID: {order.id}
                      </Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                        <Button variant="outlined" size="small">View Order Details</Button>
                        <Button variant="outlined" size="small">Invoice</Button>
                      </Stack>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3, borderColor: '#eee' }} />

                  {/* Delivery Status */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center',
                      color: order.status === 'Delivered' ? theme.palette.success.main : theme.palette.warning.dark
                    }}>
                      {order.status === 'Delivered' ? <CheckCircleOutlineIcon sx={{ mr: 1, fontSize: '1.5rem' }} /> : <LocalShippingIcon sx={{ mr: 1, fontSize: '1.5rem' }} />}
                      Status: {order.status}
                      {order.deliveryDate && order.status === 'Delivered' ? ` on ${order.deliveryDate}` : ''}
                      {order.status !== 'Delivered' && order.deliveryDate ? ` (Est. ${order.deliveryDate})` : ''}
                    </Typography>

                    {/* Order Progress Stepper */}
                    <Box sx={{ width: '100%', mt: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            {['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map((label, index) => (
                                <Box key={label} sx={{
                                    textAlign: 'center',
                                    flex: 1,
                                    position: 'relative',
                                    '&:not(:last-of-type)::after': {
                                        content: '""',
                                        position: 'absolute',
                                        width: 'calc(100% - 40px)', // Adjust line length
                                        height: '2px',
                                        backgroundColor: index < getOrderStatusStep(order.status) ? theme.palette.primary.main : theme.palette.divider,
                                        left: 'calc(50% + 20px)', // Align line
                                        top: '12px',
                                    }
                                }}>
                                    <Box sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        bgcolor: index <= getOrderStatusStep(order.status) ? theme.palette.primary.main : theme.palette.divider,
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 0.5,
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                        boxShadow: index === getOrderStatusStep(order.status) ? '0 0 0 4px rgba(63, 81, 181, 0.3)' : 'none'
                                    }}>
                                        {index + 1}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: index <= getOrderStatusStep(order.status) ? theme.palette.primary.dark : theme.palette.text.secondary, fontWeight: index === getOrderStatusStep(order.status) ? 'bold' : 'normal' }}>
                                        {label}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                  </Box>


                  {/* Order Items - Collapsible */}
                  <Accordion elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: '10px !important' }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`panel${order.id}-content`}
                      id={`panel${order.id}-header`}
                      sx={{ bgcolor: theme.palette.background.default, borderRadius: '10px 10px 0 0 !important' }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Items in this Order ({order.items.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        {order.items.map((item, index) => (
                          <Card key={item.id || index} sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: '10px', boxShadow: 'none', border: '1px solid #f0f0f0' }}>
                            <CardMedia
                              component="img"
                              sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '8px', mr: 2, flexShrink: 0 }}
                              image={item.image}
                              alt={item.name}
                              onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x100?text=No+Image'; }}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                              <CardContent sx={{ flex: '1 0 auto', p: 0, '&:last-child': { pb: 0 } }}>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: theme.palette.primary.dark }}>{item.name}</Typography>
                                <Typography variant="body2" color="text.secondary">Qty: {item.qty}</Typography>
                                <Typography variant="body2" color="text.secondary">Price: ₹{item.price}</Typography>
                              </CardContent>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', pr: 1, gap: 1 }}>
                              {/* New "Buy Now" button for individual items */}
                              <Button
                                variant="contained"
                                size="small"
                                color="primary"
                                onClick={() => handleBuyNowItem(item)}
                              >
                                Buy Now
                              </Button>
                              <Button variant="outlined" size="small">Leave Review</Button>
                            </Box>
                          </Card>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  {/* Removed the "Re-order Now" button for the entire order */}
                </Paper>
              ))}
            </Stack>
          )}

          {/* PayPal Payment Dialog */}
          <Dialog
            open={showPayPalDialog}
            onClose={handleClosePayPalDialog}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                p: 2, // Padding inside the dialog paper
              }
            }}
          >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
              <Typography variant="h5" color="primary">Complete Your Purchase</Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {selectedItemToReorder && (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2, mb: 3, p: 2, border: '1px solid #eee', borderRadius: '8px', bgcolor: theme.palette.background.default }}>
                  <CardMedia
                    component="img"
                    sx={{ width: 80, height: 80, objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }}
                    image={selectedItemToReorder.image}
                    alt={selectedItemToReorder.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{selectedItemToReorder.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Qty: {selectedItemToReorder.qty} | Price: ₹{selectedItemToReorder.price}
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                    Total: ₹{(selectedItemToReorder.price * selectedItemToReorder.qty).toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
                Click the PayPal button below to finalize your payment securely.
              </Typography>
              <Box ref={paypalRef} sx={{ minHeight: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pt: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClosePayPalDialog}
                sx={{ width: '100%', maxWidth: '200px' }}
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>

        </Container>
      </Box>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </ThemeProvider>
  );
};

const App = () => {
  return <OrderPage />;
};

export default App;