// Global variables
let allEvents = [];
let map;
let markers = [];
let userLocation = null;
let currentView = 'list';
let infoWindow;

// Get user info helper
function getUserInfo() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('token') !== null;
}

// Get auth token
function getToken() {
  return localStorage.getItem('token');
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Page loaded, fetching events...');
  await loadEvents();
  
  // Attach event listeners
  document.getElementById('searchBtn').addEventListener('click', filterEvents);
  document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') filterEvents();
  });
  document.getElementById('categoryFilter').addEventListener('change', filterEvents);
  document.getElementById('dateFilter').addEventListener('change', filterEvents);
  
  // Close modal when clicking outside of it
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('bookingModal');
    if (event.target === modal) {
      closeBookingModal();
    }
  });
});

// Load events from API
async function loadEvents() {
  const container = document.getElementById('eventsContainer');
  
  try {
    console.log('Fetching from API...');
    const response = await fetch('/api/events');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    allEvents = await response.json();
    console.log('Loaded events:', allEvents.length);
    
    displayEvents(allEvents);
  } catch (error) {
    console.error('Error loading events:', error);
    container.innerHTML = `<p class="loading">Error loading events: ${error.message}</p>`;
  }
}

// Display events in list view
function displayEvents(events) {
  const container = document.getElementById('eventsContainer');
  console.log('Displaying', events.length, 'events');
  
  if (events.length === 0) {
    container.innerHTML = '<p class="loading">No events found</p>';
    return;
  }
  
  container.innerHTML = events.map(event => {
    const isExternal = event.externalUrl;
    const userInfo = getUserInfo();
    const hasRSVPd = isLoggedIn() && userInfo && event.attendees.includes(userInfo.id);
    
    return `
      <div class="event-card" ${!isExternal ? `onclick="viewEvent('${event.id}')"` : ''}>
        ${event.imageUrl ? `<div class="event-image" style="background-image: url('${event.imageUrl}');"></div>` : ''}
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
              (hasRSVPd ? 
                '<span style="color: var(--success-color); font-weight: 600;">✓ Registered</span>' :
                `<button class="btn btn-primary" onclick="event.stopPropagation(); bookExternalEvent('${event.id}', '${event.externalUrl}'); return false;">
                  Register Now
                </button>`) :
              `<span class="attendees-count">
                ${event.attendees.length}${event.maxAttendees ? ' / ' + event.maxAttendees : ''} attending
              </span>`
            }
            ${!isExternal && isLoggedIn() && !hasRSVPd ? 
              `<button class="btn btn-primary" onclick="event.stopPropagation(); rsvpEvent('${event.id}')">RSVP</button>` :
              !isExternal && hasRSVPd ? '<span style="color: var(--success-color); font-weight: 600;">✓ Attending</span>' :
              ''
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Filter events
function filterEvents() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const dateFilter = document.getElementById('dateFilter').value;
  
  let filtered = allEvents;
  
  if (category) {
    filtered = filtered.filter(e => e.category === category);
  }
  
  if (search) {
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(search) || 
      e.description.toLowerCase().includes(search)
    );
  }
  
  // Filter by date
  if (dateFilter !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') {
        return eventDate.getTime() === today.getTime();
      } else if (dateFilter === 'this-week') {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return eventDate >= today && eventDate <= weekFromNow;
      } else if (dateFilter === 'this-month') {
        return eventDate.getMonth() === today.getMonth() && 
               eventDate.getFullYear() === today.getFullYear();
      }
      return true;
    });
  }
  
  if (currentView === 'list') {
    displayEvents(filtered);
  } else {
    displayEventsOnMap(filtered);
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// View event details
function viewEvent(eventId) {
  console.log('View event:', eventId);
}

// Show event details from map popup
function showEventDetailsFromMap(eventId) {
  // Close the info window
  if (infoWindow) {
    infoWindow.close();
  }
  
  // Find the event
  const event = allEvents.find(e => e.id === eventId);
  if (!event) {
    alert('Event not found');
    return;
  }
  
  // For external events, use the booking modal
  if (event.externalUrl) {
    bookExternalEvent(eventId, event.externalUrl);
    return;
  }
  
  // For regular events, show details in modal
  if (!isLoggedIn()) {
    if (confirm('Please login to view event details and RSVP. Go to login page?')) {
      window.location.href = 'login.html';
    }
    return;
  }
  
  const userInfo = getUserInfo();
  const hasRSVPd = userInfo && event.attendees.includes(userInfo.id);
  
  // Populate modal with event details
  const modalEventDetails = document.getElementById('modalEventDetails');
  modalEventDetails.innerHTML = `
    <h3>${event.title}</h3>
    <div class="modal-detail-item"><strong>Date:</strong> ${formatDate(event.date)}</div>
    <div class="modal-detail-item"><strong>Time:</strong> ${event.time}</div>
    <div class="modal-detail-item"><strong>Location:</strong> ${event.location}</div>
    <div class="modal-detail-item"><strong>Category:</strong> ${event.category}</div>
    <div class="modal-detail-item"><strong>Description:</strong> ${event.description}</div>
    ${event.maxAttendees ? `<div class="modal-detail-item"><strong>Max Attendees:</strong> ${event.maxAttendees}</div>` : ''}
    <div class="modal-detail-item"><strong>Currently Attending:</strong> ${event.attendees.length} ${event.attendees.length === 1 ? 'person' : 'people'}</div>
    ${hasRSVPd ? '<div class="modal-detail-item" style="color: var(--success-color); font-weight: 600;">✓ You have RSVP\'d to this event</div>' : ''}
  `;
  
  // Populate modal with user details
  const modalUserDetails = document.getElementById('modalUserDetails');
  modalUserDetails.innerHTML = `
    <h3>Your Details</h3>
    <div class="modal-detail-item"><strong>Name:</strong> ${userInfo.name}</div>
    <div class="modal-detail-item"><strong>Email:</strong> ${userInfo.email}</div>
  `;
  
  // Update button
  const confirmBtn = document.getElementById('confirmRegistrationBtn');
  if (hasRSVPd) {
    confirmBtn.style.display = 'none';
  } else {
    confirmBtn.style.display = 'inline-block';
    confirmBtn.textContent = 'RSVP to Event';
    confirmBtn.onclick = async () => {
      try {
        await apiRequest(`/events/${eventId}/rsvp`, {
          method: 'POST'
        });
        alert('RSVP successful!');
        closeBookingModal();
        await loadEvents();
      } catch (error) {
        alert(error.message);
      }
    };
  }
  
  // Show the modal
  document.getElementById('bookingModal').style.display = 'block';
}

// RSVP to event
async function rsvpEvent(eventId) {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  
  try {
    await apiRequest(`/events/${eventId}/rsvp`, {
      method: 'POST'
    });
    
    alert('RSVP successful!');
    await loadEvents();
  } catch (error) {
    alert(error.message);
  }
}

// Book external event (Visit Singapore) - Show confirmation modal
let currentBookingEventId = null;

async function bookExternalEvent(eventId, externalUrl) {
  if (!isLoggedIn()) {
    alert('Please login to register for events');
    window.location.href = 'login.html';
    return false;
  }
  
  // Find the event
  const event = allEvents.find(e => e.id === eventId);
  if (!event) {
    alert('Event not found');
    return false;
  }
  
  // Get user info
  const userInfo = getUserInfo();
  
  // Store current booking event ID
  currentBookingEventId = eventId;
  
  // Populate modal with event details
  const modalEventDetails = document.getElementById('modalEventDetails');
  modalEventDetails.innerHTML = `
    <h3>${event.title}</h3>
    <div class="modal-detail-item"><strong>Date:</strong> ${formatDate(event.date)}</div>
    <div class="modal-detail-item"><strong>Time:</strong> ${event.time}</div>
    <div class="modal-detail-item"><strong>Location:</strong> ${event.location}</div>
    <div class="modal-detail-item"><strong>Category:</strong> ${event.category}</div>
    ${event.maxAttendees ? `<div class="modal-detail-item"><strong>Max Attendees:</strong> ${event.maxAttendees}</div>` : ''}
  `;
  
  // Populate modal with user details
  const modalUserDetails = document.getElementById('modalUserDetails');
  modalUserDetails.innerHTML = `
    <h3>Your Details</h3>
    <div class="modal-detail-item"><strong>Name:</strong> ${userInfo.name}</div>
    <div class="modal-detail-item"><strong>Email:</strong> ${userInfo.email}</div>
  `;
  
  // Show the modal
  document.getElementById('bookingModal').style.display = 'block';
  
  return false;
}

// Close booking modal
function closeBookingModal() {
  document.getElementById('bookingModal').style.display = 'none';
  currentBookingEventId = null;
}

// Confirm booking and register
async function confirmBooking() {
  if (!currentBookingEventId) {
    return;
  }
  
  try {
    // RSVP to the event
    await apiRequest(`/events/${currentBookingEventId}/rsvp`, {
      method: 'POST'
    });
    
    // Close modal
    closeBookingModal();
    
    // Show success message
    alert('✅ Registration successful! Event has been added to your profile.');
    
    // Reload events to show updated status
    await loadEvents();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Make functions globally accessible
window.rsvpEvent = rsvpEvent;
window.bookExternalEvent = bookExternalEvent;
window.viewEvent = viewEvent;
window.closeBookingModal = closeBookingModal;
window.confirmBooking = confirmBooking;

// ===== GOOGLE MAPS INTEGRATION =====

// Initialize Google Map
function initMap() {
  const mapElement = document.getElementById('map');
  
  if (typeof google === 'undefined' || !google.maps) {
    console.log('Google Maps not loaded');
    showMapSetupInstructions();
    return;
  }
  
  // Center on Singapore for Singapore events
  const defaultLocation = { lat: 1.3521, lng: 103.8198 };
  
  map = new google.maps.Map(mapElement, {
    zoom: 11,
    center: defaultLocation,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
  });

  infoWindow = new google.maps.InfoWindow();

  // Try to get user's location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Add marker for user location
        new google.maps.Marker({
          position: userLocation,
          map: map,
          title: 'Your Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4f46e5',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
          }
        });
        
        // Display events if we have them
        if (allEvents.length > 0 && currentView === 'map') {
          displayEventsOnMap(allEvents);
        }
      },
      () => {
        console.log('Location access denied');
      }
    );
  }
}

// Show setup instructions for Google Maps
function showMapSetupInstructions() {
  const mapView = document.getElementById('mapView');
  mapView.innerHTML = `
    <div style="padding: 40px; text-align: center; background: white; border-radius: 8px; margin: 20px;">
      <h3 style="color: var(--primary-color); margin-bottom: 20px;">Google Maps Setup Required</h3>
      <p style="color: #666; margin-bottom: 20px;">To use the map view, you need to add your Google Maps API key.</p>
      <div style="text-align: left; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 4px;">
        <p style="font-weight: bold; margin-bottom: 10px;">Steps:</p>
        <ol style="line-height: 1.8;">
          <li>Go to <a href="https://console.cloud.google.com/google/maps-apis" target="_blank">Google Cloud Console</a></li>
          <li>Create a project and enable Maps JavaScript API</li>
          <li>Create credentials (API Key)</li>
          <li>Add your API key to <code>public/events.html</code> line 105</li>
        </ol>
      </div>
    </div>
  `;
}

// Display events on map
function displayEventsOnMap(events) {
  console.log('displayEventsOnMap called with', events.length, 'events');
  
  if (!map) {
    console.log('Map not initialized, attempting to initialize...');
    if (typeof google !== 'undefined' && google.maps) {
      initMap();
      setTimeout(() => displayEventsOnMap(events), 1000);
      return;
    } else {
      console.log('Google Maps not available');
      showMapSetupInstructions();
      return;
    }
  }

  // Clear existing markers
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  if (events.length === 0) {
    document.getElementById('nearbyEventsList').innerHTML = '<p class="loading">No events to display</p>';
    return;
  }

  console.log('Adding markers for', events.length, 'events');
  const bounds = new google.maps.LatLngBounds();

  // Add markers for events
  events.forEach((event, index) => {
    if (!event.coordinates) return;

    const marker = new google.maps.Marker({
      position: event.coordinates,
      map: map,
      title: event.title,
      label: {
        text: `${index + 1}`,
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 15,
        fillColor: getCategoryColor(event.category),
        fillOpacity: 0.9,
        strokeColor: 'white',
        strokeWeight: 2,
      }
    });

    bounds.extend(marker.getPosition());
    markers.push(marker);

    // Add click listener
    marker.addListener('click', () => {
      const contentString = `
        <div style="max-width: 300px; padding: 10px;">
          <h3 style="margin: 0 0 10px 0; color: var(--primary-brown);">${event.title}</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(event.date)} at ${event.time}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>
          <p style="margin: 5px 0;"><strong>Category:</strong> ${event.category}</p>
          <p style="margin: 10px 0; font-size: 14px;">${event.description.length > 100 ? event.description.substring(0, 100) + '...' : event.description}</p>
          <button 
            id="map-details-btn-${event.id}"
            style="
              background-color: #8C736F;
              color: #FFFFFF;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-weight: 600;
              margin-top: 10px;
              width: 100%;
            "
            onmouseover="this.style.backgroundColor='#492620'"
            onmouseout="this.style.backgroundColor='#8C736F'"
          >
            View Details & Register
          </button>
        </div>
      `;
      infoWindow.setContent(contentString);
      infoWindow.open(map, marker);
      
      // Attach click listener after InfoWindow DOM is ready
      google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        const btn = document.getElementById(`map-details-btn-${event.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            showEventDetailsFromMap(event.id);
          });
        }
      });
    });
  });

  // Fit map to show all markers
  if (markers.length > 0) {
    map.fitBounds(bounds);
  }

  // Update nearby events list
  updateNearbyEventsList(events);
}

