const express = require('express');
const router = express.Router();
const fabricController = require('../controllers/fabricController');

// Public route
router.get('/:slug', fabricController.fabricDetail);

module.exports = router;