import React, { useState } from 'react';
import {
  Avatar,
  Button,
  TextField,
  Paper,
  Box,
  Grid,
  Typography,
  Link,
  Divider
} from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  const goToDashboard = () => navigate('/dashboard');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = formData;

    let newErrors = {};
    if (!validateEmail(email)) newErrors.email = 'Invalid email format';
    if (!validatePassword(password))
      newErrors.password = 'Must be 8+ characters and include a special character';
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
        toast.success('Signup successful!');
        setIsSignUp(false);
        setFormData({ name: '', email: '', password: '' });
      }
    } catch (err) {
      toast.error('Server error. Try again later.');
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
        sx={{
          height: '100vh',
          backgroundImage:
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={10}
          sx={{
            width: { xs: '90%', sm: '70%', md: '35%' },
            borderRadius: 3,
            padding: 4,
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img
              src="/newlogo.png"
              alt="NewIndia Shop"
              width={90}
              style={{ marginBottom: 8 }}
            />
            <Typography variant="h5" fontWeight="bold">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Typography>
          </Box>

          <Box component="form" noValidate onSubmit={handleSubmit}>
            {isSignUp && (
              <TextField
                margin="normal"
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
              />
            )}
            <TextField
              margin="normal"
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
            />

            {!isSignUp && (
              <Link href="#" variant="body2" sx={{ display: 'block', mt: 1, mb: 2 }}>
                Forgot Password?
              </Link>
            )}

            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: '#6c63ff',
                  color: '#fff',
                  mr: 1,
                  '&:hover': { backgroundColor: '#5a52d4' },
                }}
              >
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
              {!isSignUp && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setFormData({ email: '', password: '' })}
                >
                  Cancel
                </Button>
              )}
            </Box>

            <Box mt={2} textAlign="center">
              <Typography variant="body2">
                {isSignUp ? 'Already registered?' : 'Not Registered?'}{' '}
                <Link component="button" onClick={toggleMode}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Link>
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }}>Or continue with</Divider>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              sx={{
                textTransform: 'none',
                backgroundColor: '#fff',
                borderColor: '#ddd',
                '&:hover': {
                  backgroundColor: '#f1f1f1',
                },
              }}
            >
              Sign In With Google
            </Button>
          </Box>
        </Paper>
      </Grid>
    </>
  );
};

export default LoginPage;
