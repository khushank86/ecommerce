import React, { useEffect, useState } from "react";
import {
  Box, Typography, Card, CardContent, CardMedia,
  IconButton, Button, Tooltip, Chip,
  Snackbar, Alert, Skeleton
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles"; // Import for theming
import { Heart, ShoppingCart } from "lucide-react";
import AssignmentTurnedIn from '@mui/icons-material/AssignmentTurnedIn';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; // This line will still cause the compilation error if build environment is not configured

// Define a custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue
    },
    secondary: {
      main: '#dc004e', // Red for errors/accents
    },
    background: {
      default: '#f0f4f8', // Light background for the page
      paper: '#ffffff', // White for cards and containers
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h4: {
      fontWeight: 700,
      color: '#1a237e', // Darker blue for headings
    },
    h6: {
      fontWeight: 600,
      color: '#333',
    },
    body1: {
      fontSize: '1rem',
      color: '#555',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#777',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s ease-in-out',
        },
        contained: {
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: '#ccc',
          color: '#555',
          '&:hover': {
            borderColor: '#999',
            backgroundColor: '#f0f0f0',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px', // More rounded corners
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', // Softer, wider shadow
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-8px)', // More pronounced lift on hover
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)', // Stronger shadow on hover
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)', // Slight scale on icon hover
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 'bold',
          fontSize: '0.9rem',
          padding: '4px 8px',
          borderRadius: '6px',
        },
      },
    },
  },
});


const Wishlist = () => {
  const [wishlistIds, setWishlistIds] = useState([]); // Store only IDs from localStorage
  const [products, setProducts] = useState([]); // Store full product objects fetched from backend
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  // Function to fetch products based on wishlist IDs from backend
  const fetchWishlistProducts = async (ids) => {
    if (!ids || ids.length === 0) {
      setProducts([]); // Clear products if wishlist is empty
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token'); // Get token for authentication
      if (!token) {
        setSnackbar({ open: true, message: 'Authentication required to view wishlist.', severity: 'error' });
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/products/by-ids?ids=${ids.join(",")}`, {
        headers: {
          'Authorization': `Bearer ${token}`, // Include the token
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch wishlist products.');
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching wishlist products:", err);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
      setProducts([]); // Clear products on error
    } finally {
      setLoading(false);
    }
  };

  // Initial load and listener for localStorage changes
  useEffect(() => {
    setLoading(true);
    const storedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlistIds(storedWishlist); // Set the IDs from localStorage
    fetchWishlistProducts(storedWishlist); // Fetch products based on these IDs

    // Listener for changes in localStorage from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === "wishlist") {
        setLoading(true);
        const updatedWishlist = JSON.parse(e.newValue) || [];
        setWishlistIds(updatedWishlist);
        fetchWishlistProducts(updatedWishlist);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []); // Run once on mount

  // Polling to detect wishlist changes (less critical if using storage event, but good for robustness)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
      // Only re-fetch if the wishlist IDs in localStorage have actually changed
      if (JSON.stringify(currentWishlist) !== JSON.stringify(wishlistIds)) {
        setWishlistIds(currentWishlist);
        fetchWishlistProducts(currentWishlist);
      }
    }, 1000); // Check every second
    return () => clearInterval(interval);
  }, [wishlistIds]); // Re-run if wishlistIds state changes

  // Handle removing an item from wishlist (frontend and backend)
  const handleRemove = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSnackbar({ open: true, message: 'Please log in to manage wishlist.', severity: 'warning' });
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/wishlist/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove from wishlist.');
      }

      // Update local state and localStorage after successful backend removal
      const updatedWishlistIds = wishlistIds.filter((wid) => wid !== id);
      setWishlistIds(updatedWishlistIds);
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlistIds));
      setProducts(products.filter((p) => p.id !== id)); // Remove product from displayed list immediately
      setSnackbar({ open: true, message: 'Removed from wishlist', severity: 'info' });
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  // Handle adding an item to cart (local storage only)
  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const updatedCart = [...cart, { ...product, quantity: 1, paymentMode: "To be selected during checkout" }]; // Ensure quantity is set
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setSnackbar({ open: true, message: `${product.name} added to cart`, severity: 'success' });
  };

  // Handle "Order Now" button click
  const handleOrderNow = (product) => {
    handleAddToCart(product); // Add to cart first
    navigate('/order'); // Then navigate to order page
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 3, bgcolor: theme.palette.background.default, minHeight: '100vh' }}>
        <Box sx={{
          bgcolor: theme.palette.background.paper, borderRadius: 4, py: 3, px: { xs: 3, sm: 6 },
          mb: 5, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2
        }}>
          <Typography variant="h4" fontWeight="bold" color={theme.palette.primary.main}>
            💖 My Wishlist
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label={`Items: ${products.length}`} color="secondary" sx={{ fontWeight: 'bold', fontSize: 16 }} />
            <Button variant="contained" color="primary" size="medium" onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
          </Box>
        </Box>

        {/* Snackbar for feedback */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={1800}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 4 }}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} sx={{ borderRadius: 4, boxShadow: '0 6px 20px rgba(0,0,0,0.08)', minHeight: 320 }}>
                <Skeleton variant="rectangular" height={180} sx={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
                <CardContent>
                  <Skeleton variant="text" width="70%" height={32} />
                  <Skeleton variant="text" width="50%" height={24} />
                  <Skeleton variant="rectangular" width="40%" height={32} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8, p: 3, bgcolor: theme.palette.background.paper, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Typography variant="h5" fontWeight="bold" color="text.secondary" sx={{ mb: 3 }}>
              Your wishlist is empty.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Start adding some items to save them for later!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ py: 1.5, px: 4, borderRadius: 2 }}
              onClick={() => navigate('/')}
            >
              Browse Products
            </Button>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 4
          }}>
            {products.map((product) => (
              <Card key={product.id}
                sx={{
                  borderRadius: 4,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <CardMedia
                  component="img"
                  image={product.image}
                  alt={product.name}
                  sx={{
                    height: 180,
                    objectFit: 'contain',
                    background: '#fff',
                    p: 2,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16
                  }}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/180x180/CCCCCC/FFFFFF?text=No+Image'; }} // Fallback image
                />
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {product.tagline}
                  </Typography>
                  <Chip label={`₹${product.price}`} color="success" sx={{ fontWeight: 'bold' }} />
                </CardContent>

                <Box sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  <Tooltip title="Remove from Wishlist" arrow>
                    <IconButton
                      onClick={() => handleRemove(product.id)}
                      sx={{
                        bgcolor: '#fff', border: '1px solid #e57373', color: '#e53935',
                        '&:hover': { bgcolor: '#ffeaea' }
                      }}
                    >
                      <Heart size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add to Cart" arrow>
                    <IconButton
                      onClick={() => handleAddToCart(product)}
                      sx={{
                        bgcolor: '#1976d2', color: '#fff',
                        '&:hover': { bgcolor: '#115293' }
                      }}
                    >
                      <ShoppingCart size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Order Now" arrow>
                    <IconButton
                      onClick={() => handleOrderNow(product)}
                      sx={{
                        bgcolor: '#fff', border: '1px solid #1976d2', color: '#1976d2',
                        '&:hover': { bgcolor: '#e3f2fd' }
                      }}
                    >
                      <AssignmentTurnedIn fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default Wishlist;
