const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { handleValidation } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const {
  loginAdmin, logoutAdmin, checkAdmin,
  getBookings, confirmBooking, cancelBooking,
  blockDate, unblockDate, getBlockedDates
} = require('../controllers/adminController');

router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').trim().notEmpty().withMessage('Password required')
], handleValidation, loginAdmin);

router.post('/logout', logoutAdmin);
router.get('/check', checkAdmin);
router.get('/bookings', requireAdmin, getBookings);
router.put('/bookings/:id/confirm', requireAdmin, confirmBooking);
router.put('/bookings/:id/cancel', requireAdmin, cancelBooking);
router.post('/block', requireAdmin, [
  body('date').trim().notEmpty().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Valid date required')
], handleValidation, blockDate);
router.delete('/block/:id', requireAdmin, unblockDate);
router.get('/blocked', requireAdmin, getBlockedDates);

module.exports = router;
