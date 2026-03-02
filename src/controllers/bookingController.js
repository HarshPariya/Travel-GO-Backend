import { body, validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Tour from '../models/Tour.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';

export const validateBooking = [
  body('tourId').isString().notEmpty(),
  body('fullName').isString().isLength({ min: 2 }),
  body('email').isEmail(),
  body('guests').isInt({ min: 1 }),
  body('date').isISO8601().toDate(),
];

export async function createBooking(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { tourId, fullName, email, phone, guests, date, notes, guestDetails } = req.body;
  const tour = await Tour.findById(tourId);
  if (!tour) return res.status(404).json({ message: 'Tour not found' });

  const totalPrice = tour.price * Number(guests || 1);

  // generate a reference code if not already generated
  const ref = `TGO-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

  // clean guest details: only include entries with name or email
  const cleanGuests = Array.isArray(guestDetails)
    ? guestDetails.filter(g => (g.name && g.name.trim()) || (g.email && g.email.trim()))
    : [];

  const bookingData = {
    tour: tour._id,
    reference: ref,
    fullName,
    email,
    phone,
    guests,
    guestDetails: cleanGuests,
    date,
    notes,
    totalPrice,
  };
  // if the user is authenticated, record it on the booking and update their history
  if (req.user && req.user._id) {
    bookingData.user = req.user._id;
  }

  let booking;
  try {
    booking = await Booking.create(bookingData);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: err.errors });
    }
    throw err; // let outer handler catch it
  }

  if (req.user && req.user._id) {
    // push to user's booking history
    const user = await User.findById(req.user._id);
    if (user) {
      user.bookingHistory.push({
        tour: tour._id,
        reference: ref,
        bookingDate: booking.createdAt,
        travelers: guests,
        guestDetails: bookingData.guestDetails || [],
        totalPrice,
        status: booking.status,
      });
      await user.save();
    }
  }

  // respond with booking and email results
  const html = `
    <h2>Booking Request Received</h2>
    <p>Hi ${fullName},</p>
    <p>Thanks for your booking request for <strong>${tour.title}</strong> on <strong>${new Date(date).toDateString()}</strong>.</p>
    <p>Guests: ${guests} | Total: ₹${totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p>Your reference number is <strong>${ref}</strong>.</p>
    <p>We will confirm your booking shortly and send a follow-up email.</p>
  `;

  const results = await Promise.allSettled([
    sendEmail({ to: email, subject: 'Your Booking Request', html }),
    sendEmail({ to: process.env.SMTP_FROM || 'no-reply@example.com', subject: 'New Booking Request', html }),
  ]);

  res.status(201).json({ booking, emailResults: results.map(r => (r.value ? r.value.previewUrl : null)) });
}

export async function listBookings(req, res) {
  const bookings = await Booking.find({}).populate('tour').sort({ createdAt: -1 });
  res.json(bookings);
}

export async function getBooking(req, res) {
  const { id } = req.params;
  const booking = await Booking.findById(id).populate('tour');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
}

export async function cancelBooking(req, res) {
  const { id } = req.params;
  const booking = await Booking.findById(id).populate('tour');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  booking.status = 'cancelled';
  await booking.save();
  res.json(booking);
}

