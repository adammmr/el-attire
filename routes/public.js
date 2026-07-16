const express = require('express');
const router = express.Router();

// Import controllers (create these later)
const mainController = require('../controllers/mainController');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');

// ==================== MIDDLEWARE ====================

// Auth check middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Please login to access this page');
  res.redirect('/login');
};

// Guest only middleware (for login/register pages)
const isGuest = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  res.redirect('/');
};

// ==================== PUBLIC PAGES ====================

// Landing/Home page
router.get('/', (req, res) => {
  res.render('public/landing', {
    title: 'EL ATTIRE - Premium Bespoke Nigerian Tailoring',
    currentPage: 'home',
    description: 'Premium bespoke Nigerian tailoring. Handcrafted Kaftans, Agbada, and Senator styles for the modern gentleman.',
    keywords: 'Nigerian tailoring, Kaftan, Agbada, Senator, bespoke clothing',
    layout: 'layouts/main'
  });
});

// About page
router.get('/about', (req, res) => {
  res.render('public/about', {
    title: 'About Us - EL ATTIRE',
    currentPage: 'about',
    description: 'Learn about EL ATTIRE - Premium Nigerian tailoring since 2010.',
    layout: 'layouts/main'
  });
});

// Collection page
router.get('/collection', (req, res) => {
  res.render('public/collection', {
    title: 'Our Collection - EL ATTIRE',
    currentPage: 'collection',
    description: 'Browse our collection of bespoke Kaftans, Agbada, and Senator styles.',
    layout: 'layouts/main'
  });
});

// Product detail page
router.get('/product/:id', (req, res) => {
  res.render('public/product-detail', {
    title: 'Product Details - EL ATTIRE',
    currentPage: 'collection',
    productId: req.params.id,
    description: 'View product details and customization options.',
    layout: 'layouts/main'
  });
});

// Fabrics page
router.get('/fabrics', (req, res) => {
  res.render('public/fabrics', {
    title: 'Premium Fabrics - EL ATTIRE',
    currentPage: 'fabrics',
    description: 'Browse our premium fabric collection including Aso Oke, Damask, Silk, and Brocade.',
    layout: 'layouts/main'
  });
});

// Fabric detail page
router.get('/fabric/:id', (req, res) => {
  res.render('public/fabric-detail', {
    title: 'Fabric Details - EL ATTIRE',
    currentPage: 'fabrics',
    fabricId: req.params.id,
    description: 'View fabric details, pricing, and availability.',
    layout: 'layouts/main'
  });
});

// Also keep the old route for compatibility
router.get('/fabric-detail', (req, res) => {
  res.render('public/fabric-detail', {
    title: 'Fabric Details - EL ATTIRE',
    currentPage: 'fabrics',
    description: 'View fabric details, pricing, and availability.',
    layout: 'layouts/main'
  });
});

// Tailoring page
router.get('/tailoring', (req, res) => {
  res.render('public/tailoring', {
    title: 'Tailoring Services - EL ATTIRE',
    currentPage: 'tailoring',
    description: 'Expert tailoring services for Kaftans, Agbada, Senator styles, and more.',
    layout: 'layouts/main'
  });
});

// Fitting page
router.get('/fitting', (req, res) => {
  res.render('public/fitting', {
    title: 'Fitting Guide - EL ATTIRE',
    currentPage: 'fitting',
    description: 'Book a fitting appointment at our Lagos or Abuja studio.',
    layout: 'layouts/main'
  });
});

// Lookbook page
router.get('/lookbook', (req, res) => {
  res.render('public/lookbook', {
    title: 'Lookbook - EL ATTIRE',
    currentPage: 'lookbook',
    description: 'Browse our lookbook for style inspiration and latest designs.',
    layout: 'layouts/main'
  });
});

// Lookbook centerfold page
router.get('/lookbook-centerfold', (req, res) => {
  res.render('public/lookbook-centerfold', {
    title: 'Lookbook Centerfold - EL ATTIRE',
    currentPage: 'lookbook',
    description: 'Detailed view of our featured looks and styles.',
    layout: 'layouts/main'
  });
});

