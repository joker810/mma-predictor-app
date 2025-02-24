import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../css/Header.css';

function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={`Header ${theme}`}>
      <h1>MMA Fight Predictor</h1>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/">Predict</Link></li>
          <li><Link to="/news">News</Link></li>
          {user ? (
            <>
              <li>
                <Link to="/profile">
                  Profile <span className="welcome-text">Welcome, {user.username}</span>
                </Link>
              </li>
              <li><button onClick={logout}>Logout</button></li>
            </>
          ) : (
            <li><Link to="/login">Login</Link></li>
          )}
          <li><button onClick={toggleTheme}>{theme === 'light' ? 'Dark' : 'Light'} Mode</button></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;