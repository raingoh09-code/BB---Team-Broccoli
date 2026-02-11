# Google Maps Integration Setup Guide

## Getting Your Google Maps API Key

To enable the Google Maps feature on the Events page, you need to obtain a Google Maps API key:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Give your project a name (e.g., "Community Connect")
4. Click "Create"

### Step 2: Enable Required APIs

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable the following APIs:
   - **Maps JavaScript API** (for displaying the map)
   - **Geocoding API** (optional, for converting addresses to coordinates)
   - **Geolocation API** (optional, for better location accuracy)

### Step 3: Create API Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API key"
3. Copy your API key
4. **IMPORTANT**: Click "Restrict Key" to add security restrictions:
   - Under "Application restrictions", select "HTTP referrers (web sites)"
   - Add your website URLs (e.g., `http://localhost:3000/*` for development)
   - Under "API restrictions", select "Restrict key"
   - Choose only the APIs you enabled above

### Step 4: Add API Key to Your Project

1. Open `/public/events.html`
2. Find this line:
   ```html
   src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap&libraries=geometry">
   ```
3. Replace `YOUR_API_KEY` with your actual API key

### Step 5: Test the Integration

1. Start your server: `npm start`
2. Navigate to the Events page
3. Click on "🗺️ Map View" button
4. You should see a Google Map with event markers

## Features Implemented

### 📍 User Location Detection
- Automatically detects user's location using browser geolocation
- Shows user's position with a special blue marker on the map
- Centers the map on user's location

### 🗺️ Interactive Map View
- Toggle between List View and Map View
- Color-coded markers by event category:
  - 🔵 Technology (Blue)
  - 🟢 Sports (Green)
  - 🟡 Arts (Orange)
  - 🔷 Business (Light Blue)
  - 🔴 Food (Red)
  - 🟣 Health (Purple)
  - 🌸 Education (Pink)
  - 🔵 Social (Teal)

### 📏 Distance Calculation
- Shows distance from user to each event
- Events sorted by proximity when user location is available
- Distances displayed in kilometers

### 📅 Date Filtering
- **All Dates**: Show all events
- **Today**: Only events happening today
- **This Week**: Events in the next 7 days
- **This Month**: Events this month

### 📍 "Near Me" Feature
- Click "📍 Near Me" to find nearby upcoming events
- Automatically switches to map view
- Shows events sorted by distance
- Centers map on your location

### 🎯 Event Markers
- Numbered markers (1, 2, 3...) sorted by distance
- Click marker to see event details in popup
- Click event in sidebar to zoom to that marker
- Info windows show:
  - Event title
  - Date and time
  - Location
  - Category
  - Attendee count
  - Distance from you
  - RSVP button

### 🔍 Search & Filter
- Search events by name or description
- Filter by category
- Filter by date range
- All filters work in both List and Map views

## Usage Tips

### For Users:
1. **Allow location access** when prompted for best experience
2. Use **"Near Me"** button to find events closest to you
3. Click on **numbered markers** to see event details
4. Use **date filter** to find events "Today" for immediate activities
5. Switch between **List View** (detailed info) and **Map View** (visual location)

### For Developers:

#### Adding Real Geocoding
Currently, events use demo coordinates. To use real geocoding:

```javascript
// In events.js, replace geocodeEventLocations() with:
async function geocodeEventLocations() {
  const geocoder = new google.maps.Geocoder();
  
  for (const event of allEvents) {
    if (!event.coordinates && event.location) {
      try {
        const result = await geocoder.geocode({ address: event.location });
        if (result.results[0]) {
          event.coordinates = {
            lat: result.results[0].geometry.location.lat(),
            lng: result.results[0].geometry.location.lng()
          };
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }
  }
}
```

#### Storing Coordinates in Database
Update the event creation to save coordinates:

```javascript
// In routes/events.js
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, date, time, location, category, maxAttendees } = req.body;
  
  // Geocode the location
  // ... geocoding code ...
  
  const newEvent = {
    // ... other fields ...
    coordinates: { lat: latitude, lng: longitude }
  };
  
  events.push(newEvent);
  saveData();
  res.status(201).json({ message: 'Event created successfully', event: newEvent });
});
```

## Troubleshooting

### Map Not Displaying
- Check if API key is correct
- Verify APIs are enabled in Google Cloud Console
- Check browser console for errors
- Make sure your domain is whitelisted in API key restrictions

### Location Not Working
- User must allow location permission in browser
- HTTPS is required for geolocation in production (HTTP works for localhost)
- Some browsers block location on http:// sites

### Distance Not Calculating
- Requires user location to be enabled
- Check that event coordinates are valid
- Verify geometry library is loaded: `&libraries=geometry`

## Cost Considerations

Google Maps API has a free tier:
- **$200 free credit per month**
- ~28,000 map loads per month free
- After free tier: ~$7 per 1,000 map loads

For a small community site, you'll likely stay within the free tier.

## Security Best Practices

1. **Never commit API keys to Git**
   - Add to `.gitignore` if storing in a config file
   
2. **Use API key restrictions**
   - Restrict to specific URLs
   - Restrict to specific APIs only
   
3. **Monitor usage**
   - Set up billing alerts in Google Cloud Console
   - Monitor API usage dashboard
   
4. **For production**, consider:
   - Server-side geocoding with API key stored in backend
   - Caching geocoded coordinates in database
   - Rate limiting API calls

## Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)

---

Happy mapping! 🗺️
