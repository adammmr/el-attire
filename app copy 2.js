require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const flash = require('connect-flash');

const app = express();

// ==================== DATABASE CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/el_attire';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected Successfully');
    
    // Clean up potentially corrupted sessions on startup
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections({ name: 'sessions' }).toArray();
      if (collections.length > 0) {
        const count = await db.collection('sessions').countDocuments();
        console.log(`📊 Found ${count} existing sessions`);
        
        // Delete sessions that might be corrupted (older than 7 days or invalid JSON)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        await db.collection('sessions').deleteMany({
          $or: [
            { expires: { $lt: sevenDaysAgo } },
            { session: { $type: 'string' } } // Remove string sessions (potentially corrupted)
          ]
        });
        console.log('🧹 Cleaned up old/corrupted sessions');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Session cleanup warning:', cleanupError.message);
    }
  })
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
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '30d' : 0,
}));

// ==================== SESSION CONFIGURATION ====================
const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    ttl: 7 * 24 * 60 * 60, // 7 days
    autoRemove: 'native',
    // Use stringify/parse for serialization to avoid corruption
    stringify: false,
  }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
  name: 'el_attire_sid',
};

// Error handler for session middleware
app.use((req, res, next) => {
  const sessionMiddleware = session(sessionConfig);
  
  sessionMiddleware(req, res, (err) => {
    if (err) {
      // If session fails, clear the session cookie and continue
      console.error('Session error:', err.message);
      res.clearCookie('el_attire_sid');
      return next();
    }
    next();
  });
});

// ==================== FLASH MESSAGES ====================
app.use(flash());

// ==================== GLOBAL MIDDLEWARE ====================
app.use((req, res, next) => {
  // User data
  res.locals.user = req.session?.user || null;
  
  // Flash messages
  res.locals.success = req.flash?.('success') || [];
  res.locals.error = req.flash?.('error') || [];
  res.locals.warning = req.flash?.('warning') || [];
  
  // Cart count
  res.locals.cartCount = req.session?.cart?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  
  // Current path
  res.locals.currentPath = req.path || '/';
  
  // Default variables
  res.locals.title = 'EL-ATTIRE';
  res.locals.currentPage = '';
  res.locals.description = 'Premium bespoke Nigerian tailoring';
  res.locals.keywords = '';
  res.locals.currentYear = new Date().getFullYear();
  res.locals.appName = 'EL-ATTIRE';
  
  next();
});

// ==================== VIEW ENGINE SETUP ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', false);
app.set('layout extractStyles', false);

// ==================== ROUTES ====================
app.use('/', require('./routes/index'));

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  if (res.headersSent) return;
  
  res.status(404).render('errors/404', {
    title: '404 - Page Not Found',
    currentPage: '',
    layout: 'layouts/main'
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:');
  console.error('  Message:', err.message);
  console.error('  Type:', err.constructor.name);
  
  if (res.headersSent) return next(err);
  
  // Clear session if it's a session error
  if (err.message?.includes('JSON') || err.message?.includes('session')) {
    res.clearCookie('el_attire_sid');
    req.session?.destroy?.();
  }
  
  res.status(err.status || 500).render('errors/500', {
    title: '500 - Server Error',
    currentPage: '',
    layout: 'layouts/main',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      type: err.constructor.name
    } : {}
  });
});

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`\n✅ EL-ATTIRE running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});

module.exports = app;