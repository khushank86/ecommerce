import React, { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Box, Typography, Paper, IconButton, Avatar, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Drawer,
  List, ListItem, ListItemButton, Pagination, Badge, Skeleton, Rating,
  FormControl, InputLabel, Select, MenuItem as MuiMenuItem
} from '@mui/material';
import {
  Trash2, ShoppingCart, XCircle, CheckCircle2, Menu as MenuIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Slider from 'react-slick';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: '', id: '' });
  const [category, setCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');

  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const itemsPerPage = 4;
  const bannerImages = ['/banner1.jpg', '/banner2.jpg', '/banner3.jpg'];

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) setUser(storedUser);

    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    setCartCount(cartItems.length);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You are not authenticated. Redirecting to login...');
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (category !== 'All') queryParams.append('category', category);
        if (sortOrder !== 'default') queryParams.append('sort', sortOrder);

        const res = await fetch(`http://localhost:5000/products?${queryParams.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 403 || res.status === 401) {
          toast.error('Unauthorized access. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error('Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate, category, sortOrder]);

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = [...cart, { ...product, paymentMode: 'To be selected during checkout' }];
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartCount(updatedCart.length);
    toast.success(`${product.name} added to cart`);
  };

  const handleDeleteClick = (id) => {
    setProductToDelete(id);
    setOpenConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/products/${productToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter((p) => p.id !== productToDelete));
      toast.success('Product deleted successfully');
    } catch (err) {
      toast.error('Failed to delete product');
    } finally {
      setOpenConfirm(false);
    }
  };

  const handleCartClick = () => navigate('/cart');
  const handleAddProduct = () => navigate('/add-product');
  const handleUserMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.info('Logging out...');
    navigate('/login');
  };

  const paginatedProducts = products.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <Box>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2 }}>Ecommerce</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton color="inherit" onClick={handleCartClick}>
              <Badge badgeContent={cartCount} color="error">
                <ShoppingCart />
              </Badge>
            </IconButton>
            <IconButton onClick={handleUserMenuClick} sx={{ p: 0 }}>
              <Avatar>{user.name ? user.name[0].toUpperCase() : '?'}</Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleUserMenuClose}>
              <MenuItem disabled>Username: {user.name}</MenuItem>
              <MenuItem disabled>User ID: {user.id}</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/')}>Dashboard</ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleAddProduct}>Add Product</ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>Logout</ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Banner */}
      <Box sx={{ mt: 2 }}>
        <Slider dots infinite speed={800} slidesToShow={1} slidesToScroll={1} autoplay autoplaySpeed={4000}>
          {bannerImages.map((src, i) => (
            <Box key={i} sx={{ px: 2 }}>
              <img src={src} alt={`Banner ${i + 1}`} style={{
                width: '100%',
                height: '280px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }} />
            </Box>
          ))}
        </Slider>
      </Box>

      {/* Filter UI */}
      <Paper elevation={3} sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', p: 2, m: 2, borderRadius: 2, backgroundColor: '#f5f5f5'
      }}>
        <Typography variant="h6" sx={{ mb: { xs: 1, md: 0 } }}>Filter & Sort Products</Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Category</InputLabel>
            <Select value={category} onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }} label="Category">
              <MuiMenuItem value="All">All</MuiMenuItem>
              <MuiMenuItem value="Electronics">Electronics</MuiMenuItem>
              <MuiMenuItem value="snack">snack</MuiMenuItem>
              <MuiMenuItem value="utilities">Utilities</MuiMenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortOrder} onChange={(e) => {
              setSortOrder(e.target.value);
              setPage(1);
            }} label="Sort By">
              <MuiMenuItem value="default">Default</MuiMenuItem>
              <MuiMenuItem value="lowToHigh">Price: Low to High</MuiMenuItem>
              <MuiMenuItem value="highToLow">Price: High to Low</MuiMenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Products */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Products</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 3, pb: 3 }}>
          {loading ? (
            Array.from({ length: itemsPerPage }).map((_, index) => (
              <Paper key={index} elevation={4} sx={{ width: 250, p: 2, borderRadius: 2 }}>
                <Skeleton variant="rectangular" width="100%" height={180} sx={{ mb: 2 }} />
                <Skeleton width="80%" />
                <Skeleton width="60%" />
                <Skeleton width="30%" />
              </Paper>
            ))
          ) : (
            paginatedProducts.map((product) => (
              <Paper key={product.id} elevation={4} sx={{
                width: 250, p: 2, borderRadius: 2, bgcolor: '#fff',
                position: 'relative', textAlign: 'center'
              }}>
                <Box sx={{ position: 'relative', width: '100%', height: 180 }}>
                  <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute', bottom: 8, right: 8,
                      bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#115293' }
                    }}
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart size={16} />
                  </IconButton>
                </Box>
                <Typography variant="subtitle1" fontWeight="bold">{product.name}</Typography>
                <Typography variant="body2" color="text.secondary">{product.tagline}</Typography>
                <Typography variant="h6" color="green">₹{product.price || 1500}</Typography>
                <Rating value={4.3} precision={0.5} size="small" readOnly />
                <IconButton color="error" onClick={() => handleDeleteClick(product.id)}>
                  <Trash2 size={18} />
                </IconButton>
              </Paper>
            ))
          )}
        </Box>

        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={Math.ceil(products.length / itemsPerPage)}
            page={page}
            onChange={(e, value) => setPage(value)}
          />
        </Box>

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
      </Box>

      <ToastContainer position="top-right" autoClose={3000} />
    </Box>
  );
};

export default Dashboard;
