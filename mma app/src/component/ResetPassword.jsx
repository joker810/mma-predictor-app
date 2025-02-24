import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../css/ResetPassword.css';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [stage, setStage] = useState('email'); // 'email' or 'otp'
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleRequestOtp = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request OTP');
      }
      alert('OTP sent to your email');
      setStage('otp');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !newPassword) {
      alert('Please enter OTP and new password');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid OTP or password reset failed');
      }
      alert('Password reset successful');
      navigate('/login');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={`ResetPassword ${theme}`}>
      <h2>Reset Password</h2>
      {stage === 'email' ? (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', fontSize: '1.2rem' }} // Larger input
          />
          <button onClick={handleRequestOtp}>Send OTP</button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', fontSize: '1.2rem' }} // Larger input
          />
          <div className="password-container">
            <input
              type={showPassword ? 'text' : 'password'} // Toggle visibility
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
          <button onClick={handleVerifyOtp}>Reset Password</button>
        </>
      )}
      <p>Back to <a href="/login">Login</a></p>
    </div>
  );
}

export default ResetPassword;