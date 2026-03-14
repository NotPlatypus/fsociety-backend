require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');

const bookingRoutes = require('./src/routes/booking');
const adminRoutes = require('./src/routes/admin');
const slotsRoutes = require('./src/routes/slots');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== SECURITY =====
app.use(helmet({ contentSecurityPolicy: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please wait.' }
});

// ===== MIDDLEWARE =====
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

// ===== ROUTES =====
app.use('/api', slotsRoutes);
app.use('/api', bookingRoutes);
app.use('/api/admin', loginLimiter);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`FSociety backend running on http://localhost:${PORT}`);
  console.log(`Booking:   http://localhost:${PORT}/booking.html`);
  console.log(`Admin:     http://localhost:${PORT}/admin.html`);
});
