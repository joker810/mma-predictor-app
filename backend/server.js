const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
// Increase body size limit to 10MB for Base64 images
app.use(express.json({ limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // Secure: true in prod
}));

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

pool.connect((err) => {
  if (err) console.error('DB Connection Error:', err.stack);
  else console.log('DB Connected');
});

// Google OAuth initiation
app.get('/auth/google', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:5000/auth/google/callback&response_type=code&scope=email profile`;
  console.log('Redirecting to Google OAuth:', url);
  res.redirect(url);
});

// Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  console.log('Received code:', code);

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'http://localhost:5000/auth/google/callback',
      grant_type: 'authorization_code',
    });
    console.log('Token response:', tokenResponse.data);
    const { access_token } = tokenResponse.data;

    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log('User info:', userInfoResponse.data);
    const { sub: googleId, email, name, picture } = userInfoResponse.data;

    const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    let user;
    if (result.rows.length > 0) {
      user = result.rows[0];
      console.log('Existing user found:', user);
    } else {
      const insertResult = await pool.query(
        'INSERT INTO users (google_id, username, email, photo, wallet, joined) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [googleId, name, email, picture, 100.00, new Date().toISOString().split('T')[0]]
      );
      user = insertResult.rows[0];
      console.log('New user created:', user);
    }

    req.session.user = {
      id: user.id,
      google_id: user.google_id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      wallet: parseFloat(user.wallet) || 0,
      joined: user.joined
    };
    console.log('Session set:', req.session.user);
    res.redirect('http://localhost:5173/');
  } catch (err) {
    console.error('OAuth Error Details:', err.response ? err.response.data : err.message);
    res.status(500).send('OAuth error—check server logs');
  }
});

// Normal login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Use Google login or register' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    req.session.user = {
      id: user.id,
      google_id: user.google_id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      wallet: parseFloat(user.wallet) || 0,
      joined: user.joined
    };
    console.log('Normal login success:', req.session.user);
    res.json({ user: req.session.user });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register
app.post('/auth/register', async (req, res) => {
  const { username, email, phone, password } = req.body;
  try {
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertResult = await pool.query(
      'INSERT INTO users (username, email, phone, password_hash, wallet, joined) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, email, phone, passwordHash, 100.00, new Date().toISOString().split('T')[0]]
    );
    const user = insertResult.rows[0];

    req.session.user = {
      id: user.id,
      google_id: user.google_id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      photo: user.photo || 'https://via.placeholder.com/150',
      wallet: parseFloat(user.wallet) || 0,
      joined: user.joined
    };
    console.log('User registered:', req.session.user);
    res.json({ user: req.session.user });
  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Session check
app.get('/auth/session', async (req, res) => {
  if (req.session.user) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
      if (result.rows.length === 0) {
        req.session.destroy();
        return res.status(401).json({ error: 'User not found' });
      }
      const updatedUser = result.rows[0];
      req.session.user = {
        id: updatedUser.id,
        google_id: updatedUser.google_id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        photo: updatedUser.photo,
        wallet: parseFloat(updatedUser.wallet) || 0,
        joined: updatedUser.joined
      };
      console.log('Session check success:', req.session.user);
      res.json({ user: req.session.user });
    } catch (err) {
      console.error('Session Check Error:', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    console.log('No session found');
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Logout
app.post('/auth/logout', (req, res) => {
  console.log('Logging out:', req.session.user);
  req.session.destroy(() => res.sendStatus(200));
});

// Update user
app.post('/auth/update', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const updates = req.body;
  console.log('Received updates:', updates);
  try {
    const result = await pool.query(
      'UPDATE users SET email = $1, phone = $2, photo = $3, wallet = $4 WHERE id = $5 RETURNING *',
      [
        updates.email || req.session.user.email,
        updates.phone || req.session.user.phone,
        updates.photo || req.session.user.photo,
        updates.wallet !== undefined ? parseFloat(updates.wallet) : req.session.user.wallet,
        req.session.user.id
      ]
    );
    if (result.rows.length === 0) {
      throw new Error('User not found in DB');
    }
    const updatedUser = result.rows[0];
    req.session.user = {
      id: updatedUser.id,
      google_id: updatedUser.google_id,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      photo: updatedUser.photo,
      wallet: parseFloat(updatedUser.wallet) || 0,
      joined: updatedUser.joined
    };
    console.log('User updated successfully:', req.session.user);
    res.json({ user: req.session.user });
  } catch (err) {
    console.error('Update Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));