const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/auth');

// Customer routes
router.get('/', isAuthenticated, orderController.myOrders);
router.get('/:id', isAuthenticated, orderController.orderDetail);
router.post('/', isAuthenticated, orderController.createOrder);

module.exports = router;