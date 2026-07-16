const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public facing routes
router.get('/', publicController.getHome);
router.get('/about', publicController.getAbout);
router.get('/collection', publicController.getCollection);
router.get('/fabrics', publicController.getFabrics);
router.get('/tailoring', publicController.getTailoring);
router.get('/lookbook', publicController.getLookbook);
router.get('/faq', publicController.getFaq);
router.get('/terms', publicController.getTerms);
router.get('/contact', publicController.getContact);

module.exports = router;