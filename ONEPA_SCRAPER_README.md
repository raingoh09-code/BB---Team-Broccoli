# OnePA Event Scraper

This script fetches events from the OnePA website and replaces your current events.

## Quick Start

Run the scraper anytime to fetch fresh events:

```bash
npm run scrape-onepa
```

Then restart your server to see the new events:

```bash
npm start
```

## What It Does

1. **Attempts to scrape** events from https://www.onepa.gov.sg/events/search?events=&aoi=Active%20Ageing&sort=rel
2. **If scraping fails** (due to page structure changes), it creates 10 curated Active Ageing events
3. **Replaces** all current events in `data/events.json`
4. **Includes** proper formatting with:
   - Event titles, descriptions, dates, times
   - Singapore locations with coordinates
   - Images for each event
   - Links back to OnePA website

## Event Categories Included

- 🏃 Health & Fitness
- 🎨 Arts & Crafts
- 👥 Social Activities
- 📚 Education & Learning
- 🚶 Sports & Wellness

## Sample Events Generated

1. Active Ageing Fitness Class
2. Silver Arts & Crafts Workshop
3. Morning Tai Chi in the Park
4. Senior Citizens Social Tea Session
5. Digital Literacy Workshop for Seniors
6. Walking Group - MacRitchie Reservoir
7. Healthy Cooking Class
8. Line Dancing for Seniors
9. Memory Wellness Workshop
10. Senior Fitness Challenge

## Customization

To modify the scraper, edit `scrape-onepa-events.js`:

- Change the URL to scrape different event types
- Adjust the HTML selectors if the OnePA page structure changes
- Modify the sample events in `createSampleActiveAgeingEvents()`
- Update category mappings in the `categoryMap` object

## Troubleshooting

**No events found?**
The OnePA website may have changed its structure. The script automatically falls back to creating sample Active Ageing events.

**Want to scrape a different page?**
Change the `ONEPA_URL` constant at the top of `scrape-onepa-events.js`

**Need to adjust selectors?**
Inspect the OnePA website and update the selectors in the scraping section of the script.

## Notes

- Events are saved with coordinates for map display
- All events link back to the OnePA website
- Events are marked as coming from "onepa-singapore" organizer
- Images are sourced from Unsplash for better visual appeal
