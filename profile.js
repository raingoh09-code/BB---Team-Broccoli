// Protect this page
requireAuth();

const user = getUserInfo();
let myEvents = [];
let createdEvents = [];
let myCommunities = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user exists
  if (!user || !user.name || !user.email) {
    console.error('User info not found:', user);
    alert('User information not found. Please login again.');
    window.location.href = 'login.html';
    return;
  }

  // Display user info
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileEmail').textContent = user.email;
  
  // Display profile information
  displayProfileInfo();

  // Load all data
  await Promise.all([
    loadMyEvents(),
    loadCreatedEvents(),
    loadMyCommunities()
  ]).catch(error => {
    console.error('Error loading profile data:', error);
  });
  
  // Update stats after loading data
  updateStats();
  
  // Render mood trend graph
  renderMoodTrend();
});

// Display profile information
function displayProfileInfo() {
  document.getElementById('displayName').textContent = user.name || '-';
  document.getElementById('displayEmail').textContent = user.email || '-';
  document.getElementById('displayPhone').textContent = user.phone || 'Not set';
  document.getElementById('displayArea').textContent = user.area || 'Not set';
}

// Toggle edit profile mode
window.toggleEditProfile = function() {
  const displayDiv = document.getElementById('profileInfoDisplay');
  const editDiv = document.getElementById('profileInfoEdit');
  
  // Populate edit fields with current values
  document.getElementById('editName').value = user.name || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editPhone').value = user.phone || '';
  document.getElementById('editArea').value = user.area || '';
  
  // Toggle visibility
  displayDiv.style.display = 'none';
  editDiv.style.display = 'grid';
};

// Cancel edit profile
window.cancelEditProfile = function() {
  const displayDiv = document.getElementById('profileInfoDisplay');
  const editDiv = document.getElementById('profileInfoEdit');
  
  displayDiv.style.display = 'grid';
  editDiv.style.display = 'none';
};

