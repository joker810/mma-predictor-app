import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../css/Header.css';

function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`Header ${theme}`}>
      <h1>MMA Fight Predictor</h1>
      <nav>
        <ul>
          <li><a href="/" onClick={() => handleNavigation('/')}>Home</a></li>
          <li><a href="/predict" onClick={() => handleNavigation('/predict')}>Predict</a></li>
          <li><a href="/news" onClick={() => handleNavigation('/news')}>News</a></li>
          <li>
            {user ? (
              <a href="/profile" onClick={() => handleNavigation('/profile')}>Profile</a>
            ) : (
              <a href="/login" onClick={() => handleNavigation('/login')}>Login</a>
            )}
          </li>
          {user && (
            <>
              <span className="welcome-text">
                Welcome, {user.username} | Balance: ${parseFloat(user.wallet || 0).toFixed(2)}
              </span>
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
          <li>
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;