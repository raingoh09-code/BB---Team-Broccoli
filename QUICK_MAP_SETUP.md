# Get Your Google Maps API Key (5 Minutes)

## Step 1: Go to Google Cloud Console
🔗 https://console.cloud.google.com/

## Step 2: Create or Select a Project
1. Click "Select a project" at the top
2. Click "NEW PROJECT"
3. Name it: "Community Connect"
4. Click "CREATE"

## Step 3: Enable Maps JavaScript API
1. Click the ☰ menu → "APIs & Services" → "Library"
2. Search for: **Maps JavaScript API**
3. Click on it
4. Click "ENABLE"

## Step 4: Create API Key
1. Click ☰ menu → "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "API key"
3. **Copy your API key** (looks like: `AIzaSyD...`)

## Step 5: (Optional) Secure Your Key
1. Click "RESTRICT KEY"
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add: `http://localhost:3000/*`
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose: "Maps JavaScript API"
4. Click "SAVE"

## Step 6: Add Key to Your Project

Open this file: **`public/events.html`**

Find line 47 (around line 47):
```html
src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap&libraries=geometry">
```

Replace `YOUR_API_KEY` with your actual key:
```html
src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD...&callback=initMap&libraries=geometry">
```

## Step 7: Refresh the Page!

Go to http://localhost:3000/events.html and click "🗺️ Map View"

---

## 💰 Cost: FREE!
- Google gives you **$200 free credit per month**
- That's ~28,000 map loads per month
- Perfect for development and small projects!

## 🆘 Need Help?
See detailed guide: `GOOGLE_MAPS_SETUP.md`
