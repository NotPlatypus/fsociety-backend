const { PrismaClient } = require('@prisma/client');
const { sendBookingRequestToUser, sendBookingNotificationToAdmin } = require('../emails/templates');

const prisma = new PrismaClient();

// ── FSociety Booking Configuration ───────────────────────────────
const AVAILABLE_TIMES = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const AVAILABLE_DAYS  = [1, 2, 3, 4, 5]; // Monday–Friday (0=Sun, 6=Sat)
const MIN_NOTICE_HOURS = 24;
const MAX_PER_DAY      = 10;
// ─────────────────────────────────────────────────────────────────

async function getAvailableSlots(req, res) {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Valid date required (YYYY-MM-DD)' });
  }

  try {
    // Blocked date?
    const blocked = await prisma.blockedDate.findUnique({ where: { date } });
    if (blocked) {
      return res.json({ slots: [], blocked: true, reason: blocked.reason || 'Date unavailable' });
    }

    // Minimum notice check
    const requestedDate = new Date(date + 'T00:00:00');
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + MIN_NOTICE_HOURS);
    if (requestedDate < minDate) {
      return res.json({ slots: [], blocked: true, reason: `Booking requires ${MIN_NOTICE_HOURS}h advance notice` });
    }

    // Day of week check
    const dayOfWeek = requestedDate.getDay();
    if (!AVAILABLE_DAYS.includes(dayOfWeek)) {
      return res.json({ slots: [], blocked: true, reason: 'We are closed on weekends' });
    }

    // Get existing bookings
    const existing = await prisma.booking.findMany({
      where: { date, status: { not: 'CANCELLED' } },
      select: { time: true }
    });
    const bookedTimes = existing.map(b => b.time);

    // Check daily max
    if (bookedTimes.length >= MAX_PER_DAY) {
      return res.json({ slots: [], blocked: true, reason: 'No more slots available for this day' });
    }

    const slots = AVAILABLE_TIMES.map(time => ({
      time,
      available: !bookedTimes.includes(time)
    }));

    res.json({ slots, blocked: false });
  } catch (e) {
    console.error('getAvailableSlots error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createBooking(req, res) {
  const { name, email, phone, address, serviceType, date, time, notes } = req.body;

  try {
    // Race condition guard
    const conflict = await prisma.booking.findFirst({
      where: { date, time, status: { not: 'CANCELLED' } }
    });
    if (conflict) {
      return res.status(409).json({ error: 'That time slot is no longer available.' });
    }

    // Daily max guard
    const dayCount = await prisma.booking.count({
      where: { date, status: { not: 'CANCELLED' } }
    });
    if (dayCount >= MAX_PER_DAY) {
      return res.status(409).json({ error: 'No more bookings available for that day.' });
    }

    const booking = await prisma.booking.create({
      data: { name, email, phone, address, serviceType, date, time, notes: notes || '' }
    });

    sendBookingRequestToUser(booking).catch(console.error);
    sendBookingNotificationToAdmin(booking).catch(console.error);

    res.status(201).json({ message: 'Booking created successfully!', id: booking.id });
  } catch (e) {
    console.error('createBooking error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAvailableSlots, createBooking };
