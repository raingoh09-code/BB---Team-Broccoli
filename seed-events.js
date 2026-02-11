// Sample data seeding script
// Run this to add demo events to test the Google Maps feature

const fs = require('fs');
const path = require('path');

// Get today's date
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

// Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Sample events with coordinates in San Francisco area
const sampleEvents = [
  {
    id: Date.now().toString() + '1',
    title: 'Tech Startup Networking',
    description: 'Connect with fellow entrepreneurs and tech enthusiasts. Discuss latest trends in AI and startups.',
    date: formatDate(today),
    time: '18:00',
    location: 'Downtown Tech Hub, San Francisco',
    category: 'Technology',
    maxAttendees: 50,
    organizerId: 'demo-user',
    attendees: [],
    coordinates: { lat: 37.7749, lng: -122.4194 },
    createdAt: new Date().toISOString()
  },
  {
    id: Date.now().toString() + '2',
    title: 'Morning Yoga in the Park',
    description: 'Start your day with energizing yoga session. All levels welcome!',
    date: formatDate(today),
    time: '07:00',
    location: 'Golden Gate Park, San Francisco',
    category: 'Health',
    maxAttendees: 30,
    organizerId: 'demo-user',
    attendees: [],
    coordinates: { lat: 37.7694, lng: -122.4862 },
    createdAt: new Date().toISOString()
  },
  {
    id: Date.now().toString() + '3',
    title: 'Coffee & Code Session',
    description: 'Casual coding meetup. Bring your laptop and work on projects together.',
    date: formatDate(today),
    time: '10:00',
    location: 'Blue Bottle Coffee, SOMA',
    category: 'Technology',
    maxAttendees: 20,
    organizerId: 'demo-user',
    attendees: [],
    coordinates: { lat: 37.7813, lng: -122.4034 },
    createdAt: new Date().toISOString()
  },
  {
    id: Date.now().toString() + '4',
    title: 'Art Gallery Opening',
    description: 'Celebrate local artists at our new gallery. Wine and appetizers included.',
    date: formatDate(tomorrow),
    time: '19:00',
    location: 'Mission District Gallery, San Francisco',
    category: 'Arts',
    maxAttendees: 100,
    organizerId: 'demo-user',
    attendees: [],
    coordinates: { lat: 37.7599, lng: -122.4148 },
    createdAt: new Date().toISOString()
  },
  {
    id: Date.now().toString() + '5',
    title: 'Street Food Festival',
    description: 'Taste the best street food from around the world. Live music and entertainment.',
    date: formatDate(tomorrow),
    time: '12:00',
    location: 'Civic Center Plaza, San Francisco',
    category: 'Food',
    maxAttendees: 500,
    organizerId: 'demo-user',
    attendees: [],
    coordinates: { lat: 37.7799, lng: -122.4187 },
    createdAt: new Date().toISOString()
  },
  {
    id: Date.now().toString() + '6',
    title: 'Basketball Pickup Game',
    description: 'Friendly basketball game. All skill levels welcome!',
    date: formatDate(today),
    time: '16:00',
    location: 'Presidio Sports Center, San Francisco',
    category: 'Sports',
    maxAttendees: 20,
    organizerId: 'demo-user',
    attendees: [],
    coordinates: { lat: 37.7989, lng: -122.4662 },
    createdAt: new Date().toISOString()
  },
  {
    id: Date.now().toString() + '7',
    title: 'Business Networking Brunch',
    description: 'Network with local business professionals over a delicious brunch.',
    date: formatDate(nextWeek),
    time: '11:00',
    location: 'Financial District, San Francisco',
    category: 'Business',
    maxAttendees: 40,
    organizerId: 'demo-user',
    attendees: [],
    coordinates: { lat: 37.7946, lng: -122.3999 },
    createdAt: new Date().toISOString()
  },
  {
    id: Date.now().toString() + '8',
    title: 'Python Workshop for Beginners',
    description: 'Learn Python basics in this hands-on workshop. Laptops provided.',
    date: formatDate(nextWeek),
    time: '14:00',
    location: 'Tech Academy, South San Francisco',
    category: 'Education',
    maxAttendees: 25,
    organizerId: 'demo-user',
    attendees: [],
    coordinates: { lat: 37.6547, lng: -122.4077 },
    createdAt: new Date().toISOString()
  }
];

// Read existing events
const eventsFile = path.join(__dirname, 'data', 'events.json');
let existingEvents = [];

try {
  if (fs.existsSync(eventsFile)) {
    existingEvents = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
  }
} catch (error) {
  console.log('No existing events file, creating new one');
}

// Add sample events (avoid duplicates)
const newEvents = [...existingEvents];
sampleEvents.forEach(event => {
  const exists = newEvents.find(e => e.title === event.title);
  if (!exists) {
    newEvents.push(event);
  }
});

// Write to file
fs.writeFileSync(eventsFile, JSON.stringify(newEvents, null, 2));

console.log(`✅ Added ${sampleEvents.length} sample events!`);
console.log(`📅 ${sampleEvents.filter(e => e.date === formatDate(today)).length} events today`);
console.log(`📅 ${sampleEvents.filter(e => e.date === formatDate(tomorrow)).length} events tomorrow`);
console.log(`📅 ${sampleEvents.filter(e => e.date === formatDate(nextWeek)).length} events next week`);
console.log('\n🗺️  To see events on the map:');
console.log('1. Get a Google Maps API key from: https://console.cloud.google.com/');
console.log('2. Add it to public/events.html (replace YOUR_API_KEY)');
console.log('3. Refresh the Events page and click "🗺️ Map View"');
console.log('4. Click "📍 Near Me" to see events sorted by distance!\n');
