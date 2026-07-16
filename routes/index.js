const express = require('express');
const router = express.Router();
const path = require('path');

// ==================== PUBLIC PAGES ====================

// Landing/Home page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'landing.html'));
});

// About page
router.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'about.html'));
});

// Collection page
router.get('/collection', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'collection.html'));
});

// Product detail page
router.get('/product/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'product-detail.html'));
});

// Fabrics page
router.get('/fabrics', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'fabrics.html'));
});

// Fabric detail page
router.get('/fabric-detail', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'fabric-detail.html'));
});

// Tailoring page
router.get('/tailoring', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'tailoring.html'));
});

// Fitting page
router.get('/fitting', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'fitting.html'));
});

// Lookbook page
router.get('/lookbook', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'lookbook.html'));
});

// Lookbook centerfold page
router.get('/lookbook-centerfold', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'lookbook-centerfold.html'));
});

// FAQ page
router.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'faq.html'));
});

// Terms page
router.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'terms.html'));
});

// Privacy page (if exists)
router.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'terms.html'));
});

// Contact page
router.get('/contact', (req, res) => {
    // If you have a contact page, use it; otherwise redirect to about
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'about.html'));
});

// ==================== AUTH PAGES ====================

// Login page
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'login.html'));
});

// Register page
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'register.html'));
});

// Registration copy page
router.get('/registration', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'registration copy.html'));
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'forgot-password.html'));
});

// Reset password page
router.get('/reset-password/:token', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'reset-password.html'));
});

// ==================== CART & CHECKOUT ====================

// Cart page (redirect to checkout if no cart page)
router.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'checkout.html'));
});

// Checkout page
router.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public_pages', 'checkout.html'));
});

// ==================== USER DASHBOARD PAGES ====================

// User Dashboard - Home
router.get('/user/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'user_home', 'dashboard.html'));
});

// User Dashboard - Shop
router.get('/user/shop', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'user_home', 'shop.html'));
});

// User Dashboard - Orders
router.get('/user/orders', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'user_home', 'orders.html'));
});

// User Dashboard - Tailoring
router.get('/user/tailoring', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'user_home', 'tailoring.html'));
});

// User Dashboard - Fitting
router.get('/user/fitting', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'user_home', 'fitting.html'));
});

// User Dashboard - Measurements
router.get('/user/measurements', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'user_home', 'measurements.html'));
});

// User Dashboard - Profile
router.get('/user/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'user_home', 'profile.html'));
});

// User Dashboard - Reviews
router.get('/user/reviews', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'user_home', 'reviews.html'));
});

// User Dashboard - Support
router.get('/user/support', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'user_home', 'support.html'));
});

// ==================== AUTH ACTIONS ====================

// Handle login
router.post('/login', (req, res) => {
    // Placeholder - will implement later
    res.redirect('/user/dashboard');
});

// Handle register
router.post('/register', (req, res) => {
    // Placeholder - will implement later
    res.redirect('/user/dashboard');
});

// Handle logout
router.get('/logout', (req, res) => {
    // Placeholder - will implement later
    res.redirect('/');
});

// ==================== CART ACTIONS ====================

// Add to cart
router.post('/cart/add', (req, res) => {
    // Placeholder - will implement later
    res.redirect('back');
});

module.exports = router;