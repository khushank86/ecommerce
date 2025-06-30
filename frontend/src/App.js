import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductPage from './pages/Productpage';
import CartPage from './pages/CartPage';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/add-product" element={<ProductPage />} />
      <Route path="/products/:id" element={<ProductPage />} />
      <Route path="*" element={<h2>404 - Page Not Found</h2>} />
      <Route path="/cart" element={<CartPage />} />

    </Routes>
  );
}

export default App;
