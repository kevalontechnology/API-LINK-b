require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.', code: 'RATE_LIMIT' }
});
app.use(limiter);

// Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Router
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tapzy Outreach CRM API is online',
    timestamp: new Date().toISOString()
  });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect Database & Start Listening
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[Tapzy CRM Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  });
}

module.exports = app;
