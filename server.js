const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const communityRoutes = require('./routes/communities');
const userRoutes = require('./routes/users');
const studyGroupRoutes = require('./routes/study-groups');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/study-groups', studyGroupRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
