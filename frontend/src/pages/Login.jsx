import React, { useState, useEffect } from 'react';
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
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ToastContainer, toast } from 'react-toastify';
// The problematic import 'react-toastify/dist/ReactToastify.css' has been removed.
import { useNavigate, useLocation } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';

// Define a custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#6c63ff', // A vibrant purple for primary actions
    },
    secondary: {
      main: '#764ba2', // A darker purple for secondary elements
    },
    background: {
      default: '#f4f6f8', // Light grey background
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif', // Consistent font
    h5: {
      fontWeight: 700,
      color: '#333',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#555',
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
          boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(108, 99, 255, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: '#ddd',
          color: '#555',
          '&:hover': {
            borderColor: '#bbb',
            backgroundColor: '#f5f5f5',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&.Mui-focused fieldset': {
              borderColor: '#6c63ff',
              boxShadow: '0 0 0 2px rgba(108, 99, 255, 0.2)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        },
      },
    },
  },
});

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Removed the useEffect that dynamically injected the CSS, as per your request.
  // This means react-toastify will appear unstyled unless its CSS is loaded globally.

  // Check URL for 'register' query param on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('register') === 'true') {
      setIsSignUp(true);
    }
  }, [location.search]);

  const goToDashboard = () => navigate('/dashboard');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
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
        toast.success('Signup successful! Redirecting to login...');
        setTimeout(() => {
          setIsSignUp(false);
          setFormData({ name: '', email: '', password: '' });
          setErrors({});
        }, 1500);
      }
    } catch (err) {
      console.error('Login/Signup server error:', err);
      toast.error('Server error. Please try again later.');
    }
  };

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setErrors({});
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          height: '100vh',
          backgroundImage:
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
        }}
      >
        <Paper
          elevation={10}
          sx={{
            width: { xs: '95%', sm: '80%', md: '50%', lg: '35%' },
            maxWidth: '450px',
            borderRadius: 3,
            padding: { xs: 3, sm: 4 },
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img
              src="/newlogo.png"
              alt="NewIndia Shop"
              width={90}
              style={{ marginBottom: 8 }}
            />
            <Typography variant="h5" fontWeight="bold" color="primary">
              {isSignUp ? 'Create Account' : 'Welcome Back!'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSignUp ? 'Join NewIndia Shop today.' : 'Sign in to your account.'}
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
                variant="outlined"
              />
            )}
            <TextField
              margin="normal"
              fullWidth
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
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
              variant="outlined"
            />

            {!isSignUp && (
              <Link href="#" variant="body2" sx={{ display: 'block', mt: 1, mb: 2, color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                Forgot Password?
              </Link>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, mb: 1, py: 1.5 }}
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>

            <Box mt={2} textAlign="center">
              <Typography variant="body2">
                {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
                <Link component="button" onClick={toggleMode} sx={{ color: 'primary.main', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Link>
              </Typography>
            </Box>

            <Divider sx={{ my: 3, '&::before, &::after': { borderColor: 'rgba(0,0,0,0.1)' } }}>
              <Typography variant="body2" color="text.secondary">Or continue with</Typography>
            </Divider>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              sx={{
                textTransform: 'none',
                backgroundColor: '#fff',
                borderColor: '#e0e0e0',
                color: '#424242',
                py: 1.2,
                '&:hover': {
                  backgroundColor: '#f8f8f8',
                  borderColor: '#c0c0c0',
                },
              }}
            >
              Sign In With Google
            </Button>
          </Box>
        </Paper>
      </Box>
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
};

// Main App component to render LoginPage
const App = () => {
  return <LoginPage />;
};

export default App;
