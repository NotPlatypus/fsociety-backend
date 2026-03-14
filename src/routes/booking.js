const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { createBooking } = require('../controllers/bookingController');
const { handleValidation } = require('../middleware/validate');

router.post('/booking', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name too short'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ min: 7 }).withMessage('Invalid phone number'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('serviceType').trim().notEmpty().withMessage('Service type is required'),
  body('date').trim().notEmpty().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Valid date is required (YYYY-MM-DD)'),
  body('time').trim().notEmpty().withMessage('Time slot is required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
], handleValidation, createBooking);

module.exports = router;
