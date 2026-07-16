require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();

// ==================== DATABASE CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/el_attire';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });

// ==================== SECURITY & PERFORMANCE ====================
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors());
app.use(compression());
app.use(morgan('dev'));

// ==================== BODY PARSING ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(methodOverride('_method'));

// ==================== STATIC FILES ====================
// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '30d' : 0,
}));

// Serve the views/public_pages as static for assets
app.use('/photos', express.static(path.join(__dirname, '..', 'photos')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// ==================== SESSION (Simplified) ====================
app.use(session({
  secret: process.env.SESSION_SECRET || 'el-attire-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  }
}));

// ==================== GLOBAL MIDDLEWARE ====================
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.cartCount = req.session?.cart?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  res.locals.currentPath = req.path || '/';
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// ==================== ROUTES ====================
app.use('/', require('./routes/index'));

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Page Not Found</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p class="text-gray-500 mb-6">Page not found</p>
        <a href="/" class="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600">Go Home</a>
      </div>
    </body>
    </html>
  `);
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  
  if (res.headersSent) return next(err);
  
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>500 - Server Error</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-300 mb-4">500</h1>
        <p class="text-gray-500 mb-6">Something went wrong</p>
        <a href="/" class="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600">Go Home</a>
      </div>
    </body>
    </html>
  `);
});

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n✅ EL-ATTIRE running on http://localhost:${PORT}`);
  console.log(`   Mode: HTML files (no EJS)\n`);
});

module.exports = app;