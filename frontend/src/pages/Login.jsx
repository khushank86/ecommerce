import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  TextField,
  Paper,
  Box,
  Grid,
  Typography,
} from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { name, email, password } = formData;
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);

    let newErrors = {};
    if (!emailValid) newErrors.email = 'Invalid email format';
    if (!passwordValid)
      newErrors.password =
        'Password must be 8+ characters & include a special character';
    if (isSignUp && !name.trim()) newErrors.name = 'Name is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const endpoint = isSignUp
      ? 'http://localhost:5000/signup'
      : 'http://localhost:5000/signin';

    const payload = isSignUp ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Authentication failed');
        return;
      }

      if (!isSignUp) {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        toast.success('Login successful!');
        setTimeout(goToDashboard, 1500);
      } else {
        toast.success(result.message || 'Signup successful!');
        setIsSignUp(false);
        setFormData({ name: '', email: '', password: '' });
      }
    } catch (error) {
      toast.error('Server error. Please try again later.');
      console.error('Error:', error);
    }
  };

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setErrors({});
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Grid
        container
        component="main"
        sx={{
          height: '100vh',
          backgroundColor: '#f0f2f5',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Grid item xs={11} sm={8} md={4} component={Paper} elevation={6} square sx={{ maxWidth: 400 }}>
          <Box
            sx={{
              my: 4,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar alt="User Avatar" src="/user.jpg" sx={{ width: 100, height: 100, mb: 2 }} />
            <Typography component="h1" variant="h5">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Typography>
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              {isSignUp && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
              />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
              <Button fullWidth variant="text" onClick={toggleMode} sx={{ mt: 1 }}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default LoginPage;
