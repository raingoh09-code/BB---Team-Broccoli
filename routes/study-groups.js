const express = require('express');
const router = express.Router();
const { saveData } = require('../data/database');
const { authenticateToken } = require('../middleware/auth');

// Load study groups data
const fs = require('fs');
const path = require('path');

const studyGroupsPath = path.join(__dirname, '../data/study-groups.json');

// Initialize study groups file if it doesn't exist
if (!fs.existsSync(studyGroupsPath)) {
  fs.writeFileSync(studyGroupsPath, JSON.stringify([], null, 2));
}

function getStudyGroups() {
  const data = fs.readFileSync(studyGroupsPath, 'utf8');
  return JSON.parse(data);
}

function saveStudyGroups(groups) {
  fs.writeFileSync(studyGroupsPath, JSON.stringify(groups, null, 2));
}

// Get all study groups
router.get('/', authenticateToken, (req, res) => {
  const groups = getStudyGroups();
  res.json(groups);
});

// Get a specific study group
router.get('/:id', authenticateToken, (req, res) => {
  const groups = getStudyGroups();
  const group = groups.find(g => g.id === req.params.id);
  
  if (!group) {
    return res.status(404).json({ message: 'Study group not found' });
  }
  
  res.json(group);
});

// Create a new study group
router.post('/', authenticateToken, (req, res) => {
  const { name, description, subject, maxMembers, schedule } = req.body;
  const userId = req.user.userId;
  
  if (!name || !description || !subject) {
    return res.status(400).json({ message: 'Name, description, and subject are required' });
  }
  
  const groups = getStudyGroups();
  
  const newGroup = {
    id: Date.now().toString(),
    name,
    description,
    subject,
    maxMembers: maxMembers || 10,
    schedule: schedule || '',
    createdBy: userId,
    members: [userId],
    createdAt: new Date().toISOString(),
    posts: [],
    meetings: []
  };
  
  groups.push(newGroup);
  saveStudyGroups(groups);
  
  res.status(201).json(newGroup);
});

// Join a study group
router.post('/:id/join', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const groups = getStudyGroups();
  const groupIndex = groups.findIndex(g => g.id === req.params.id);
  
  if (groupIndex === -1) {
    return res.status(404).json({ message: 'Study group not found' });
  }
  
  const group = groups[groupIndex];
  
  // Check if already a member
  if (group.members.includes(userId)) {
    return res.status(400).json({ message: 'You are already a member of this group' });
  }
  
  // Check if group is full
  if (group.members.length >= group.maxMembers) {
    return res.status(400).json({ message: 'This study group is full' });
  }
  
  group.members.push(userId);
  saveStudyGroups(groups);
  
  res.json({ message: 'Successfully joined the study group', group });
});

// Leave a study group
router.post('/:id/leave', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const groups = getStudyGroups();
  const groupIndex = groups.findIndex(g => g.id === req.params.id);
  
  if (groupIndex === -1) {
    return res.status(404).json({ message: 'Study group not found' });
  }
  
  const group = groups[groupIndex];
  
  // Check if user is a member
  if (!group.members.includes(userId)) {
    return res.status(400).json({ message: 'You are not a member of this group' });
  }
  
  // Remove user from members
  group.members = group.members.filter(id => id !== userId);
  
  // If creator leaves and there are other members, assign new creator
  if (group.createdBy === userId && group.members.length > 0) {
    group.createdBy = group.members[0];
  }
  
  // If no members left, delete the group
  if (group.members.length === 0) {
    groups.splice(groupIndex, 1);
  }
  
  saveStudyGroups(groups);
  
  res.json({ message: 'Successfully left the study group' });
});

// Add a post to study group
router.post('/:id/posts', authenticateToken, (req, res) => {
  const { content } = req.body;
  const userId = req.user.userId;
  const groups = getStudyGroups();
  const groupIndex = groups.findIndex(g => g.id === req.params.id);
  
  if (groupIndex === -1) {
    return res.status(404).json({ message: 'Study group not found' });
  }
  
  const group = groups[groupIndex];
  
  // Check if user is a member
  if (!group.members.includes(userId)) {
    return res.status(403).json({ message: 'You must be a member to post' });
  }
  
  if (!group.posts) group.posts = [];
  
  const newPost = {
    id: Date.now().toString(),
    userId,
    content,
    timestamp: new Date().toISOString(),
    replies: []
  };
  
  group.posts.push(newPost);
  saveStudyGroups(groups);
  
  res.status(201).json(newPost);
});

// Get study group posts
router.get('/:id/posts', authenticateToken, (req, res) => {
  const groups = getStudyGroups();
  const group = groups.find(g => g.id === req.params.id);
  
  if (!group) {
    return res.status(404).json({ message: 'Study group not found' });
  }
  
  res.json(group.posts || []);
});

// Schedule a meeting
router.post('/:id/meetings', authenticateToken, (req, res) => {
  const { title, description, datetime, location } = req.body;
  const userId = req.user.userId;
  const groups = getStudyGroups();
  const groupIndex = groups.findIndex(g => g.id === req.params.id);
  
  if (groupIndex === -1) {
    return res.status(404).json({ message: 'Study group not found' });
  }
  
  const group = groups[groupIndex];
  
  // Check if user is a member
  if (!group.members.includes(userId)) {
    return res.status(403).json({ message: 'You must be a member to schedule meetings' });
  }
  
  if (!group.meetings) group.meetings = [];
  
  const newMeeting = {
    id: Date.now().toString(),
    title,
    description,
    datetime,
    location: location || 'Online',
    scheduledBy: userId,
    attendees: [userId],
    createdAt: new Date().toISOString()
  };
  
  group.meetings.push(newMeeting);
  saveStudyGroups(groups);
  
  res.status(201).json(newMeeting);
});

// Get study group meetings
router.get('/:id/meetings', authenticateToken, (req, res) => {
  const groups = getStudyGroups();
  const group = groups.find(g => g.id === req.params.id);
  
  if (!group) {
    return res.status(404).json({ message: 'Study group not found' });
  }
  
  res.json(group.meetings || []);
});

module.exports = router;
