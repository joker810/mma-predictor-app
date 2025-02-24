const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const session = require('express-session');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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

// Email transporter (unchanged)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Google OAuth initiation (unchanged)
app.get('/auth/google', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:5000/auth/google/callback&response_type=code&scope=email profile`;
  console.log('Redirecting to Google OAuth:', url);
  res.redirect(url);
});

// Google OAuth callback (unchanged)
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

// Normal login (unchanged)
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

// Register (unchanged)
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

// Request OTP for password reset (unchanged)
app.post('/auth/request-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await pool.query(
      'UPDATE users SET otp = $1, otp_expiry = $2 WHERE email = $3',
      [otp, expiry, email]
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP for MMA Fight Predictor',
      text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP sent to:', email);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('OTP Request Error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and reset password (unchanged)
app.post('/auth/verify-otp', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const user = result.rows[0];
    if (!user.otp || user.otp !== otp || new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, otp = NULL, otp_expiry = NULL WHERE email = $2',
      [passwordHash, email]
    );

    console.log('Password reset for:', email);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('OTP Verify Error:', err.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Session check (unchanged)
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

// Logout (unchanged)
app.post('/auth/logout', (req, res) => {
  console.log('Logging out:', req.session.user);
  req.session.destroy(() => res.sendStatus(200));
});

// Update user (unchanged)
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

// Fetch fights (updated to ensure mock works)
app.get('/api/fights', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const mockFights = [
      {
        id: 1,
        fighter1: {
          name: 'Conor McGregor',
          wins: 22,
          kos: 19,
          height: 69,
          takedowns: 1,
          submissions: 1,
          strikingAccuracy: 49,
          reach: 74,
          weight: 155,
          photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Conor_McGregor_2018.jpg/320px-Conor_McGregor_2018.jpg'
        },
        fighter2: {
          name: 'Khabib Nurmagomedov',
          wins: 29,
          kos: 8,
          height: 70,
          takedowns: 59,
          submissions: 11,
          strikingAccuracy: 47,
          reach: 70,
          weight: 155,
          photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Khabib_Nurmagomedov.png/320px-Khabib_Nurmagomedov.png'
        }
      },
      {
        id: 2,
        fighter1: {
          name: 'Jon Jones',
          wins: 27,
          kos: 10,
          height: 75,
          takedowns: 12,
          submissions: 7,
          strikingAccuracy: 55,
          reach: 84,
          weight: 205,
          photo: 'https://example.com/jon-jones.jpg'
        },
        fighter2: {
          name: 'Daniel Cormier',
          wins: 22,
          kos: 7,
          height: 71,
          takedowns: 15,
          submissions: 4,
          strikingAccuracy: 52,
          reach: 72,
          weight: 205,
          photo: 'https://example.com/daniel-cormier.jpg'
        }
      }
    ];

    // Insert or update mock fights in DB
    await pool.query('DELETE FROM fights'); // Clear old fights
    for (const fight of mockFights) {
      await pool.query(
        'INSERT INTO fights (id, fighter1_json, fighter2_json) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
        [fight.id, JSON.stringify(fight.fighter1), JSON.stringify(fight.fighter2)]
      );
    }

    res.json(mockFights);
  } catch (err) {
    console.error('Fights API Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch fights' });
  }
});

// Place bet (unchanged, secure backend betting)
app.post('/auth/place-bet', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const { fightId, fighterChoice, amount } = req.body;
  const user = req.session.user;
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  if (parsedAmount > user.wallet) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  // Fetch fight data from DB
  const fightResult = await pool.query('SELECT * FROM fights WHERE id = $1', [fightId]);
  if (!fightResult.rows.length) {
    return res.status(404).json({ error: 'Fight not found' });
  }

  const fight = fightResult.rows[0];
  const fighter1 = JSON.parse(fight.fighter1_json);
  const fighter2 = JSON.parse(fight.fighter2_json);

  // Calculate predicted winner (your odds logic)
  const calculateWinner = (f1, f2) => {
    const score1 = f1.wins * 0.15 + f1.kos * 0.2 + f1.height * 0.1 + f1.takedowns * 0.15 + f1.submissions * 0.15 + f1.strikingAccuracy * 0.05 + f1.reach * 0.1 + f1.weight * 0.05;
    const score2 = f2.wins * 0.15 + f2.kos * 0.2 + f2.height * 0.1 + f2.takedowns * 0.15 + f2.submissions * 0.15 + f2.strikingAccuracy * 0.05 + f2.reach * 0.1 + f2.weight * 0.05;
    return score1 > score2 ? f1.name : f2.name;
  };

  const predictedWinner = calculateWinner(fighter1, fighter2);
  const userWon = fighterChoice === predictedWinner;
  const newWallet = userWon ? user.wallet + parsedAmount * 1.5 : user.wallet - parsedAmount;

  // Update wallet and log bet
  await pool.query(
    'UPDATE users SET wallet = $1 WHERE id = $2',
    [newWallet, user.id]
  );
  await pool.query(
    'INSERT INTO bet_history (user_id, fight_id, fighter_choice, amount, outcome) VALUES ($1, $2, $3, $4, $5)',
    [user.id, fightId, fighterChoice, parsedAmount, userWon ? 'win' : 'loss']
  );

  req.session.user.wallet = newWallet;
  res.json({ message: userWon ? `You won $${parsedAmount * 1.5}!` : `You lost $${parsedAmount}.`, wallet: newWallet });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));