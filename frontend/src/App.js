import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductPage from './pages/Productpage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/Wishlist';


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    
    <Routes>
      {/* Default: If user goes to "/", always show dashboard (public) */}
      <Route path="/" element={<Dashboard />} />

      <Route path="/login" element={<LoginPage />} />

      {/* Remove protection from /dashboard so it is public, just like / */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Wishlist route (protected, only for logged-in users) */}
      <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />

      <Route
        path="/add-product"
        element={
          <ProtectedRoute>
            <ProductPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <ProductPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />

    
  
      {/* 404 Fallback */}
      <Route path="*" element={<h2>404 - Page Not Found</h2>} />
    </Routes>
  
  );
}

export default App;
