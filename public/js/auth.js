const API_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getUserInfo() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function isLoggedIn() {
  return getToken() !== null;
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const message = data && data.message ? data.message : 'Something went wrong';
    throw new Error(message);
  }

  return data;
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function setupAuthNavigation() {
  const profileLink = document.getElementById('profileLink');
  const authLinks = document.getElementById('authLinks');
  const userLinks = document.getElementById('userLinks');
  const logoutBtn = document.getElementById('logoutBtn');

  if (profileLink && authLinks && userLinks) {
    if (isLoggedIn()) {
      profileLink.style.display = 'inline-block';
      authLinks.style.display = 'none';
      userLinks.style.display = 'inline-block';
    } else {
      profileLink.style.display = 'none';
      authLinks.style.display = 'inline-block';
      userLinks.style.display = 'none';
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (event) => {
      event.preventDefault();
      logout();
    });
  }
}

document.addEventListener('DOMContentLoaded', setupAuthNavigation);
