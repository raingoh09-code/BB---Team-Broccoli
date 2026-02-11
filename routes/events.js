const express = require('express');
const { events, saveData } = require('../data/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { category, search } = req.query;
  let filtered = events;

  if (category) {
    filtered = filtered.filter(event => event.category === category);
  }

  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(event =>
      event.title.toLowerCase().includes(term) ||
      event.description.toLowerCase().includes(term)
    );
  }

  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  res.json(event);
});

router.post('/', authenticateToken, (req, res) => {
  const { title, description, date, time, location, category, maxAttendees } = req.body;

  if (!title || !description || !date || !time || !location || !category) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  const newEvent = {
    id: Date.now().toString(),
    title,
    description,
    date,
    time,
    location,
    category,
    maxAttendees: maxAttendees ? Number(maxAttendees) : null,
    organizerId: req.user.userId,
    attendees: [],
    createdAt: new Date().toISOString()
  };

  events.push(newEvent);
  saveData();

  res.status(201).json(newEvent);
});

router.post('/:id/rsvp', authenticateToken, (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  const userId = req.user.userId;
  if (event.attendees.includes(userId)) {
    return res.status(400).json({ message: 'Already RSVP\'d to this event' });
  }

  if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
    return res.status(400).json({ message: 'Event is full' });
  }

  event.attendees.push(userId);
  saveData();

  res.json({ message: 'RSVP successful', event });
});

router.delete('/:id/rsvp', authenticateToken, (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  const userId = req.user.userId;
  if (!event.attendees.includes(userId)) {
    return res.status(400).json({ message: 'You have not RSVP\'d to this event' });
  }

  event.attendees = event.attendees.filter(id => id !== userId);
  saveData();

  res.json({ message: 'RSVP cancelled', event });
});

module.exports = router;