// Save profile changes
window.saveProfile = async function() {
  const name = document.getElementById('editName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const area = document.getElementById('editArea').value.trim();
  
  if (!name) {
    alert('Name is required');
    return;
  }
  
  try {
    const updatedUser = await apiRequest(`/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, phone, area })
    });
    
    // Update local user object
    user.name = updatedUser.name;
    user.phone = updatedUser.phone;
    user.area = updatedUser.area;
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update display
    displayProfileInfo();
    document.getElementById('profileName').textContent = user.name;
    
    // Hide edit form
    cancelEditProfile();
    
    alert('Profile updated successfully!');
  } catch (error) {
    alert('Error updating profile: ' + error.message);
  }
};

// Update stats display
function updateStats() {
  document.getElementById('statsEventsAttending').textContent = myEvents.length;
  document.getElementById('statsEventsCreated').textContent = createdEvents.length;
  document.getElementById('statsCommunities').textContent = myCommunities.length;
}

// Switch between tabs
window.switchTab = function(buttonElement, tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  buttonElement.classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');
};

// Load events user is attending
async function loadMyEvents() {
  const container = document.getElementById('myEventsContainer');
  console.log('Loading my events...');
  
  try {
    const allEvents = await apiRequest('/events');
    console.log('All events:', allEvents);
    console.log('User ID:', user.id);
    myEvents = allEvents.filter(e => e.attendees.includes(user.id));
    console.log('My events:', myEvents);
    
    if (myEvents.length === 0) {
      container.innerHTML = '<p class="loading">You haven\'t RSVP\'d to any events yet. <a href="events.html" style="color: var(--primary-color);">Browse events</a></p>';
      return;
    }

    displayEvents(myEvents, container);
  } catch (error) {
    console.error('Error loading my events:', error);
    container.innerHTML = `<p class="loading">Error loading events: ${error.message}</p>`;
  }
}

// Load events user created
async function loadCreatedEvents() {
  const container = document.getElementById('createdEventsContainer');
  console.log('Loading created events...');
  
  try {
    const allEvents = await apiRequest('/events');
    createdEvents = allEvents.filter(e => e.organizerId === user.id);
    console.log('Created events:', createdEvents);
    
    if (createdEvents.length === 0) {
      container.innerHTML = '<p class="loading">You haven\'t created any events yet. <a href="create-event.html" style="color: var(--primary-color);">Create an event</a></p>';
      return;
    }

    displayEvents(createdEvents, container);
  } catch (error) {
    console.error('Error loading created events:', error);
    container.innerHTML = `<p class="loading">Error loading events: ${error.message}</p>`;
  }
}

// Load user's communities
async function loadMyCommunities() {
  const container = document.getElementById('myCommunitiesContainer');
  
  try {
    const allCommunities = await apiRequest('/communities');
    myCommunities = allCommunities.filter(c => c.members.includes(user.id));
    
    if (myCommunities.length === 0) {
      container.innerHTML = '<p class="loading">You haven\'t joined any communities yet. <a href="communities.html" style="color: var(--primary-color);">Explore communities</a></p>';
      return;
    }

    container.innerHTML = myCommunities.map(community => `
      <div class="community-card">
        <div class="community-name">${community.name}</div>
        <span class="community-category">${community.category}</span>
        <div class="community-description">${community.description}</div>
        <div class="community-footer">
          <span class="members-count">${community.members.length} members</span>
          ${community.organizerId === user.id ? 
            '<span style="color: var(--primary-color); font-weight: 600;">Organizer</span>' : 
            `<button class="btn btn-outline" onclick="leaveCommunity('${community.id}')">Leave</button>`
          }
        </div>
        <div class="event-info-item" style="margin-top: 1rem">
          ${community.location}
        </div>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `<p class="loading">Error loading communities: ${error.message}</p>`;
  }
}

// Display events
function displayEvents(events, container) {
  container.innerHTML = events.map(event => {
    const isExternal = event.externalUrl;
    return `
    <div class="event-card" onclick="${isExternal ? '' : 'viewEvent(\'' + event.id + '\')'}">
      <div class="event-header">
        <span class="event-category">${event.category}</span>
        <h3 class="event-title">${event.title}</h3>
      </div>
      <div class="event-body">
        <div class="event-info">
          <div class="event-info-item">
            ${formatDate(event.date)}
          </div>
          <div class="event-info-item">
            ${event.time}
          </div>
          <div class="event-info-item">
            ${event.location}
          </div>
        </div>
        <p class="event-description">${event.description}</p>
        <div class="event-footer">
          ${isExternal ? 
            `<a href="${event.externalUrl}" target="_blank" class="btn btn-primary" onclick="event.stopPropagation()">View Details →</a>` :
            `<span class="attendees-count">${event.attendees.length} ${event.maxAttendees ? '/ ' + event.maxAttendees : ''} attending</span>`
          }
          ${!isExternal && event.organizerId === user.id ? 
            '<span style="color: var(--primary-color); font-weight: 600;">Organizer</span>' : 
            '<button class="btn btn-outline" onclick="cancelRSVP(event, \'' + event.id + '\')">Cancel RSVP</button>'
          }
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function viewEvent(eventId) {
  console.log('View event:', eventId);
}

async function cancelRSVP(e, eventId) {
  e.stopPropagation();
  
  if (!confirm('Are you sure you want to cancel your RSVP?')) {
    return;
  }
  
  try {
    await apiRequest(`/events/${eventId}/rsvp`, {
      method: 'DELETE'
    });
    
    alert('RSVP cancelled successfully!');
    await loadMyEvents();
  } catch (error) {
    alert(error.message);
  }
}

async function leaveCommunity(communityId) {
  if (!confirm('Are you sure you want to leave this community?')) {
    return;
  }
  
  try {
    await apiRequest(`/communities/${communityId}/leave`, {
      method: 'POST'
    });
    
    alert('Left community successfully');
    await loadMyCommunities();
  } catch (error) {
    alert(error.message);
  }
}

// Mood trend view state
let currentMoodView = 'monthly'; // 'monthly' or 'daily'
let currentPeriodOffset = 0; // 0 = current period, -1 = previous, 1 = next

// Switch between monthly and daily views
window.switchMoodView = function(buttonElement, view) {
  currentMoodView = view;
  currentPeriodOffset = 0; // Reset to current period when switching views
  
  // Update button states
  document.querySelectorAll('.mood-view-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  buttonElement.classList.add('active');
  
  // Render the appropriate view
  if (view === 'monthly') {
    renderMoodTrend();
  } else {
    renderDailyMoodView();
  }
};

// Navigate between time periods
window.navigateMoodPeriod = function(direction) {
  currentPeriodOffset += direction;
  
  // Render the current view
  if (currentMoodView === 'monthly') {
    renderMoodTrend();
  } else {
    renderDailyMoodView();
  }
};

// Render mood trend graph (Monthly view)
function renderMoodTrend() {
  try {
    console.log('Rendering mood trend...');
    
    // Get mood data from localStorage
    const moodTracker = JSON.parse(localStorage.getItem('moodTracker') || '[]');
    console.log('Mood tracker data:', moodTracker);
    
    // Get 6 months of data with offset
    const monthsToShow = 6;
    const monthData = [];
    const now = new Date();
  
    // Mood value mapping
    const moodValues = {
      '😊': 5,  // great
      '😀': 4,  // good
      '😐': 3,  // okay
      '🙁': 2,  // bad
      '😢': 1   // terrible
    };
  
  // Calculate start month based on offset
  const startMonthOffset = (monthsToShow - 1) + (currentPeriodOffset * monthsToShow);
  
  // Generate month labels and aggregate data
  for (let i = startMonthOffset; i >= currentPeriodOffset * monthsToShow; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Calculate average mood for the month
    const monthEntries = [];
    moodTracker.forEach(entry => {
      const entryDate = entry.date || entry.timestamp?.split('T')[0];
      if (entryDate && entryDate.startsWith(monthKey)) {
        const moodValue = moodValues[entry.emoji] || 3;
        monthEntries.push(moodValue);
      }
    });
    
    const avgMood = monthEntries.length > 0 
      ? monthEntries.reduce((a, b) => a + b, 0) / monthEntries.length 
      : 3; // Default to "okay" if no data
    
    monthData.push({ label: monthLabel, value: avgMood, date: date });
  }
  
  // Update period label
  const startMonth = monthData[0].date;
  const endMonth = monthData[monthData.length - 1].date;
  const periodLabel = `${startMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  const periodLabelElement = document.querySelector('.mood-period-label');
  if (periodLabelElement) {
    periodLabelElement.textContent = periodLabel;
  } else {
    console.error('Period label element not found');
  }
  
  // Render X-axis labels
  const xAxis = document.getElementById('moodXAxis');
  if (!xAxis) {
    console.error('moodXAxis element not found');
    return;
  }
  xAxis.innerHTML = monthData.map(d => `<div class="mood-x-label">${d.label}</div>`).join('');
  
  // Generate SVG path
  const width = 800;
  const height = 300;
  const padding = 10;
  const pointSpacing = width / (monthData.length - 1);
  
  // Create path points (inverted Y because SVG coordinates start from top)
  const points = monthData.map((d, i) => {
    const x = i * pointSpacing;
    const y = height - (((d.value - 1) / 4) * (height - 2 * padding)) - padding;
    return { x, y };
  });
  
  // Create line path
  const linePath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');
  
  // Create filled area path
  const areaPath = linePath + 
    ` L ${points[points.length - 1].x},${height}` +
    ` L ${points[0].x},${height} Z`;
  
  // Update SVG
  document.getElementById('moodTrendLine').setAttribute('d', linePath);
  document.getElementById('moodTrendPath').setAttribute('d', areaPath);
  
  // Clear existing data points
  const svg = document.getElementById('moodTrendSvg');
  const existingPoints = svg.querySelectorAll('.mood-data-point');
  existingPoints.forEach(point => point.remove());
  
  // Add data points
  points.forEach((p, i) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', '#A8BAAA');
    circle.setAttribute('class', 'mood-data-point');
    circle.setAttribute('data-mood', monthData[i].value.toFixed(1));
    circle.setAttribute('data-month', monthData[i].label);
    
    // Add tooltip on hover
    circle.addEventListener('mouseenter', (e) => {
      const moodText = getMoodText(monthData[i].value);
      circle.setAttribute('r', '8');
      // You could add a tooltip here if desired
    });
    
    circle.addEventListener('mouseleave', (e) => {
      circle.setAttribute('r', '5');
    });
    
    svg.appendChild(circle);
  });
  } catch (error) {
    console.error('Error rendering mood trend:', error);
  }
}

function getMoodText(value) {
  if (value >= 4.5) return '😊 Great';
  if (value >= 3.5) return '😀 Good';
  if (value >= 2.5) return '😐 Okay';
  if (value >= 1.5) return '🙁 Bad';
  return '😢 Terrible';
}

// Render daily mood view
function renderDailyMoodView() {
  try {
    // Get mood data from localStorage
    const moodTracker = JSON.parse(localStorage.getItem('moodTracker') || '[]');
    
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - currentPeriodOffset, 1);
    const monthKey = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}`;
    
    // Mood value mapping
    const moodValues = {
      '😊': 5,  // great
      '😀': 4,  // good
      '😐': 3,  // okay
      '🙁': 2,  // bad
      '😢': 1   // terrible
    };
  
  // Get number of days in the target month
  const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  
  // Create daily data array
  const dailyData = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
    
    // Find mood entries for this day
    const dayEntries = moodTracker.filter(entry => {
      const entryDate = entry.date || entry.timestamp?.split('T')[0];
      return entryDate === dateKey;
    });
    
    // Calculate average mood for the day
    let avgMood = 3; // Default to "okay"
    if (dayEntries.length > 0) {
      const moodSum = dayEntries.reduce((sum, entry) => sum + (moodValues[entry.emoji] || 3), 0);
      avgMood = moodSum / dayEntries.length;
    }
    
    dailyData.push({ label: day.toString(), value: avgMood, hasData: dayEntries.length > 0 });
  }
  
  // Update period label
  const periodLabel = targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.querySelector('.mood-period-label').textContent = periodLabel;
  
  // Render X-axis labels (show every 5th day or significant days)
  const xAxis = document.getElementById('moodXAxis');
  xAxis.innerHTML = dailyData.map((d, i) => {
    if (i === 0 || (i + 1) % 5 === 0 || i === dailyData.length - 1) {
      return `<div class="mood-x-label">${d.label}</div>`;
    }
    return '<div class="mood-x-label"></div>';
  }).join('');
  
  // Generate SVG path
  const width = 800;
  const height = 300;
  const padding = 10;
  const pointSpacing = dailyData.length > 1 ? width / (dailyData.length - 1) : width / 2;
  
  // Create path points (inverted Y because SVG coordinates start from top)
  const points = dailyData.map((d, i) => {
    const x = i * pointSpacing;
    const y = height - (((d.value - 1) / 4) * (height - 2 * padding)) - padding;
    return { x, y, hasData: d.hasData };
  });
  
  // Create line path
  const linePath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');
  
  // Create filled area path
  const areaPath = linePath + 
    ` L ${points[points.length - 1].x},${height}` +
    ` L ${points[0].x},${height} Z`;
  
  // Update SVG
  document.getElementById('moodTrendLine').setAttribute('d', linePath);
  document.getElementById('moodTrendPath').setAttribute('d', areaPath);
  
  // Clear existing data points
  const svg = document.getElementById('moodTrendSvg');
  const existingPoints = svg.querySelectorAll('.mood-data-point');
  existingPoints.forEach(point => point.remove());
  
  // Add data points
  points.forEach((p, i) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', p.hasData ? '5' : '3');
    circle.setAttribute('fill', p.hasData ? '#A8BAAA' : '#D1D5DB');
    circle.setAttribute('class', 'mood-data-point');
    circle.setAttribute('data-mood', dailyData[i].value.toFixed(1));
    circle.setAttribute('data-day', dailyData[i].label);
    
    // Add tooltip on hover
    circle.addEventListener('mouseenter', (e) => {
      const moodText = getMoodText(dailyData[i].value);
      circle.setAttribute('r', p.hasData ? '8' : '5');
    });
    
    circle.addEventListener('mouseleave', (e) => {
      circle.setAttribute('r', p.hasData ? '5' : '3');
    });
    
    svg.appendChild(circle);
  });
  } catch (error) {
    console.error('Error rendering daily mood view:', error);
  }
}
