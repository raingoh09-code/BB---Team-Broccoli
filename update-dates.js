const fs = require('fs');
const path = require('path');

const eventsFile = path.join(__dirname, 'data', 'events.json');
const events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));

const today = new Date();
today.setHours(0, 0, 0, 0);

events.forEach((event, idx) => {
  const eventDate = new Date(event.date);
  if (eventDate < today) {
    const daysToAdd = 3 + (idx * 3);
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + daysToAdd);
    event.date = newDate.toISOString().split('T')[0];
    console.log(`Updated: ${event.title} -> ${event.date}`);
  }
});

fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
console.log('\n✅ Dates updated successfully');
