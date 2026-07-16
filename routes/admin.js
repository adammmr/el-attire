const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All admin routes require authentication and admin role
router.use(isAuthenticated, isAdmin);

// Dashboard
router.get('/', adminController.getDashboard);
router.get('/dashboard', adminController.getDashboard);

// Page Content Management
router.get('/pages', adminController.getPages);
router.get('/pages/:id/edit', adminController.getEditPage);
router.put('/pages/:id', adminController.updatePage);

// Site Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Media Library
router.get('/media', adminController.getMedia);
router.post('/media/upload', upload.single('file'), adminController.uploadMedia);
router.delete('/media/:id', adminController.deleteMedia);

// Products Management
router.get('/products', productController.adminList);
router.get('/products/create', productController.createForm);
router.post('/products', upload.array('images', 10), productController.create);
router.get('/products/:id/edit', productController.editForm);
router.put('/products/:id', upload.array('images', 10), productController.update);
router.delete('/products/:id', productController.delete);

// Orders Management
router.get('/orders', orderController.adminList);
router.get('/orders/:id', orderController.adminDetail);
router.put('/orders/:id/status', orderController.updateStatus);
router.put('/orders/:id/assign', orderController.assignTailor);

// Customers Management
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerDetail);

module.exports = router;