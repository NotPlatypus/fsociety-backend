const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { sendConfirmationToUser, sendCancellationToUser } = require('../emails/templates');

const prisma = new PrismaClient();

async function loginAdmin(req, res) {
  const { username, password } = req.body;
  try {
    const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.admin = true;
    res.json({ message: 'Logged in' });
  } catch (e) {
    console.error('loginAdmin error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

function logoutAdmin(req, res) {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
}

function checkAdmin(req, res) {
  res.json({ loggedIn: !!req.session.admin });
}

async function getBookings(req, res) {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status.toUpperCase();
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    });
    res.json(bookings);
  } catch (e) {
    console.error('getBookings error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function confirmBooking(req, res) {
  try {
    const booking = await prisma.booking.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'CONFIRMED' }
    });
    sendConfirmationToUser(booking).catch(console.error);
    res.json({ message: 'Confirmed' });
  } catch (e) {
    console.error('confirmBooking error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function cancelBooking(req, res) {
  try {
    const booking = await prisma.booking.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'CANCELLED' }
    });
    sendCancellationToUser(booking).catch(console.error);
    res.json({ message: 'Cancelled' });
  } catch (e) {
    console.error('cancelBooking error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function blockDate(req, res) {
  const { date, reason } = req.body;
  try {
    await prisma.blockedDate.create({ data: { date, reason: reason || '' } });
    res.json({ message: 'Date blocked' });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Date already blocked' });
    res.status(500).json({ error: 'Server error' });
  }
}

async function unblockDate(req, res) {
  try {
    await prisma.blockedDate.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Date unblocked' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getBlockedDates(req, res) {
  try {
    const dates = await prisma.blockedDate.findMany({ orderBy: { date: 'asc' } });
    res.json(dates);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  loginAdmin, logoutAdmin, checkAdmin,
  getBookings, confirmBooking, cancelBooking,
  blockDate, unblockDate, getBlockedDates
};


//---


