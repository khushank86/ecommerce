import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  Divider,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Skeleton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      const updated = storedCart.map(item => ({ ...item, quantity: item.quantity || 1 }));
      setCartItems(updated);
      setLoading(false);
    }, 800); // Simulates loading
  }, []);

  const handleBuyNow = () => {
    alert('Redirecting to checkout or payment gateway...');
  };

  const handleRemoveItem = (id) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartItems(updatedCart);
  };

  const handleQuantityChange = (id, newQty) => {
    const updatedCart = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQty } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  if (!loading && !cartItems.length) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h5">🛒 Your cart is empty</Typography>
        <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
          Go Back to Products
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>🛍️ Your Cart</Typography>

      {(loading ? Array.from({ length: 2 }) : cartItems).map((item, index) => (
        <Card key={item?.id || index} sx={{ display: 'flex', p: 2, mb: 3, alignItems: 'flex-start' }}>
          {loading ? (
            <Skeleton variant="rectangular" width={300} height={250} sx={{ mr: 3 }} />
          ) : (
            <CardMedia
              component="img"
              image={item.image}
              alt={item.name}
              sx={{ width: 300, height: 250, objectFit: 'contain', mr: 3 }}
            />
          )}

          <CardContent sx={{ flex: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              {loading ? (
                <Skeleton variant="text" width="50%" height={35} />
              ) : (
                <>
                  <Typography variant="h5">{item.name}</Typography>
                  <IconButton onClick={() => handleRemoveItem(item.id)} color="error">
                    <Trash2 />
                  </IconButton>
                </>
              )}
            </Box>

            {loading ? (
              <>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="rectangular" width={80} height={28} sx={{ mt: 2 }} />
                <Skeleton variant="text" width="25%" sx={{ mt: 2 }} />
                <Skeleton variant="rectangular" width={70} height={28} sx={{ mt: 2 }} />
                <Skeleton variant="text" width="40%" sx={{ mt: 2 }} />
              </>
            ) : (
              <>
                <Typography variant="subtitle1" color="text.secondary">{item.tagline}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" sx={{ mb: 2 }}>{item.description}</Typography>
                <Chip label="✅ In Stock" color="success" sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography><b>Color:</b></Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: 'black', borderRadius: '50%' }} />
                    <Box sx={{ width: 20, height: 20, bgcolor: 'gray', borderRadius: '50%' }} />
                    <Box sx={{ width: 20, height: 20, bgcolor: 'navy', borderRadius: '50%' }} />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography><b>Quantity:</b></Typography>
                  <FormControl size="small">
                    <Select
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    >
                      {[1, 2, 3, 4, 5].map((q) => (
                        <MenuItem key={q} value={q}>{q}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Typography variant="h6" color="green" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ₹{(item.price || 1500) * item.quantity}
                </Typography>
                <Typography variant="body2"><b>Payment Mode:</b> {item.paymentMode}</Typography>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {!loading && (
        <Box display="flex" gap={2} mt={4}>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#3f51b5', color: 'white' }}
            onClick={handleBuyNow}
            fullWidth
          >
            Proceed to Buy ({cartItems.length} {cartItems.length > 1 ? 'items' : 'item'})
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/dashboard')}
            fullWidth
          >
            Continue Shopping
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CartPage;
