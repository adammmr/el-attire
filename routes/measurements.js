const express = require('express');
const router = express.Router();
const measurementController = require('../controllers/measurementController');
const { isAuthenticated } = require('../middleware/auth');

// All measurement routes require authentication
router.use(isAuthenticated);

// User measurement routes
router.get('/', measurementController.getMyMeasurements);
router.post('/', measurementController.create);
router.put('/:id', measurementController.update);
router.delete('/:id', measurementController.delete);
router.put('/:id/default', measurementController.setDefault);
router.get('/compare/:id1/:id2', measurementController.compare);
router.get('/style/:style', measurementController.getForStyle);
router.get('/export', measurementController.exportMeasurements);

// Admin/Tailor routes
router.post('/professional/:userId', measurementController.professionalMeasure);

module.exports = router;