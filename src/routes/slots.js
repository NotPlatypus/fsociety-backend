const express = require('express');
const router = express.Router();
const { getAvailableSlots } = require('../controllers/bookingController');

router.get('/slots', getAvailableSlots);

module.exports = router;
