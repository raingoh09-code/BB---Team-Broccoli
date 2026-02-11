// Peer Matching with Google Maps
// API_URL is already defined in auth.js
let map;
let currentUser = null;
let allPeers = [];
let matchedPeers = [];
let studyGroups = [];
let userMarker = null;
let peerMarkers = [];
let selectedFilters = {
  interests: [],
  minAge: 18,
  maxAge: 99,
  distance: 10
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded');
  checkAuth();
  await loadCurrentUser();
  await loadPeers();
  await loadStudyGroups();
  setupEventListeners();
  // Initialize map after Google Maps is loaded
  if (typeof google !== 'undefined' && google.maps) {
    console.log('Google Maps already loaded, initializing map...');
    initMap();
    applyMatchingFilters();
  } else {
    console.log('Waiting for Google Maps to load...');
  }
});

// Make initMap globally accessible for callback
window.initMap = initMap;
window.currentUser = currentUser;
window.applyMatchingFilters = applyMatchingFilters;

// Check authentication
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
}

// Initialize Map
function initMap() {
  console.log('initMap called');
  
  const mapContainer = document.getElementById('peerMap');
  if (!mapContainer) {
    console.error('Map container #peerMap not found!');
    return;
  }
  
  if (typeof google === 'undefined' || !google.maps) {
    console.error('Google Maps not loaded yet!');
    return;
  }
  
  try {
    // Default to Singapore
    map = new google.maps.Map(mapContainer, {
      center: { lat: 1.3521, lng: 103.8198 },
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    });
    
    console.log('Map initialized successfully');

    // Click on map to set location
    map.addListener('click', (e) => {
      if (document.getElementById('locationModal').style.display === 'block') {
        document.getElementById('inputLat').value = e.latLng.lat().toFixed(4);
        document.getElementById('inputLng').value = e.latLng.lng().toFixed(4);
      }
    });
    
    // If user has location, add marker and center map
    if (currentUser && currentUser.location && currentUser.location.lat && currentUser.location.lng) {
      console.log('Adding user marker at:', currentUser.location);
      addUserMarker(currentUser.location);
      map.setCenter({ lat: currentUser.location.lat, lng: currentUser.location.lng });
      map.setZoom(13);
      
      // Apply filters to show matching peers
      applyMatchingFilters();
    } else {
      console.log('User has no location set yet');
    }
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

// Load current user
async function loadCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error('No user found in localStorage');
      return;
    }
    const user = JSON.parse(userStr);
    const userId = user.id;
    
    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      currentUser = await response.json();
      window.currentUser = currentUser;
      console.log('Current user loaded:', currentUser);
      
      // Display user's profile area if available
      if (currentUser.area) {
        console.log('User profile area:', currentUser.area);
      }
      
      // If user doesn't have location, prompt to set it
      if (!currentUser.location || !currentUser.location.lat || !currentUser.location.lng) {
        console.log('User has no location set');
        // Show helpful message
        const locationNotice = document.createElement('div');
        locationNotice.style.cssText = 'position: fixed; top: 80px; left: 50%; transform: translateX(-50%); background: #ff9800; color: white; padding: 12px 20px; border-radius: 8px; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';
        locationNotice.innerHTML = 'Please set your location to find nearby peers';
        document.body.appendChild(locationNotice);
        setTimeout(() => locationNotice.remove(), 5000);
      }
    }
  } catch (error) {
    console.error('Error loading user:', error);
  }
}

// Load all peers
async function loadPeers() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users/peers/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      allPeers = await response.json();
      console.log('Loaded peers:', allPeers.length);
    }
  } catch (error) {
    console.error('Error loading peers:', error);
  }
}

