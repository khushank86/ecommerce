import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductPage from './pages/Productpage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/Wishlist';
import OrderPage from './pages/OrderPage';
import AddressPage from './pages/AddressPage'; // ✅ Import the new AddressPage component

// ✅ Route protection component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Protected Routes */}
      <Route
        path="/wishlist"
        element={<ProtectedRoute><WishlistPage /></ProtectedRoute>}
      />
      <Route
        path="/add-product"
        element={<ProtectedRoute><ProductPage /></ProtectedRoute>}
      />
      <Route
        path="/products/:id"
        element={<ProtectedRoute><ProductPage /></ProtectedRoute>}
      />
      <Route
        path="/cart"
        element={<ProtectedRoute><CartPage /></ProtectedRoute>}
      />
      <Route
        path="/order"
        element={<ProtectedRoute><OrderPage /></ProtectedRoute>}
      />
      {/* ✅ New Protected Route for Address Page */}
      <Route
        path="/address"
        element={<ProtectedRoute><AddressPage /></ProtectedRoute>}
      />

      {/* Fallback Route */}
      <Route path="*" element={<h2>404 - Page Not Found</h2>} />
    </Routes>
  );
}

export default App;
