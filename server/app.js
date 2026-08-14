const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'swiss-bank-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);

module.exports = app;
