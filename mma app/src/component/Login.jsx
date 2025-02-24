import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleNormalLogin = async () => {
    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Login failed');
      const data = await response.json();
      login(data.user);
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div className={`Login ${theme}`}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleNormalLogin}>Login</button>
      <div className="oauth-section">
        <button onClick={handleGoogleLogin}>Sign in with Google</button>
      </div>
      <p>Don't have an account? <a href="/register">Register</a></p>
    </div>
  );
}

export default Login;