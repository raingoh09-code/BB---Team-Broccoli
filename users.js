const express = require('express');
const router = express.Router();
const { users, events, communities, saveData } = require('../data/database');
const { authenticateToken } = require('../middleware/auth');

// Get all peers for matching (authenticated users only) - MUST BE BEFORE /:id
router.get('/peers/all', authenticateToken, (req, res) => {
  // Return all users except passwords
  const peersWithoutPasswords = users.map(({ password, ...user }) => user);
  res.json(peersWithoutPasswords);
});

// Send a wave to another peer
router.post('/wave', authenticateToken, (req, res) => {
  const { toPeerId, message } = req.body;
  const fromUserId = req.user.userId;
  
  const toUser = users.find(u => u.id === toPeerId);
  if (!toUser) {
    return res.status(404).json({ message: 'Peer not found' });
  }
  
  const fromUser = users.find(u => u.id === fromUserId);
  
  // Initialize waves array if it doesn't exist
  if (!toUser.waves) toUser.waves = [];
  
  // Add wave
  toUser.waves.push({
    id: Date.now().toString(),
    from: fromUserId,
    fromName: fromUser.name,
    message: message || '',
    timestamp: new Date().toISOString(),
    read: false
  });
  
  saveData();
  res.json({ message: 'Wave sent successfully!' });
});

// Get received waves
router.get('/waves', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json(user.waves || []);
});

// Get user profile
router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Update user profile
router.put('/:id', authenticateToken, (req, res) => {
  // Check if user is updating their own profile
  if (req.user.userId !== req.params.id) {
    return res.status(403).json({ message: 'You can only update your own profile' });
  }

  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { name, phone, area, bio, interests, location, age, hobbies } = req.body;

  // Update user data
  if (name) users[userIndex].name = name;
  if (phone !== undefined) users[userIndex].phone = phone;
  if (area !== undefined) users[userIndex].area = area;
  if (bio !== undefined) users[userIndex].bio = bio;
  if (interests !== undefined) users[userIndex].interests = interests;
  if (location !== undefined) users[userIndex].location = location;
  if (age !== undefined) users[userIndex].age = age;
  if (hobbies !== undefined) users[userIndex].hobbies = hobbies;

  // Save to file
  saveData();

  // Remove password from response
  const { password, ...userWithoutPassword } = users[userIndex];
  res.json(userWithoutPassword);
});

// Get user's events
router.get('/:id/events', (req, res) => {
  const userEvents = events.filter(e => 
    e.organizerId === req.params.id || e.attendees.includes(req.params.id)
  );
  res.json(userEvents);
});

// Get user's communities
router.get('/:id/communities', (req, res) => {
  const userCommunities = communities.filter(c => c.members.includes(req.params.id));
  res.json(userCommunities);
});

module.exports = router;
