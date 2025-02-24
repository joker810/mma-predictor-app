import { useState } from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom'; // Added Navigate for redirects
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Header from './component/Header';
import Predict from './component/Predict';
import Login from './component/Login';
import Register from './component/Register';
import ResetPassword from './component/ResetPassword';
import Footer from './component/Footer';
import Gallery from './component/Gallery';
import Profile from './component/Profile';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function InnerApp() {
  const { theme } = useTheme();

  return (
    <div className={`App ${theme}`}>
      <Header />
      <Routes>
        <Route path="/" element={<Predict />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/news" element={<Gallery />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /> {/* Protected route */}
      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <InnerApp />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;