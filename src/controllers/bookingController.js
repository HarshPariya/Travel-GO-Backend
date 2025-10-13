import { body, validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Tour from '../models/Tour.js';
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

  const { tourId, fullName, email, phone, guests, date, notes } = req.body;
  const tour = await Tour.findById(tourId);
  if (!tour) return res.status(404).json({ message: 'Tour not found' });

  const totalPrice = tour.price * Number(guests || 1);
  const booking = await Booking.create({
    tour: tour._id,
    fullName,
    email,
    phone,
    guests,
    date,
    notes,
    totalPrice,
  });

  const html = `
    <h2>Booking Request Received</h2>
    <p>Hi ${fullName},</p>
    <p>Thanks for your booking request for <strong>${tour.title}</strong> on <strong>${new Date(date).toDateString()}</strong>.</p>
    <p>Guests: ${guests} | Total: ₹${totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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