// Update nearby events sidebar
function updateNearbyEventsList(events) {
  const listElement = document.getElementById('nearbyEventsList');
  
  // Element removed from UI, skip update
  if (!listElement) {
    return;
  }
  
  const infoContainer = document.querySelector('.map-events-info');
  
  // Show the info container
  if (infoContainer) {
    infoContainer.style.display = 'block';
  }
  
  // Calculate distances if user location available
  if (userLocation && typeof google !== 'undefined' && google.maps) {
    events.forEach(event => {
      if (event.coordinates) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(userLocation.lat, userLocation.lng),
          new google.maps.LatLng(event.coordinates.lat, event.coordinates.lng)
        );
        event.distance = (distance / 1000).toFixed(1); // Convert to km
      }
    });
    
    // Sort by distance
    events.sort((a, b) => (parseFloat(a.distance) || Infinity) - (parseFloat(b.distance) || Infinity));
  }
  
  listElement.innerHTML = events.map((event, index) => `
    <div class="nearby-event-item" onclick="focusEventOnMap(${index})">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="event-number" style="background: ${getCategoryColor(event.category)};">${index + 1}</span>
        <div style="flex: 1;">
          <h4 style="margin: 0; font-size: 14px;">${event.title}</h4>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
            ${event.time} • ${event.location}
            ${event.distance ? `<br>${event.distance} km away` : ''}
          </p>
        </div>
      </div>
    </div>
  `).join('');
}

