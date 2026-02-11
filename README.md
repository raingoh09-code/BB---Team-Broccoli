# 🌟 Community Connect

A full-stack community event platform similar to Meetup, built with Node.js, Express, and vanilla JavaScript.

## ✨ Features

- **User Authentication**: Register and login with JWT-based authentication
- **User Profile**: Personal dashboard with "My Events", "Events I Created", and "My Communities" tabs
- **Event Management**: Create, browse, and RSVP to events
- **🇸🇬 Singapore Events Integration**: 12 real events from Visit Singapore
  - Direct booking links to official Visit Singapore website
  - Automatic tracking in user profile after booking
  - Categorized by Arts, Food, Sports, Technology, Social, and Health
- **Community Groups**: Create and join interest-based communities
- **Event Discovery**: Search and filter events by category
- **🗺️ Google Maps Integration**: Interactive map view with geolocation
  - Visual map display of all events
  - Distance calculation from your location
  - "Near Me" feature to find closest events
  - Filter events by date (Today, This Week, This Month)
  - Color-coded markers by category
  - Click markers for event details
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Dynamic content loading

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Beyondbinary-
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` and set your JWT secret:
```
PORT=3000
JWT_SECRET=your_secure_secret_key_here
NODE_ENV=development
```

5. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

6. Open your browser and navigate to:
```
http://localhost:3000
```

### Google Maps Setup (Optional but Recommended)

To enable the interactive map view on the Events page:

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Maps JavaScript API** and **Geocoding API**
3. Open `public/events.html` and replace `YOUR_API_KEY` with your actual API key
4. See [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) for detailed instructions

**Note**: The app works without an API key, but the map view will show an error. All other features work normally.

## 📁 Project Structure

```
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
├── data/
│   └── database.js           # Simple file-based database
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── routes/
│   ├── auth.js               # Authentication routes
│   ├── events.js             # Event management routes
│   ├── communities.js        # Community management routes
│   └── users.js              # User profile routes
└── public/
    ├── index.html            # Home page
    ├── events.html           # Events listing
    ├── communities.html      # Communities listing
    ├── login.html            # Login page
    ├── register.html         # Registration page
    ├── create-event.html     # Event creation form
    ├── create-community.html # Community creation form
    ├── css/
    │   └── style.css         # Main stylesheet
    └── js/
        ├── auth.js           # Authentication utilities
        ├── main.js           # Main JavaScript
        ├── login.js          # Login functionality
        ├── register.js       # Registration functionality
        ├── events.js         # Events page logic
        ├── communities.js    # Communities page logic
        ├── create-event.js   # Event creation logic
        └── create-community.js # Community creation logic
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get all events (supports ?category and ?search)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (requires auth)
- `POST /api/events/:id/rsvp` - RSVP to event (requires auth)
- `DELETE /api/events/:id/rsvp` - Cancel RSVP (requires auth)

### Communities
- `GET /api/communities` - Get all communities
- `GET /api/communities/:id` - Get single community
- `POST /api/communities` - Create community (requires auth)
- `POST /api/communities/:id/join` - Join community (requires auth)
- `POST /api/communities/:id/leave` - Leave community (requires auth)

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/events` - Get user's events
- `GET /api/users/:id/communities` - Get user's communities

## 🎯 Usage Examples

### Register a New User
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Create an Event
```javascript
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Tech Meetup",
  "description": "Monthly tech networking event",
  "date": "2026-03-15",
  "time": "18:00",
  "location": "Downtown Coffee Shop",
  "category": "Technology",
  "maxAttendees": 50
}
```

## 🛠️ Technology Stack

**Backend:**
- Node.js
- Express.js
- JSON Web Tokens (JWT)
- bcryptjs for password hashing

**Frontend:**
- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript (ES6+)

**Data Storage:**
- JSON file-based storage (can be easily upgraded to MongoDB, PostgreSQL, etc.)

## 🔐 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected routes with middleware
- Input validation
- CORS enabled

## 📱 Pages Overview

1. **Home** - Landing page with features and call-to-action
2. **Events** - Browse and search for events with interactive map view
   - 📋 List View: Traditional card-based event listing
   - 🗺️ Map View: Visual map with event markers and distance calculation
   - 📍 Near Me: Find events closest to your location
   - 📅 Date filters: Today, This Week, This Month
   - 🇸🇬 Singapore Events: Real events from Visit Singapore with external booking
3. **Communities** - Discover and join communities
4. **My Profile** - Personal dashboard (requires login)
   - 📅 My Events: All events you're attending
   - 🎯 Events I Created: Events you organized
   - 👥 My Communities: Communities you joined
5. **Login/Register** - User authentication
6. **Create Event** - Form to create new events (auth required)
7. **Create Community** - Form to create new communities (auth required)

## 🎨 Customization

### Changing Colors
Edit CSS variables in `public/css/style.css`:
```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #0ea5e9;
  /* ... other colors */
}
```

### Adding Categories
Update the category options in:
- `public/events.html`
- `public/create-event.html`
- `public/create-community.html`

## 🚧 Future Enhancements

- [x] **Google Maps integration** ✅ Implemented!
  - Interactive map view
  - Geolocation and distance calculation
  - "Near Me" feature
  - Date filtering
- [ ] User profiles with avatars
- [ ] Event comments and discussions
- [ ] Real address geocoding (currently using demo coordinates)
- [ ] Email notifications
- [ ] Photo uploads for events
- [ ] Advanced search filters
- [ ] Event calendar view
- [ ] Social media integration
- [ ] Payment integration for paid events
- [ ] Mobile app (React Native)

## 📝 Development Notes

### Data Persistence
Currently, data is stored in JSON files in the `data/` directory. For production use, consider migrating to:
- MongoDB (NoSQL)
- PostgreSQL (SQL)
- MySQL

### Upgrading to Database
To upgrade to MongoDB, replace `data/database.js` with Mongoose models:
```javascript
const mongoose = require('mongoose');
// Define schemas and models
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🐛 Troubleshooting

**Issue: Port already in use**
- Change the PORT in `.env` file

**Issue: JWT errors**
- Make sure JWT_SECRET is set in `.env`

**Issue: CORS errors**
- Check that the frontend is making requests to the correct API URL

## 👥 Support

For questions or issues, please open an issue on the repository.

---

Built with ❤️ for connecting communities