// FAQ page
router.get('/faq', (req, res) => {
  res.render('public/faq', {
    title: 'FAQ - EL ATTIRE',
    currentPage: 'faq',
    description: 'Frequently asked questions about our tailoring services, fabrics, and ordering process.',
    layout: 'layouts/main'
  });
});

// Terms & Conditions page
router.get('/terms', (req, res) => {
  res.render('public/terms', {
    title: 'Terms & Conditions - EL ATTIRE',
    currentPage: 'terms',
    description: 'Read our terms and conditions for using EL ATTIRE services.',
    layout: 'layouts/main'
  });
});

// Privacy Policy page (add if you have the template)
router.get('/privacy', (req, res) => {
  res.render('public/privacy', {
    title: 'Privacy Policy - EL ATTIRE',
    currentPage: 'privacy',
    description: 'Our privacy policy and how we handle your data.',
    layout: 'layouts/main'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('public/contact', {
    title: 'Contact Us - EL ATTIRE',
    currentPage: 'contact',
    description: 'Get in touch with EL ATTIRE for inquiries, bookings, and support.',
    layout: 'layouts/main'
  });
});

// ==================== AUTH PAGES ====================

// Login page
router.get('/login', isGuest, (req, res) => {
  res.render('public/login', {
    title: 'Login - EL ATTIRE',
    currentPage: 'login',
    description: 'Login to your EL ATTIRE account to manage orders and bookings.',
    layout: 'layouts/main'
  });
});

// Register page
router.get('/register', isGuest, (req, res) => {
  res.render('public/register', {
    title: 'Create Account - EL ATTIRE',
    currentPage: 'register',
    description: 'Create your EL ATTIRE account to start ordering bespoke clothing.',
    layout: 'layouts/main'
  });
});

// Forgot password page
router.get('/forgot-password', isGuest, (req, res) => {
  res.render('public/forgot-password', {
    title: 'Forgot Password - EL ATTIRE',
    currentPage: 'forgot-password',
    description: 'Reset your EL ATTIRE account password.',
    layout: 'layouts/main'
  });
});

// Reset password page
router.get('/reset-password/:token', isGuest, (req, res) => {
  res.render('public/reset-password', {
    title: 'Reset Password - EL ATTIRE',
    currentPage: 'reset-password',
    token: req.params.token,
    description: 'Set a new password for your EL ATTIRE account.',
    layout: 'layouts/main'
  });
});

// ==================== USER PAGES (PROTECTED) ====================

// User Profile
router.get('/profile', isAuthenticated, (req, res) => {
  res.render('user/profile', {
    title: 'My Profile - EL ATTIRE',
    currentPage: 'profile',
    description: 'Manage your EL ATTIRE profile and preferences.',
    layout: 'layouts/main'
  });
});

// User Orders
router.get('/orders', isAuthenticated, (req, res) => {
  res.render('user/orders', {
    title: 'My Orders - EL ATTIRE',
    currentPage: 'orders',
    description: 'View and track your orders.',
    layout: 'layouts/main'
  });
});

// Order Detail
router.get('/orders/:id', isAuthenticated, (req, res) => {
  res.render('user/order-detail', {
    title: 'Order Details - EL ATTIRE',
    currentPage: 'orders',
    orderId: req.params.id,
    description: 'View order details and status.',
    layout: 'layouts/main'
  });
});

// ==================== CART & CHECKOUT ====================

// Shopping Cart
router.get('/cart', (req, res) => {
  res.render('public/cart', {
    title: 'Shopping Cart - EL ATTIRE',
    currentPage: 'cart',
    description: 'Review items in your shopping cart.',
    layout: 'layouts/main'
  });
});

// Checkout page (requires authentication)
router.get('/checkout', isAuthenticated, (req, res) => {
  res.render('public/checkout', {
    title: 'Checkout - EL ATTIRE',
    currentPage: 'checkout',
    description: 'Complete your order securely.',
    layout: 'layouts/main'
  });
});

// ==================== AUTH ACTIONS ====================

// Handle login form submission
router.post('/login', (req, res) => {
  // TODO: Implement actual login logic
  const { email, password } = req.body;
  
  // Placeholder: Set user session directly for testing
  // In production, validate credentials against database
  req.session.user = {
    id: 'user123',
    name: 'Test User',
    email: email
  };
  
  req.flash('success', 'Welcome back!');
  res.redirect('/');
});

// Handle register form submission
router.post('/register', (req, res) => {
  // TODO: Implement actual registration logic
  const { name, email, password } = req.body;
  
  // Placeholder: Set user session directly for testing
  req.session.user = {
    id: 'user123',
    name: name,
    email: email
  };
  
  req.flash('success', 'Account created successfully! Welcome to EL ATTIRE.');
  res.redirect('/');
});

// Handle logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie('el_attire_sid');
    res.redirect('/');
  });
});

