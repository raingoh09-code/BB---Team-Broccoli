const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const ONEPA_API_URL = 'https://www.onepa.gov.sg/pacesapi/eventsearch/searchjson?aoi=Active%20Ageing&sort=rel';
const ONEPA_URL = 'https://www.onepa.gov.sg/events/search?events=&aoi=Active%20Ageing&sort=rel';

// Category mapping from OnePA to our system
const categoryMap = {
  'Competitions': 'Sports',
  'Active Ageing': 'Health',
  'Arts & Heritage': 'Arts',
  'Environment': 'Social',
  'Sports & Wellness': 'Sports',
  'Community': 'Social',
  'Education': 'Education',
  'Technology': 'Technology',
  'default': 'Social'
};

async function scrapeOnepaEvents() {
  try {
    console.log('🔍 Fetching events from OnePA API...');
    
    const response = await axios.get(ONEPA_API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    console.log('✅ Data fetched successfully');
    
    const events = [];
    let eventId = Date.now();
    
    // Check if we got valid JSON data
    if (!response.data || !response.data.data || !response.data.data.results) {
      console.log('⚠️  No events data found in API response');
      return createSampleActiveAgeingEvents();
    }

    const onepaEvents = response.data.data.results;
    console.log(`📋 Found ${onepaEvents.length} events from OnePA`);

    // Process each event from the API
    for (const onepaEvent of onepaEvents) {
      try {
        const title = onepaEvent.title || 'Untitled Event';
        const description = onepaEvent.description || `Join us at ${onepaEvent.outlet} for this Active Ageing event!`;
        const location = onepaEvent.outlet || 'Singapore';
        const link = onepaEvent.productUrl ? `https://www.onepa.gov.sg${onepaEvent.productUrl}` : ONEPA_URL;
        
        // Parse date from startDate (e.g., "02 Sep 2025 - 25 Aug 2026" or "22 Mar 2026")
        const dateInfo = parseOnePADate(onepaEvent.startDate, onepaEvent.sessionTime);
        const price = onepaEvent.minPrice || 0;
        
        events.push({
          id: `onepa-${eventId++}`,
          title: title,
          description: description,
          date: dateInfo.dateStr,
          time: dateInfo.timeStr,
          location: location,
          category: 'Health', // Active Ageing category maps to Health
          maxAttendees: onepaEvent.totalVacancies > 0 ? onepaEvent.totalVacancies : null,
          organizerId: onepaEvent.outletId || 'onepa-singapore',
          attendees: [],
          coordinates: getSingaporeCoordinates(location),
          imageUrl: getActiveAgeingImage(title),
          externalUrl: link,
          price: price,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.log(`⚠️  Error parsing event: ${err.message}`);
      }
    }

    if (events.length === 0) {
      console.log('⚠️  No events could be parsed from API response');
      console.log('Creating sample Active Ageing events instead...');
      return createSampleActiveAgeingEvents();
    }

    console.log(`✅ Successfully processed ${events.length} events`);
    return events;

  } catch (error) {
    console.error('❌ Error fetching from OnePA API:', error.message);
    console.log('Creating sample Active Ageing events instead...');
    return createSampleActiveAgeingEvents();
  }
}

// Helper function to parse OnePA date format
function parseOnePADate(startDateStr, sessionTime) {
  if (!startDateStr) {
    return { dateStr: '2026-02-15', timeStr: '14:00' };
  }

  try {
    // Handle date ranges like "02 Sep 2025 - 25 Aug 2026" - take the first date
    const firstDatePart = startDateStr.split(' - ')[0].trim();
    
    // Parse date like "22 Mar 2026" or "02 Sep 2025"
    const parts = firstDatePart.split(' ');
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, '0');
      const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      const month = monthMap[parts[1]] || '01';
      const year = parts[2];
      
      const dateStr = `${year}-${month}-${day}`;
      
      // Parse time from sessionTime like "7:30 PM - 9:30 PM" - take start time
      let timeStr = '14:00';
      if (sessionTime) {
        const timeMatch = sessionTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2];
          const ampm = timeMatch[3].toUpperCase();
          
          if (ampm === 'PM' && hours !== 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          
          timeStr = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      }
      
      return { dateStr, timeStr };
    }
  } catch (err) {
    console.log(`⚠️  Error parsing date: ${err.message}`);
  }
  
  return { dateStr: '2026-02-15', timeStr: '14:00' };
}

// Old HTML parsing function - kept for reference but not used
function parseDate(dateText) {
  if (!dateText) return { dateStr: '2026-02-15', timeStr: '14:00' };
  
  // Try to extract date and time from text
  // This is a basic implementation and may need enhancement
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

// Helper function to get Singapore coordinates based on location
function getSingaporeCoordinates(location) {
  const locationMap = {
    // North
    'woodlands': { lat: 1.4382, lng: 103.7891 },
    'admiralty': { lat: 1.4404, lng: 103.8009 },
    'yishun': { lat: 1.4304, lng: 103.8354 },
    
    // North-East
    'yew tee': { lat: 1.3969, lng: 103.7474 },
    'choa chu kang': { lat: 1.3840, lng: 103.7470 },
    
    // Central
    'bishan': { lat: 1.3526, lng: 103.8352 },
    'toa payoh': { lat: 1.3343, lng: 103.8467 },
    'ang mo kio': { lat: 1.3691, lng: 103.8454 },
    'cheng san': { lat: 1.3691, lng: 103.8454 }, // Ang Mo Kio area
    
    // East
    'tampines': { lat: 1.3496, lng: 103.9568 },
    'bedok': { lat: 1.3236, lng: 103.9273 },
    'marine terrace': { lat: 1.3042, lng: 103.9142 },
    'marine parade': { lat: 1.3042, lng: 103.9142 },
    
    // West
    'jurong': { lat: 1.3404, lng: 103.7090 },
    'clementi': { lat: 1.3162, lng: 103.7649 },
    
    // South
    'tanglin': { lat: 1.3048, lng: 103.8131 },
    'radin mas': { lat: 1.2756, lng: 103.8197 },
    
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

// Helper function to get relevant images for Active Ageing events
function getActiveAgeingImage(title) {
  const titleLower = title.toLowerCase();
  
  // Match image based on activity type
  if (titleLower.includes('dance') || titleLower.includes('fitness')) {
    return 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400'; // Seniors dancing/exercise
  } else if (titleLower.includes('eye') || titleLower.includes('screening') || titleLower.includes('health')) {
    return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'; // Health checkup
  } else if (titleLower.includes('tai chi') || titleLower.includes('yoga') || titleLower.includes('stretch')) {
    return 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400'; // Tai chi/yoga
  } else if (titleLower.includes('singing') || titleLower.includes('karaoke') || titleLower.includes('music') || titleLower.includes('band')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'; // Music/singing
  } else if (titleLower.includes('pool') || titleLower.includes('billiard')) {
    return 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400'; // Pool table
  } else if (titleLower.includes('bowl') || titleLower.includes('lawn bowl')) {
    return 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400'; // Lawn bowls
  } else if (titleLower.includes('digital') || titleLower.includes('computer') || titleLower.includes('tech')) {
    return 'https://images.unsplash.com/photo-1488751045188-3c55bbf9a3fa?w=400'; // Seniors learning tech
  } else if (titleLower.includes('walk') || titleLower.includes('outdoor') || titleLower.includes('park')) {
    return 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400'; // Outdoor activities
  } else {
    // Default image for general Active Ageing activities
    return 'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=400'; // Seniors socializing
  }
}

// Helper function to get default images by category (backup)
// Get contextually relevant image based on event title
function getContextualImage(title) {
  const titleLower = title.toLowerCase();
  
  // Check for specific activity keywords
  if (titleLower.includes('dance') || titleLower.includes('zumba')) {
    return 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400'; // Senior dancing
  }
  if (titleLower.includes('yoga') || titleLower.includes('tai chi')) {
    return 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400'; // Yoga/Tai Chi
  }
  if (titleLower.includes('sing') || titleLower.includes('karaoke') || titleLower.includes('music')) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'; // Singing/Music
  }
  if (titleLower.includes('pool') || titleLower.includes('billiard')) {
    return 'https://images.unsplash.com/photo-1625239110983-7f23374a9d5e?w=400'; // Pool/Billiards
  }
  if (titleLower.includes('lawn bowl') || titleLower.includes('bowling')) {
    return 'https://images.unsplash.com/photo-1511909525232-61113c912358?w=400'; // Lawn bowls
  }
  if (titleLower.includes('eye') || titleLower.includes('screening') || titleLower.includes('health check')) {
    return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'; // Health screening
  }
  if (titleLower.includes('digital') || titleLower.includes('tech') || titleLower.includes('computer')) {
    return 'https://images.unsplash.com/photo-1488998427799-e3362cec87c3?w=400'; // Digital learning
  }
  if (titleLower.includes('fitness') || titleLower.includes('exercise') || titleLower.includes('workout')) {
    return 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400'; // Senior fitness
  }
  
  // Default health/senior community image
  return 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=400';
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

// Create sample Active Ageing events if scraping fails
function createSampleActiveAgeingEvents() {
  const baseId = Date.now();
  return [
    {
      id: `onepa-${baseId + 1}`,
      title: 'Senior Dance Fitness Class',
      description: 'Stay active and healthy with our fun dance fitness class designed for seniors. No experience needed!',
      date: '2026-02-20',
      time: '09:00',
      location: 'Bishan Community Club, Singapore',
      category: 'Health',
      maxAttendees: 30,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3644, lng: 103.8470 },
      imageUrl: getActiveAgeingImage('Senior Dance Fitness Class'),
      externalUrl: ONEPA_URL,
      price: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-${baseId + 2}`,
      title: 'Healthy Ageing Workshop',
      description: 'Learn about nutrition, exercise, and mental wellness for healthy ageing. Free health screening included.',
      date: '2026-02-22',
      time: '14:00',
      location: 'Toa Payoh Community Club, Singapore',
      category: 'Health',
      maxAttendees: 50,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3343, lng: 103.8467 },
      imageUrl: getActiveAgeingImage('Healthy Ageing Workshop'),
      externalUrl: ONEPA_URL,
      price: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-${baseId + 3}`,
      title: 'Morning Tai Chi for Seniors',
      description: 'Join us for a peaceful morning of Tai Chi practice. Improve flexibility, balance, and inner peace.',
      date: '2026-02-25',
      time: '07:30',
      location: 'Ang Mo Kio Central Park, Singapore',
      category: 'Health',
      maxAttendees: 40,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3700, lng: 103.8462 },
      imageUrl: getActiveAgeingImage('Morning Tai Chi for Seniors'),
      externalUrl: ONEPA_URL,
      price: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-${baseId + 4}`,
      title: 'Silver Yoga Class',
      description: 'Gentle yoga sessions tailored for older adults. Enhance mobility and reduce stress.',
      date: '2026-03-01',
      time: '10:00',
      location: 'Tampines Community Club, Singapore',
      category: 'Health',
      maxAttendees: 25,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3496, lng: 103.9568 },
      imageUrl: getActiveAgeingImage('Silver Yoga Class'),
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-${baseId + 5}`,
      title: 'Cooking Competition: Best Local Dish',
      description: 'Showcase your culinary skills! Prepare your best local dish and impress our judges. Winner gets cooking equipment prizes.',
      date: '2026-03-08',
      time: '11:00',
      location: 'Bedok Community Centre, Singapore',
      category: 'Food',
      maxAttendees: 30,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3236, lng: 103.9273 },
      imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-${baseId + 6}`,
      title: 'Community Fun Run 5K',
      description: 'Lace up and join the fun run! A 5K route through scenic parks. All finishers receive medals. Family-friendly event.',
      date: '2026-03-12',
      time: '07:00',
      location: 'East Coast Park, Singapore',
      category: 'Sports',
      maxAttendees: 200,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3008, lng: 103.9074 },
      imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-${baseId + 7}`,
      title: 'Chess Tournament - All Ages',
      description: 'Battle of the minds! Strategic chess tournament for beginners to advanced players. Age categories: Junior, Adult, Senior.',
      date: '2026-03-15',
      time: '13:00',
      location: 'Yishun Community Club, Singapore',
      category: 'Sports',
      maxAttendees: 40,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.4304, lng: 103.8354 },
      imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-${baseId + 8}`,
      title: 'Dance Competition: Street Style',
      description: 'Show off your best moves! Solo and group categories. Hip-hop, breakdancing, and contemporary styles welcome.',
      date: '2026-03-18',
      time: '18:00',
      location: 'Ang Mo Kio Hub, Singapore',
      category: 'Arts',
      maxAttendees: 100,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3691, lng: 103.8454 },
      imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-${baseId + 9}`,
      title: 'Community Soccer League Finals',
      description: 'The final showdown! Watch the top teams battle for the championship title. Food stalls and activities for the whole family.',
      date: '2026-03-22',
      time: '16:00',
      location: 'Clementi Stadium, Singapore',
      category: 'Sports',
      maxAttendees: 500,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3162, lng: 103.7649 },
      imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    },
    {
      id: `onepa-${baseId + 10}`,
      title: 'Gaming Tournament: E-Sports Challenge',
      description: 'Gamers unite! Compete in popular e-sports titles. Prizes for top players. All gaming levels welcome.',
      date: '2026-03-25',
      time: '14:00',
      location: 'Hougang Community Centre, Singapore',
      category: 'Technology',
      maxAttendees: 64,
      organizerId: 'onepa-singapore',
      attendees: [],
      coordinates: { lat: 1.3714, lng: 103.8864 },
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
      externalUrl: ONEPA_URL,
      createdAt: new Date().toISOString()
    }
  ];
}

// Main function to scrape and save events
async function main() {
  console.log('🚀 OnePA Event Scraper Started\n');
  
  const events = await scrapeOnepaEvents();
  
  if (events.length > 0) {
    // Save to events.json
    const eventsPath = path.join(__dirname, 'data', 'events.json');
    fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2));
    
    console.log(`\n✅ ${events.length} events saved to data/events.json`);
    console.log('\n📋 Event Summary:');
    events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title} - ${event.date} at ${event.time}`);
    });
    console.log('\n🎉 Done! Restart your server to see the new events.');
  } else {
    console.log('\n❌ No events to save');
  }
}

// Run the scraper
main().catch(console.error);