// Load study groups
async function loadStudyGroups() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/study-groups`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      studyGroups = await response.json();
      displayStudyGroups();
    }
  } catch (error) {
    console.error('Error loading study groups:', error);
  }
}

// Add user marker
function addUserMarker(location) {
  if (userMarker) {
    userMarker.setMap(null);
  }
  
  userMarker = new google.maps.Marker({
    position: { lat: location.lat, lng: location.lng },
    map: map,
    title: 'You are here!',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: '#4CAF50',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    },
    animation: google.maps.Animation.DROP
  });
  
  const infoWindow = new google.maps.InfoWindow({
    content: '<div style="padding: 5px;"><b>You are here!</b></div>'
  });
  
  userMarker.addListener('click', () => {
    infoWindow.open(map, userMarker);
  });
}

// Apply matching filters
function applyMatchingFilters() {
  if (!currentUser || !currentUser.location) {
    document.getElementById('peersListContainer').innerHTML = 
      '<p class="no-data">Please set your location to find nearby peers</p>';
    return;
  }
  
  // Clear existing peer markers
  peerMarkers.forEach(marker => marker.setMap(null));
  peerMarkers = [];
  
  // Filter and match peers
  matchedPeers = allPeers.filter(peer => {
    // Don't match with self
    if (peer.id === currentUser.id) return false;
    
    // Must have location
    if (!peer.location || !peer.location.lat || !peer.location.lng) return false;
    
    // Age filter
    if (peer.age && (peer.age < selectedFilters.minAge || peer.age > selectedFilters.maxAge)) {
      return false;
    }
    
    // Distance filter
    const distance = calculateDistance(
      currentUser.location.lat,
      currentUser.location.lng,
      peer.location.lat,
      peer.location.lng
    );
    if (distance > selectedFilters.distance) return false;
    
    // Interest filter
    if (selectedFilters.interests.length > 0) {
      const peerInterests = peer.interests || [];
      const hasMatchingInterest = selectedFilters.interests.some(interest =>
        peerInterests.includes(interest)
      );
      if (!hasMatchingInterest) return false;
    }
    
    return true;
  });
  
  // Sort by match score
  matchedPeers = matchedPeers.map(peer => ({
    ...peer,
    matchScore: calculateMatchScore(peer)
  })).sort((a, b) => b.matchScore - a.matchScore);
  
  displayMatchedPeers();
  addPeerMarkers();
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate match score
function calculateMatchScore(peer) {
  let score = 0;
  const userInterests = currentUser.interests || [];
  const peerInterests = peer.interests || [];
  
  // Matching interests (weight: 3)
  const matchingInterests = userInterests.filter(i => peerInterests.includes(i)).length;
  score += matchingInterests * 3;
  
  // Age similarity (weight: 1)
  if (currentUser.age && peer.age) {
    const ageDiff = Math.abs(currentUser.age - peer.age);
    score += Math.max(0, 10 - ageDiff);
  }
  
  // Distance proximity (weight: 2)
  const distance = calculateDistance(
    currentUser.location.lat,
    currentUser.location.lng,
    peer.location.lat,
    peer.location.lng
  );
  score += Math.max(0, (10 - distance) * 2);
  
  return Math.round(score);
}

// Display matched peers
function displayMatchedPeers() {
  const container = document.getElementById('peersListContainer');
  document.getElementById('matchCount').textContent = matchedPeers.length;
  
  if (matchedPeers.length === 0) {
    container.innerHTML = '<p class="no-data">No peers found with current filters. Try adjusting your filters!</p>';
    return;
  }
  
  container.innerHTML = matchedPeers.map(peer => {
    const distance = calculateDistance(
      currentUser.location.lat,
      currentUser.location.lng,
      peer.location.lat,
      peer.location.lng
    ).toFixed(1);
    
    const commonInterests = (currentUser.interests || [])
      .filter(i => (peer.interests || []).includes(i));
    
    return `
      <div class="peer-card" data-peer-id="${peer.id}">
        <div class="peer-header">
          <div class="peer-avatar">${peer.name.charAt(0).toUpperCase()}</div>
          <div class="peer-info">
            <h4>${peer.name}</h4>
            <span class="peer-age">${peer.age || 'N/A'} years</span>
            <span class="peer-distance">${distance} km away</span>
          </div>
          <div class="peer-match-score" title="Match Score">
            ${peer.matchScore}%
          </div>
        </div>
        <div class="peer-interests">
          ${commonInterests.map(i => `<span class="interest-tag">${i}</span>`).join('')}
        </div>
        <div class="peer-actions">
          <button class="btn btn-sm btn-primary" onclick="openWaveModal('${peer.id}')">Wave Hi</button>
          <button class="btn btn-sm btn-outline" onclick="viewPeerLocation('${peer.id}')">View</button>
        </div>
      </div>
    `;
  }).join('');
}

// Add peer markers to map
function addPeerMarkers() {
  matchedPeers.forEach(peer => {
    const marker = new google.maps.Marker({
      position: { lat: peer.location.lat, lng: peer.location.lng },
      map: map,
      title: peer.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#2196F3',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });
    
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="peer-popup" style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0;">${peer.name}</h4>
          <p style="margin: 5px 0;">${peer.age || 'N/A'} years old</p>
          <p style="margin: 5px 0;">Interests: ${(peer.interests || []).join(', ')}</p>
          <button onclick="openWaveModal('${peer.id}')" class="btn btn-sm btn-primary" style="margin-top: 10px;">Wave Hi</button>
        </div>
      `
    });
    
    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });
    
    peerMarkers.push(marker);
  });
}

