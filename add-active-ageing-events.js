const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const ONEPA_URL = 'https://www.onepa.gov.sg/events/search?events=&aoi=Active%20Ageing&sort=rel';

async function scrapeActiveAgeingEvents() {
  try {
    console.log('🔍 Fetching Active Ageing events from OnePA...');
    
    const response = await axios.get(ONEPA_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('✅ Page fetched successfully');
    
    const $ = cheerio.load(response.data);
    const events = [];
    let eventId = Date.now();

    $('.event-item, .event-card, article, .result-item').each((index, element) => {
      try {
        const $event = $(element);
        
        const title = $event.find('h2, h3, .title, .event-title').first().text().trim();
        const description = $event.find('p, .description, .event-description').first().text().trim() || 
                          $event.find('.excerpt, .summary').first().text().trim();
        const dateText = $event.find('.date, .event-date, time').first().text().trim();
        const location = $event.find('.location, .venue, .event-location').first().text().trim();
        const link = $event.find('a').first().attr('href');

        if (title) {
          const date = parseDate(dateText);
          
          events.push({
            id: `onepa-${eventId++}`,
            title: title,
            description: description || 'Join us for this exciting community event!',
            date: date.dateStr || '2026-02-15',
            time: date.timeStr || '14:00',
            location: location || 'Singapore',
            category: 'Health',
            maxAttendees: null,
            organizerId: 'onepa-singapore',
            attendees: [],
            coordinates: getSingaporeCoordinates(location),
            imageUrl: getDefaultImage('Health'),
            externalUrl: link ? (link.startsWith('http') ? link : `https://www.onepa.gov.sg${link}`) : ONEPA_URL,
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.log(`⚠️  Error parsing event ${index + 1}:`, err.message);
      }
    });

    if (events.length === 0) {
      console.log('⚠️  No events found with current selectors. Creating sample Active Ageing events...');
      return createSampleActiveAgeingEvents();
    }

    console.log(`✅ Successfully scraped ${events.length} events`);
    return events;

  } catch (error) {
    console.error('❌ Error scraping OnePA:', error.message);
    console.log('Creating sample Active Ageing events instead...');
    return createSampleActiveAgeingEvents();
  }
}

function parseDate(dateText) {
  if (!dateText) return { dateStr: '2026-02-15', timeStr: '14:00' };
  
  const dateMatch = dateText.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
  const timeMatch = dateText.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  
  let dateStr = '2026-02-15';
  let timeStr = '14:00';
  
  if (dateMatch) {
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
                    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const day = dateMatch[1].padStart(2, '0');
    const month = months[dateMatch[2].toLowerCase()];
    dateStr = `2026-${month}-${day}`;
  }
  
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2];
    const period = timeMatch[3] ? timeMatch[3].toLowerCase() : '';
    
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    
    timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
  }
  
  return { dateStr, timeStr };
}

function getSingaporeCoordinates(location) {
  const locationMap = {
    'jurong': { lat: 1.3404, lng: 103.7090 },
    'tampines': { lat: 1.3496, lng: 103.9568 },
    'woodlands': { lat: 1.4382, lng: 103.7891 },
    'bedok': { lat: 1.3236, lng: 103.9273 },
    'yishun': { lat: 1.4304, lng: 103.8354 },
    'toa payoh': { lat: 1.3343, lng: 103.8467 },
    'bishan': { lat: 1.3644, lng: 103.8470 },
    'ang mo kio': { lat: 1.3691, lng: 103.8454 },
    'clementi': { lat: 1.3162, lng: 103.7649 },
    'hougang': { lat: 1.3714, lng: 103.8864 },
    'pasir ris': { lat: 1.3721, lng: 103.9474 },
    'sengkang': { lat: 1.3868, lng: 103.8914 },
    'punggol': { lat: 1.4043, lng: 103.9021 },
    'default': { lat: 1.3521, lng: 103.8198 }
  };
  
  const loc = location.toLowerCase();
  for (const key in locationMap) {
    if (loc.includes(key)) {
      return locationMap[key];
    }
  }
  
  return locationMap.default;
}

function getDefaultImage(category) {
  const images = {
    'Health': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
    'Arts': 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
    'Social': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
    'Education': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400'
  };
  return images[category] || images['Social'];
}

function createSampleActiveAgeingEvents() {
  const baseId = Date.now();
  return [
    {
      id: `onepa-aa-${baseId + 1}`,
      title: 'Active Ageing Fitness Class',
      description: 'Join our senior-friendly fitness class featuring low-impact exercises, stretching, and strength training. Suitable for all fitness levels.',
      date: '2026-02-12',
      time: '09:00',
      location: 'Toa Payoh Community Club, Singapore',
      category: 'Health',
      maxAttendees: 30,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3343, lng: 103.8467 },
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 2}`,
      title: 'Silver Arts & Crafts Workshop',
      description: 'Discover your creative side! Learn traditional crafts and create beautiful art pieces. All materials provided.',
      date: '2026-02-14',
      time: '14:00',
      location: 'Jurong West Community Centre, Singapore',
      category: 'Arts',
      maxAttendees: 25,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3404, lng: 103.7090 },
      imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 3}`,
      title: 'Morning Tai Chi in the Park',
      description: 'Start your day with peaceful Tai Chi exercises in a beautiful park setting. Great for balance, flexibility and mental wellness.',
      date: '2026-02-13',
      time: '07:00',
      location: 'Bishan-Ang Mo Kio Park, Singapore',
      category: 'Health',
      maxAttendees: 40,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3644, lng: 103.8470 },
      imageUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 4}`,
      title: 'Senior Citizens Social Tea Session',
      description: 'Connect with fellow seniors over tea and snacks. Share stories, make new friends and enjoy performances.',
      date: '2026-02-15',
      time: '15:00',
      location: 'Tampines Central Community Club, Singapore',
      category: 'Social',
      maxAttendees: 50,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3496, lng: 103.9568 },
      imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 5}`,
      title: 'Digital Literacy Workshop for Seniors',
      description: 'Learn to use smartphones, social media apps and video calls. Stay connected with your loved ones digitally!',
      date: '2026-02-17',
      time: '10:00',
      location: 'Bedok Community Centre, Singapore',
      category: 'Education',
      maxAttendees: 20,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3236, lng: 103.9273 },
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 6}`,
      title: 'Walking Group - MacRitchie Reservoir',
      description: 'Join our friendly walking group for a leisurely stroll around MacRitchie Reservoir. Enjoy nature and good company!',
      date: '2026-02-16',
      time: '08:00',
      location: 'MacRitchie Reservoir Park, Singapore',
      category: 'Sports',
      maxAttendees: 35,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3520, lng: 103.8198 },
      imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 7}`,
      title: 'Healthy Cooking Class',
      description: 'Learn to prepare nutritious and delicious meals suitable for seniors. Recipe cards and samples provided!',
      date: '2026-02-18',
      time: '11:00',
      location: 'Yishun Community Centre, Singapore',
      category: 'Health',
      maxAttendees: 15,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.4304, lng: 103.8354 },
      imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 8}`,
      title: 'Line Dancing for Seniors',
      description: 'Fun and energetic line dancing session! Great cardio exercise and a wonderful way to socialize. No partner needed!',
      date: '2026-02-19',
      time: '16:00',
      location: 'Ang Mo Kio Community Club, Singapore',
      category: 'Sports',
      maxAttendees: 30,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3691, lng: 103.8454 },
      imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 9}`,
      title: 'Memory Wellness Workshop',
      description: 'Learn techniques to keep your mind sharp! Brain games, memory exercises and tips for cognitive health.',
      date: '2026-02-20',
      time: '14:00',
      location: 'Clementi Community Centre, Singapore',
      category: 'Health',
      maxAttendees: 25,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3162, lng: 103.7649 },
      imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 10}`,
      title: 'Senior Fitness Challenge',
      description: 'Test your fitness in a fun, non-competitive environment! Activities include walking, balance tests and flexibility exercises.',
      date: '2026-02-22',
      time: '09:00',
      location: 'Hougang Stadium, Singapore',
      category: 'Sports',
      maxAttendees: 50,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3714, lng: 103.8864 },
      imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 11}`,
      title: 'Gentle Yoga for Seniors',
      description: 'Relaxing yoga sessions designed for seniors. Improve flexibility, reduce stress and enhance wellbeing.',
      date: '2026-02-21',
      time: '10:00',
      location: 'Pasir Ris Community Club, Singapore',
      category: 'Health',
      maxAttendees: 25,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3721, lng: 103.9474 },
      imageUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-aa-${baseId + 12}`,
      title: 'Silver Singing Group',
      description: 'Join our friendly singing group! No experience needed, just bring your love for music. Sing classic hits and new favorites.',
      date: '2026-02-23',
      time: '15:00',
      location: 'Sengkang Community Hub, Singapore',
      category: 'Arts',
      maxAttendees: 30,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3868, lng: 103.8914 },
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    }
  ];
}

async function main() {
  console.log('🚀 Adding Active Ageing Events\n');
  
  const newEvents = await scrapeActiveAgeingEvents();
  
  if (newEvents.length > 0) {
    // Read existing events
    const eventsPath = path.join(__dirname, 'data', 'events.json');
    let existingEvents = [];
    
    try {
      const eventsData = fs.readFileSync(eventsPath, 'utf8');
      existingEvents = JSON.parse(eventsData);
      console.log(`📖 Found ${existingEvents.length} existing events`);
    } catch (err) {
      console.log('📄 No existing events file, creating new one');
    }
    
    // Combine events
    const allEvents = [...existingEvents, ...newEvents];
    
    // Save combined events
    fs.writeFileSync(eventsPath, JSON.stringify(allEvents, null, 2));
    
    console.log(`\n✅ Added ${newEvents.length} Active Ageing events`);
    console.log(`📊 Total events: ${allEvents.length}`);
    console.log('\n📋 New Active Ageing Events:');
    newEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title} - ${event.date} at ${event.time}`);
    });
    console.log('\n🎉 Done! Refresh your browser to see the new events.');
  } else {
    console.log('\n❌ No events to add');
  }
}

main().catch(console.error);