// Handle forgot password
router.post('/forgot-password', (req, res) => {
  // TODO: Implement password reset logic
  req.flash('success', 'Password reset link has been sent to your email.');
  res.redirect('/login');
});

// Handle reset password
router.post('/reset-password/:token', (req, res) => {
  // TODO: Implement password reset logic
  req.flash('success', 'Password has been reset successfully. Please login.');
  res.redirect('/login');
});

// ==================== CART ACTIONS ====================

// Add to cart
router.post('/cart/add', (req, res) => {
  // Initialize cart if it doesn't exist
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const { productId, quantity, size, color } = req.body;
  
  // Check if product already in cart
  const existingItem = req.session.cart.find(item => 
    item.productId === productId && item.size === size && item.color === color
  );
  
  if (existingItem) {
    existingItem.quantity += parseInt(quantity) || 1;
  } else {
    req.session.cart.push({
      productId,
      quantity: parseInt(quantity) || 1,
      size: size || 'custom',
      color: color || 'default',
      addedAt: new Date()
    });
  }
  
  req.flash('success', 'Item added to cart!');
  res.redirect('back');
});

// Update cart item
router.post('/cart/update', (req, res) => {
  const { productId, quantity, size, color } = req.body;
  
  if (req.session.cart) {
    const item = req.session.cart.find(item => 
      item.productId === productId && item.size === size && item.color === color
    );
    
    if (item) {
      if (parseInt(quantity) <= 0) {
        // Remove item if quantity is 0
        req.session.cart = req.session.cart.filter(item => 
          !(item.productId === productId && item.size === size && item.color === color)
        );
      } else {
        item.quantity = parseInt(quantity);
      }
    }
  }
  
  req.flash('success', 'Cart updated!');
  res.redirect('/cart');
});

// Remove from cart
router.post('/cart/remove', (req, res) => {
  const { productId, size, color } = req.body;
  
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => 
      !(item.productId === productId && item.size === size && item.color === color)
    );
  }
  
  req.flash('success', 'Item removed from cart!');
  res.redirect('/cart');
});

// ==================== API ENDPOINTS ====================

// Contact form submission
router.post('/contact', (req, res) => {
  // TODO: Implement contact form logic (save to DB, send email, etc.)
  req.flash('success', 'Thank you for your message! We will get back to you soon.');
  res.redirect('/contact');
});

// Newsletter subscription
router.post('/subscribe', (req, res) => {
  // TODO: Implement newsletter subscription
  req.flash('success', 'Successfully subscribed to our newsletter!');
  res.redirect('back');
});

// ==================== OLD API ROUTES (Keep for compatibility) ====================

// Handle login form submission (old route)
router.post('/api/login', (req, res) => {
  res.redirect('/');
});

// Handle register form submission (old route)
router.post('/api/register', (req, res) => {
  res.redirect('/login');
});

// Add to cart (old route)
router.post('/api/cart/add', (req, res) => {
  res.redirect('back');
});

module.exports = router;