// View peer location on map
function viewPeerLocation(peerId) {
  const peer = matchedPeers.find(p => p.id === peerId);
  if (peer && peer.location) {
    map.setCenter({ lat: peer.location.lat, lng: peer.location.lng });
    map.setZoom(15);
    // Find and trigger click on the peer's marker
    const markerIndex = matchedPeers.findIndex(p => p.id === peerId);
    if (markerIndex >= 0 && peerMarkers[markerIndex]) {
      google.maps.event.trigger(peerMarkers[markerIndex], 'click');
    }
  }
}

// Display study groups
function displayStudyGroups() {
  const container = document.getElementById('studyGroupsContainer');
  
  if (studyGroups.length === 0) {
    container.innerHTML = '<p class="no-data">No study groups yet. Create one!</p>';
    return;
  }
  
  container.innerHTML = studyGroups.map(group => `
    <div class="study-group-card">
      <h4>${group.name}</h4>
      <p class="group-subject">${group.subject}</p>
      <p class="group-description">${group.description}</p>
      <p class="group-members">${group.members.length}/${group.maxMembers} members</p>
      ${group.schedule ? `<p class="group-schedule">${group.schedule}</p>` : ''}
      <button class="btn btn-sm btn-primary" onclick="joinStudyGroup('${group.id}')">
        ${group.members.includes(currentUser?.id) ? 'View Group' : 'Join Group'}
      </button>
    </div>
  `).join('');
}

// Open wave modal
function openWaveModal(peerId) {
  const peer = matchedPeers.find(p => p.id === peerId);
  if (!peer) return;
  
  document.getElementById('waveUserInfo').innerHTML = `
    <div class="wave-user-card">
      <div class="peer-avatar-lg">${peer.name.charAt(0).toUpperCase()}</div>
      <h3>${peer.name}</h3>
      <p>Send a friendly wave to connect!</p>
    </div>
  `;
  
  document.getElementById('waveModal').style.display = 'block';
  document.getElementById('waveMessage').value = '';
  document.getElementById('sendWaveBtn').onclick = () => sendWave(peerId);
}

