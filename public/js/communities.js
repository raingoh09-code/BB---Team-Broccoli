document.addEventListener('DOMContentLoaded', async () => {
  await loadCommunities();
});

async function loadCommunities() {
  const container = document.getElementById('communitiesContainer');
  
  try {
    const communities = await apiRequest('/communities');
    displayCommunities(communities);
  } catch (error) {
    container.innerHTML = `<p class="loading">Error loading communities: ${error.message}</p>`;
  }
}

function displayCommunities(communities) {
  const container = document.getElementById('communitiesContainer');
  
  if (communities.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = communities.map(community => `
    <div class="community-card">
      <h3 class="community-name">${community.name}</h3>
      <span class="community-category">${community.category}</span>
      <p class="community-description">${community.description}</p>
      <div class="community-footer">
        <span class="members-count">${community.members.length} members</span>
        ${isLoggedIn() ? `
          ${community.members.includes(getUserInfo()?.id) 
            ? `<button class="btn btn-outline" onclick="leaveCommunity('${community.id}')">Leave</button>`
            : `<button class="btn btn-primary" onclick="joinCommunity('${community.id}')">Join</button>`
          }
        ` : '<button class="btn btn-primary" onclick="location.href=\'login.html\'">Login to Join</button>'}
      </div>
      <div class="event-info-item" style="margin-top: 1rem">
        ${community.location}
      </div>
    </div>
  `).join('');
}

async function joinCommunity(communityId) {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  
  try {
    await apiRequest(`/communities/${communityId}/join`, {
      method: 'POST'
    });
    
    alert('Successfully joined the community!');
    await loadCommunities();
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
    
    alert('Successfully left the community');
    await loadCommunities();
  } catch (error) {
    alert(error.message);
  }
}
