import React from 'react';
import { useTheme } from '../context/ThemeContext';
import '../css/Footer.css';

function Footer() {
  const { theme } = useTheme();

  return (
    <footer className={`Footer ${theme}`}>
      <p>© 2025 MMA Fight Predictor. All rights reserved.</p>
      <nav>
        <ul>
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
          <li><a href="#">Privacy</a></li>
        </ul>
      </nav>
    </footer>
  );
}

export default Footer;