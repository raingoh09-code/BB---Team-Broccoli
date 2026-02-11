const express = require('express');
const { communities, saveData } = require('../data/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(communities);
});

router.get('/:id', (req, res) => {
  const community = communities.find(c => c.id === req.params.id);
  if (!community) {
    return res.status(404).json({ message: 'Community not found' });
  }

  res.json(community);
});

router.post('/', authenticateToken, (req, res) => {
  const { name, description, category, location } = req.body;

  if (!name || !description || !category || !location) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  const newCommunity = {
    id: Date.now().toString(),
    name,
    description,
    category,
    location,
    organizerId: req.user.userId,
    members: [req.user.userId],
    createdAt: new Date().toISOString()
  };

  communities.push(newCommunity);
  saveData();

  res.status(201).json(newCommunity);
});

router.post('/:id/join', authenticateToken, (req, res) => {
  const community = communities.find(c => c.id === req.params.id);
  if (!community) {
    return res.status(404).json({ message: 'Community not found' });
  }

  const userId = req.user.userId;
  if (community.members.includes(userId)) {
    return res.status(400).json({ message: 'Already a member of this community' });
  }

  community.members.push(userId);
  saveData();

  res.json({ message: 'Joined community', community });
});

router.post('/:id/leave', authenticateToken, (req, res) => {
  const community = communities.find(c => c.id === req.params.id);
  if (!community) {
    return res.status(404).json({ message: 'Community not found' });
  }

  const userId = req.user.userId;
  if (!community.members.includes(userId)) {
    return res.status(400).json({ message: 'You are not a member of this community' });
  }

  community.members = community.members.filter(id => id !== userId);
  saveData();

  res.json({ message: 'Left community', community });
});

module.exports = router;
