const fs = require('fs');
const path = require('path');

// In-memory database (for demo purposes)
let users = [];
let events = [];
let communities = [];

// File paths for persistence
const dataDir = path.join(__dirname);
const usersFile = path.join(dataDir, 'users.json');
const eventsFile = path.join(dataDir, 'events.json');
const communitiesFile = path.join(dataDir, 'communities.json');

// Load data from files if they exist
function loadData() {
  try {
    if (fs.existsSync(usersFile)) {
      users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }
    if (fs.existsSync(eventsFile)) {
      events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
    }
    if (fs.existsSync(communitiesFile)) {
      communities = JSON.parse(fs.readFileSync(communitiesFile, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data to files
function saveData() {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
    fs.writeFileSync(communitiesFile, JSON.stringify(communities, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load data on startup
loadData();

module.exports = {
  users,
  events,
  communities,
  saveData
};
