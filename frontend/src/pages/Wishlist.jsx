import React, { useEffect, useState } from "react";
import {
  Box, Typography, Card, CardContent, CardMedia,
  IconButton, Button, Tooltip, Chip,
  Snackbar, Alert, Skeleton
} from "@mui/material";
import { Heart, ShoppingCart } from "lucide-react";
import AssignmentTurnedIn from '@mui/icons-material/AssignmentTurnedIn';
import { useNavigate } from "react-router-dom";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const storedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlist(storedWishlist);
    fetch("http://localhost:5000/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.filter((p) => storedWishlist.includes(p.id)));
        setLoading(false);
      });

    const handleStorage = (e) => {
      if (e.key === "wishlist") {
        setLoading(true);
        const updatedWishlist = JSON.parse(e.newValue) || [];
        setWishlist(updatedWishlist);
        fetch("http://localhost:5000/products")
          .then((res) => res.json())
          .then((data) => {
            setProducts(data.filter((p) => updatedWishlist.includes(p.id)));
            setLoading(false);
          });
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
      if (JSON.stringify(currentWishlist) !== JSON.stringify(wishlist)) {
        setLoading(true);
        setWishlist(currentWishlist);
        fetch("http://localhost:5000/products")
          .then((res) => res.json())
          .then((data) => {
            setProducts(data.filter((p) => currentWishlist.includes(p.id)));
            setLoading(false);
          });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [wishlist]);

  const handleRemove = (id) => {
    const updatedWishlist = wishlist.filter((wid) => wid !== id);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    setProducts(products.filter((p) => p.id !== id));
    setSnackbar({ open: true, message: 'Removed from wishlist', severity: 'info' });
  };

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const updatedCart = [...cart, { ...product, paymentMode: "To be selected during checkout" }];
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setSnackbar({ open: true, message: `${product.name} added to cart`, severity: 'success' });
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 4 }, py: 3, bgcolor: '#f0f4f8', minHeight: '100vh' }}>
      <Box sx={{
        bgcolor: 'white', borderRadius: 4, py: 3, px: { xs: 3, sm: 6 },
        mb: 5, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Typography variant="h4" fontWeight="bold" color="#1e3a8a">
          💖 My Wishlist
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip label={`Wishlist: ${wishlist.length}`} color="secondary" sx={{ fontWeight: 'bold', fontSize: 16 }} />
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
                <Skeleton variant="text" width={120} height={32} />
                <Skeleton variant="text" width={80} height={24} />
                <Skeleton variant="rectangular" width={60} height={32} />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : products.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" fontWeight="bold" color="text.secondary">
            Your wishlist is empty.
          </Typography>
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
                    onClick={() => navigate('/cart')}
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
  );
};

export default Wishlist;
