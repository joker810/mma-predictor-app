import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../css/Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const [showRePassword, setShowRePassword] = useState(false); // New state for re-entered password
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !email || !phone || !password || !rePassword) {
      alert('All fields are required');
      return;
    }
    if (password !== rePassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phone, password }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      const data = await response.json();
      login(data.user);
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={`Register ${theme}`}>
      <h2>Create Account</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        style={{ width: '100%', padding: '12px', fontSize: '1.2rem' }} // Larger input
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ width: '100%', padding: '12px', fontSize: '1.2rem' }} // Larger input
      />
      <input
        type="text"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        style={{ width: '100%', padding: '12px', fontSize: '1.2rem' }} // Larger input
      />
      <div className="password-container">
        <input
          type={showPassword ? 'text' : 'password'} // Toggle visibility
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', fontSize: '1.2rem' }} // Larger input
        />
        <label>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            style={{ marginLeft: '10px' }}
          />
          Show Password
        </label>
      </div>
      <div className="password-container">
        <input
          type={showRePassword ? 'text' : 'password'} // Toggle visibility
          placeholder="Re-enter Password"
          value={rePassword}
          onChange={(e) => setRePassword(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', fontSize: '1.2rem' }} // Larger input
        />
        <label>
          <input
            type="checkbox"
            checked={showRePassword}
            onChange={(e) => setShowRePassword(e.target.checked)}
            style={{ marginLeft: '10px' }}
          />
          Show Password
        </label>
      </div>
      <button onClick={handleRegister}>Register</button>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
}

export default Register;