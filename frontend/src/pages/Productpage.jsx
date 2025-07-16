import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField, Button, Typography, Box, CircularProgress, Card,
  CardContent, CardMedia, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, IconButton, MenuItem
} from '@mui/material';
import {
  PlusCircle, Trash2, ShoppingCart, CheckCircle2, XCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    image: '',
    category: '',
    price: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartData, setCartData] = useState(null);

  const token = localStorage.getItem('token');

  // Validate form fields
  const validate = () => {
    let temp = {};
    if (!formData.name.trim()) temp.name = 'Product name is required';
    if (!formData.tagline.trim()) temp.tagline = 'Tagline is required';
    if (!formData.description.trim()) temp.description = 'Description is required';
    if (!formData.image.trim()) {
      temp.image = 'Image URL is required';
    } else if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(formData.image)) {
      temp.image = 'Invalid image URL';
    }
    if (!formData.category.trim()) temp.category = 'Category is required';
    if (!formData.price || isNaN(formData.price) || formData.price <= 0) temp.price = 'Valid price is required';
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const fetchProductById = useCallback(async () => {
    if (!isEdit) return;
    if (!token) {
      alert('You are not logged in. Redirecting...');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await res.json();
      setFormData(data[0] || {});
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, token, navigate]);

  useEffect(() => {
    fetchProductById();
  }, [fetchProductById]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await fetch(`http://localhost:5000/products${isEdit ? `/${id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.message || 'Error occurred');
        return;
      }

      alert(result.message || 'Success');
      navigate('/dashboard');
    } catch (err) {
      alert('Something went wrong');
    }
  };

  const handleDeleteConfirm = () => {
    setOpenConfirm(true);
    setProductToDelete(id);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5000/products/${productToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Unauthorized');
      alert('Product deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete product');
    } finally {
      setOpenConfirm(false);
    }
  };

  const handleAddToCart = () => {
    const cartItem = { ...formData, paymentMode: 'To be selected during checkout' };
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = [...currentCart, cartItem];
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartData(cartItem);
    setAddedToCart(true);
    alert('Product added to cart.');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4, backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      <Card elevation={4} sx={{ p: 4, maxWidth: 600, mx: 'auto', mb: 6 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            <PlusCircle size={20} style={{ marginRight: 8 }} /> {isEdit ? 'Edit Product' : 'Add New Product'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Product Name" name="name" value={formData.name} onChange={handleChange} margin="normal" error={!!errors.name} helperText={errors.name} />
            <TextField fullWidth label="Tagline" name="tagline" value={formData.tagline} onChange={handleChange} margin="normal" error={!!errors.tagline} helperText={errors.tagline} />
            <TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleChange} multiline rows={3} margin="normal" error={!!errors.description} helperText={errors.description} />
            <TextField fullWidth label="Image URL" name="image" value={formData.image} onChange={handleChange} margin="normal" error={!!errors.image} helperText={errors.image} />
            <TextField select fullWidth label="Category" name="category" value={formData.category} onChange={handleChange} margin="normal" error={!!errors.category} helperText={errors.category}>
              <MenuItem value="">Select Category</MenuItem>
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="snack">Snack</MenuItem>
              <MenuItem value="utilities">Utilities</MenuItem>
            </TextField>
            <TextField fullWidth label="Price (₹)" name="price" type="number" value={formData.price} onChange={handleChange} margin="normal" error={!!errors.price} helperText={errors.price} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {isEdit ? 'Update Product' : 'Add Product'}
            </Button>
            <Button onClick={handleAddToCart} variant="contained" fullWidth sx={{ mt: 2, backgroundColor: 'green', color: 'white' }} startIcon={<ShoppingCart />}>
              Add to Cart
            </Button>
            {isEdit && (
              <IconButton color="error" sx={{ mt: 1, float: 'right' }} onClick={handleDeleteConfirm}>
                <Trash2 />
              </IconButton>
            )}
          </Box>
        </CardContent>

        {formData.image && (
          <CardMedia component="img" height="200" image={formData.image} alt={formData.name} sx={{ objectFit: 'contain', mt: 2 }} />
        )}
      </Card>

      {/* Delete Dialog */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this product?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <IconButton onClick={() => setOpenConfirm(false)} color="primary"><XCircle /></IconButton>
          <IconButton onClick={confirmDelete} color="error"><CheckCircle2 /></IconButton>
        </DialogActions>
      </Dialog>

      {/* Cart Summary */}
      {addedToCart && cartData && (
        <Card elevation={3} sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
          <Typography variant="h6">Cart Summary</Typography>
          <Typography>Name: {cartData.name}</Typography>
          <Typography>Tagline: {cartData.tagline}</Typography>
          <Typography>Description: {cartData.description}</Typography>
          <Typography>Category: {cartData.category}</Typography>
          <Typography>Price: ₹{cartData.price}</Typography>
          <Typography>Payment Mode: {cartData.paymentMode}</Typography>
          {cartData.image && (
            <CardMedia component="img" height="140" image={cartData.image} alt={cartData.name} sx={{ objectFit: 'contain', mt: 2 }} />
          )}
        </Card>
      )}
    </Box>
  );
};

export default ProductPage;