// Send wave
async function sendWave(peerId) {
  try {
    const token = localStorage.getItem('token');
    const message = document.getElementById('waveMessage').value;
    
    const response = await fetch(`${API_URL}/users/wave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ toPeerId: peerId, message })
    });
    
    if (response.ok) {
      alert('Wave sent successfully!');
      document.getElementById('waveModal').style.display = 'none';
    } else {
      alert('Failed to send wave. Please try again.');
    }
  } catch (error) {
    console.error('Error sending wave:', error);
    alert('Error sending wave. Please try again.');
  }
}

// Join study group
async function joinStudyGroup(groupId) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/study-groups/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('Successfully joined the study group!');
      await loadStudyGroups();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to join group');
    }
  } catch (error) {
    console.error('Error joining group:', error);
    alert('Error joining group. Please try again.');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Filter buttons
  document.querySelectorAll('.tag-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const interest = btn.dataset.interest;
      if (btn.classList.contains('active')) {
        selectedFilters.interests.push(interest);
      } else {
        selectedFilters.interests = selectedFilters.interests.filter(i => i !== interest);
      }
    });
  });
  
  // Age filters
  document.getElementById('minAge').addEventListener('change', (e) => {
    selectedFilters.minAge = parseInt(e.target.value);
  });
  
  document.getElementById('maxAge').addEventListener('change', (e) => {
    selectedFilters.maxAge = parseInt(e.target.value);
  });
  
  // Distance filter
  document.getElementById('distanceRange').addEventListener('input', (e) => {
    selectedFilters.distance = parseInt(e.target.value);
    document.getElementById('distanceValue').textContent = `${e.target.value} km`;
  });
  
  // Apply filters
  document.getElementById('applyFiltersBtn').addEventListener('click', applyMatchingFilters);
  
  // Location buttons
  document.getElementById('locateMeBtn').addEventListener('click', useCurrentLocation);
  
  document.getElementById('saveLocationBtn').addEventListener('click', saveLocation);
  
  // Study group
  document.getElementById('createStudyGroupBtn').addEventListener('click', () => {
    document.getElementById('studyGroupModal').style.display = 'block';
  });
  
  document.getElementById('studyGroupForm').addEventListener('submit', createStudyGroup);
  
  // Modal close buttons
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
    });
  });
  
  // Close modals on outside click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
}

// Use current location
function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser. Please set location manually.');
    return;
  }
  
  // Show loading indicator
  const btn = document.getElementById('locateMeBtn');
  const originalText = btn.textContent;
  btn.textContent = 'Detecting...';
  btn.disabled = true;
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      console.log('Location detected:', location);
      console.log('Updating location for user...');
      
      try {
        await updateUserLocation(location);
        btn.textContent = originalText;
        btn.disabled = false;
      } catch (error) {
        console.error('Failed to update location:', error);
        btn.textContent = originalText;
        btn.disabled = false;
      }
    },
    (error) => {
      btn.textContent = originalText;
      btn.disabled = false;
      
      let errorMsg = 'Unable to get your location. ';
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMsg += 'Please enable location permissions in your browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg += 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMsg += 'The request to get your location timed out.';
          break;
        default:
          errorMsg += 'An unknown error occurred.';
      }
      errorMsg += ' You can set your location manually instead.';
      
      alert(errorMsg);
      console.error('Geolocation error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// Save location
async function saveLocation() {
  const lat = parseFloat(document.getElementById('inputLat').value);
  const lng = parseFloat(document.getElementById('inputLng').value);
  
  if (isNaN(lat) || isNaN(lng)) {
    alert('Please enter valid coordinates');
    return;
  }
  
  await updateUserLocation({ lat, lng });
  document.getElementById('locationModal').style.display = 'none';
}

// Update user location
async function updateUserLocation(location) {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('User session not found. Please log in again.');
      return;
    }
    const user = JSON.parse(userStr);
    const userId = user.id;
    
    console.log('Updating location for user:', userId, 'Location:', location);
    
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ location })
    });
    
    console.log('Update response status:', response.status);
    
    if (response.ok) {
      const updatedUser = await response.json();
      console.log('Updated user:', updatedUser);
      currentUser = updatedUser;
      window.currentUser = currentUser;
      
      addUserMarker(location);
      map.setCenter({ lat: location.lat, lng: location.lng });
      map.setZoom(13);
      await loadPeers();
      applyMatchingFilters();
      alert('Location updated successfully! Finding nearby peers...');
    } else {
      const errorData = await response.json();
      console.error('Update failed:', response.status, errorData);
      alert(`Error updating location: ${errorData.message || 'Please try again.'}`);
    }
  } catch (error) {
    console.error('Error updating location:', error);
    alert('Error updating location. Please check your connection and try again.');
  }
}

// Create study group
async function createStudyGroup(e) {
  e.preventDefault();
  
  try {
    const token = localStorage.getItem('token');
    
    const groupData = {
      name: document.getElementById('groupName').value,
      description: document.getElementById('groupDescription').value,
      subject: document.getElementById('groupSubject').value,
      maxMembers: parseInt(document.getElementById('maxMembers').value),
      schedule: document.getElementById('meetingSchedule').value
    };
    
    const response = await fetch(`${API_URL}/study-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(groupData)
    });
    
    if (response.ok) {
      alert('Study group created successfully!');
      document.getElementById('studyGroupModal').style.display = 'none';
      document.getElementById('studyGroupForm').reset();
      await loadStudyGroups();
    } else {
      alert('Failed to create study group');
    }
  } catch (error) {
    console.error('Error creating study group:', error);
    alert('Error creating study group. Please try again.');
  }
}

// Make functions globally accessible
window.openWaveModal = openWaveModal;
window.viewPeerLocation = viewPeerLocation;
window.joinStudyGroup = joinStudyGroup;
