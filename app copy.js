require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();

// Database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/el_attire')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// Security & Performance
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(morgan('combined')); 

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(methodOverride('_method'));

// Static files with caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '30d' : 0
}));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'el-attire-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb+srv://adamahmad:Malammadorikfada123@cluster0.2svvk.mongodb.net/el_attire?retryWrites=true&w=majority&appName=Cluster0',
    ttl: 7 * 24 * 60 * 60
  }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Global middleware
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  res.locals.cartCount = req.session.cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  delete req.session.success;
  delete req.session.error;
  next();
});

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Routes - Single index router
app.use('/', require('./routes/index'));

// 404
app.use((req, res) => {
  res.status(404).render('public/404', {
    title: 'Page Not Found',
    layout: 'layouts/main'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).render('public/500', {
    title: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
    layout: 'layouts/main'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EL-ATTIRE running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});