// Get color by category
function getCategoryColor(category) {
  const colors = {
    'Technology': '#6366f1',
    'Sports': '#ef4444',
    'Arts': '#ec4899',
    'Business': '#8b5cf6',
    'Food': '#f59e0b',
    'Health': '#10b981',
    'Education': '#3b82f6',
    'Social': '#14b8a6'
  };
  return colors[category] || '#6b7280';
}

// Focus on event marker
// Focus on event marker when clicked from sidebar
window.focusEventOnMap = function(index) {
  if (markers[index]) {
    map.setZoom(14);
    map.panTo(markers[index].getPosition());
    google.maps.event.trigger(markers[index], 'click');
  }
};

// Switch between list and map views
window.switchView = function(view) {
  currentView = view;
  
  const listView = document.getElementById('listView');
  const mapView = document.getElementById('mapView');
  const listViewBtn = document.getElementById('listViewBtn');
  const mapViewBtn = document.getElementById('mapViewBtn');
  
  if (view === 'list') {
    listView.style.display = 'block';
    mapView.style.display = 'none';
    listViewBtn.classList.remove('btn-outline');
    listViewBtn.classList.add('btn-primary');
    mapViewBtn.classList.remove('btn-primary');
    mapViewBtn.classList.add('btn-outline');
    
    filterEvents();
  } else {
    listView.style.display = 'none';
    mapView.style.display = 'block';
    listViewBtn.classList.remove('btn-primary');
    listViewBtn.classList.add('btn-outline');
    mapViewBtn.classList.remove('btn-outline');
    mapViewBtn.classList.add('btn-primary');
    
    if (typeof google === 'undefined' || !google.maps) {
      showMapSetupInstructions();
    } else if (map) {
      google.maps.event.trigger(map, 'resize');
      displayEventsOnMap(allEvents);
    } else {
      initMap();
      setTimeout(() => {
        if (allEvents.length > 0) {
          displayEventsOnMap(allEvents);
        }
      }, 500);
    }
  }
};

// Find nearby events
window.findNearbyEvents = function() {
  if (typeof google === 'undefined' || !google.maps) {
    alert('Please set up Google Maps API key first.');
    switchView('map');
    return;
  }
  
  if (!userLocation) {
    alert('Please enable location services to find nearby events');
    return;
  }

  switchView('map');
  
  // Filter for upcoming events
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nearbyEvents = allEvents.filter(e => {
    const eventDate = new Date(e.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  displayEventsOnMap(nearbyEvents);
};

// Make initMap globally accessible for Google Maps callback
window.initMap = initMap;
