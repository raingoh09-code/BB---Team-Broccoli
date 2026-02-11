// Main page functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('Digital AI Buddy loaded!');
  initCompactMoodTracker();
  displayDailyQuote();
});

// Motivational Quotes
const motivationalQuotes = [
  "Slow progress is still progress.",
  "Be proud of your progress.",
  "When you stop trying to make everything perfect, you might find that it already is.",
  "Success is a series of small wins.",
  "Never quieten your imagination.",
  "In every day there are 1440 minutes. That means we have 1440 daily opportunities to make a positive impact. - Les Brown",
  "Focus on being productive instead of busy.",
  "Hard work beats talent when talent doesn't work hard."
];

function displayDailyQuote() {
  const quoteElement = document.getElementById('dailyQuote');
  if (!quoteElement) {
    console.error('Daily quote element not found');
    return;
  }
  
  // Get day of year to determine which quote to show
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  // Loop through quotes based on day of year
  const quoteIndex = dayOfYear % motivationalQuotes.length;
  const quote = motivationalQuotes[quoteIndex];
  
  console.log('Displaying quote:', quote);
  quoteElement.innerHTML = `<p class="quote-text">"${quote}"</p>`;
  
  // Add fade-in animation immediately
  quoteElement.classList.add('fade-in');
}

// Compact Mood Tracker Functionality
function initCompactMoodTracker() {
  const moodButtons = document.querySelectorAll('.compact-mood-btn');
  const moodStatus = document.getElementById('compactMoodStatus');
  const viewHistoryBtn = document.getElementById('viewMoodHistory');

  // Load today's mood
  highlightTodayMood();
  
  // Load weekly mood display
  displayWeeklyMoodSummary();

  // Add click event to mood buttons
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      const emoji = btn.textContent.trim();
      console.log('Mood selected:', mood, 'Emoji:', emoji);
      saveMood(mood, emoji);
      
      // Visual feedback
      moodButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      
      // Show status message
      moodStatus.innerHTML = `<span class="mood-saved-compact">\u2713 Saved!</span>`;
      setTimeout(() => {
        moodStatus.innerHTML = '';
      }, 2000);
      
      // Update weekly display immediately
      console.log('Updating weekly display...');
      displayWeeklyMoodSummary();
    });
  });
}

function displayWeeklyMoodSummary() {
  const moods = JSON.parse(localStorage.getItem('moodTracker') || '[]');
  console.log('Displaying weekly mood summary. Total moods:', moods.length);
  console.log('Mood data:', moods);
  
  // Get all the day elements
  const weekDays = document.querySelectorAll('.weekly-mood-day');
  const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  console.log('Found week day elements:', weekDays.length);
  
  // Get the last 7 days starting from Sunday
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate the start of the current week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);
  
  weekDays.forEach((dayElement, index) => {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + index);
    const dateKey = dayDate.toISOString().split('T')[0];
    
    const moodEntry = moods.find(m => m.date === dateKey);
    const displayElement = dayElement.querySelector('.day-display');
    
    console.log(`Day ${index} (${dateKey}):`, moodEntry ? moodEntry.emoji : 'no mood', 'Element:', displayElement);
    
    if (displayElement) {
      if (moodEntry) {
        // Show emoji instead of day letter
        displayElement.textContent = moodEntry.emoji;
        dayElement.classList.add('has-mood');
        console.log(`Set emoji ${moodEntry.emoji} for day ${index}`);
      } else {
        // Show day letter
        displayElement.textContent = dayLetters[index];
        dayElement.classList.remove('has-mood');
      }
      
      // Highlight today
      if (index === currentDayOfWeek) {
        dayElement.classList.add('today');
      } else {
        dayElement.classList.remove('today');
      }
    } else {
      console.error(`No display element found for day ${index}`);
    }
  });
}

function openMoodModal() {
  const modal = document.getElementById('moodHistoryModal');
  if (modal) {
    modal.style.display = 'block';
    displayMoodHistory();
  }
}

function closeMoodModal() {
  const modal = document.getElementById('moodHistoryModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function highlightTodayMood() {
  const today = new Date().toISOString().split('T')[0];
  const moods = JSON.parse(localStorage.getItem('moodTracker') || '[]');
  const todayMood = moods.find(m => m.date === today);
  
  if (todayMood) {
    const todayButton = document.querySelector(`.compact-mood-btn[data-mood=\"${todayMood.mood}\"]`);
    if (todayButton) {
      todayButton.classList.add('selected');
    }
  }
}

function saveMood(mood, emoji) {
  const today = new Date();
  const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  console.log('Saving mood:', mood, 'Emoji:', emoji, 'Date:', dateKey);
  
  // Get existing moods
  let moods = JSON.parse(localStorage.getItem('moodTracker') || '[]');
  
  // Check if mood already exists for today, update it
  const existingIndex = moods.findIndex(m => m.date === dateKey);
  if (existingIndex >= 0) {
    moods[existingIndex] = { date: dateKey, mood, emoji, timestamp: today.toISOString() };
    console.log('Updated existing mood for today');
  } else {
    moods.push({ date: dateKey, mood, emoji, timestamp: today.toISOString() });
    console.log('Added new mood for today');
  }
  
  // Keep only last 30 days
  moods = moods.slice(-30);
  
  localStorage.setItem('moodTracker', JSON.stringify(moods));
  console.log('Mood saved to localStorage. Total moods:', moods.length);
}

function displayMoodHistory() {
  const moodWeeklyChart = document.getElementById('moodWeeklyChart');
  const moods = JSON.parse(localStorage.getItem('moodTracker') || '[]');
  
  if (moods.length === 0) {
    moodWeeklyChart.innerHTML = '<p class=\"no-data\">No mood data yet. Start tracking your mood!</p>';
    return;
  }
  
  // Get last 7 days
  const last7Days = getLast7Days();
  
  // Create mood chart
  let chartHTML = '<div class=\"mood-chart-grid\">';
  
  last7Days.forEach(dateObj => {
    const moodEntry = moods.find(m => m.date === dateObj.dateStr);
    const dayName = dateObj.dayName;
    const dateDisplay = dateObj.display;
    
    if (moodEntry) {
      chartHTML += `
        <div class=\"mood-day-entry has-data\">
          <div class=\"mood-day-emoji\">${moodEntry.emoji}</div>
          <div class=\"mood-day-label\">${dayName}</div>
          <div class=\"mood-day-date\">${dateDisplay}</div>
          <div class=\"mood-day-mood\">${moodEntry.mood}</div>
        </div>
      `;
    } else {
      chartHTML += `
        <div class=\"mood-day-entry\">
          <div class=\"mood-day-emoji\">\u2212</div>
          <div class=\"mood-day-label\">${dayName}</div>
          <div class=\"mood-day-date\">${dateDisplay}</div>
          <div class=\"mood-day-mood\">No entry</div>
        </div>
      `;
    }
  });
  
  chartHTML += '</div>';
  
  // Add mood summary
  const moodCounts = {};
  moods.forEach(m => {
    moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
  });
  
  const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
    moodCounts[a] > moodCounts[b] ? a : b, 'N/A'
  );
  
  chartHTML += `
    <div class=\"mood-summary\">
      <p><strong>Total entries:</strong> ${moods.length}</p>
      <p><strong>Most common mood:</strong> ${dominantMood}</p>
    </div>
  `;
  
  moodWeeklyChart.innerHTML = chartHTML;
}

function getLast7Days() {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    days.push({
      dateStr: date.toISOString().split('T')[0],
      dayName: dayNames[date.getDay()],
      display: `${date.getMonth() + 1}/${date.getDate()}`
    });
  }
  
  return days;
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('moodHistoryModal');
  if (event.target === modal) {
    closeMoodModal();
  }
}

// Mood Tracker Functionality
function initMoodTracker() {
  const moodButtons = document.querySelectorAll('.mood-btn');
  const moodStatus = document.getElementById('moodStatus');
  const moodWeeklyChart = document.getElementById('moodWeeklyChart');

  // Load and display mood history
  displayMoodHistory();

  // Add click event to mood buttons
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      const emoji = btn.querySelector('.mood-emoji').textContent;
      saveMood(mood, emoji);
      
      // Visual feedback
      moodButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      
      // Show status message
      moodStatus.innerHTML = `<p class="mood-saved">✓ Your mood has been saved! You're feeling ${mood} today.</p>`;
      setTimeout(() => {
        moodStatus.innerHTML = '';
      }, 3000);
      
      // Update display
      displayMoodHistory();
    });
  });
}

function saveMood(mood, emoji) {
  const today = new Date();
  const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Get existing moods
  let moods = JSON.parse(localStorage.getItem('moodTracker') || '[]');
  
  // Check if mood already exists for today, update it
  const existingIndex = moods.findIndex(m => m.date === dateKey);
  if (existingIndex >= 0) {
    moods[existingIndex] = { date: dateKey, mood, emoji, timestamp: today.toISOString() };
  } else {
    moods.push({ date: dateKey, mood, emoji, timestamp: today.toISOString() });
  }
  
  // Keep only last 30 days
  moods = moods.slice(-30);
  
  localStorage.setItem('moodTracker', JSON.stringify(moods));
}

function displayMoodHistory() {
  const moodWeeklyChart = document.getElementById('moodWeeklyChart');
  const moods = JSON.parse(localStorage.getItem('moodTracker') || '[]');
  
  if (moods.length === 0) {
    moodWeeklyChart.innerHTML = '<p class="no-data">No mood data yet. Start tracking your mood above!</p>';
    return;
  }
  
  // Get last 7 days
  const last7Days = getLast7Days();
  
  // Create mood chart
  let chartHTML = '<div class="mood-chart-grid">';
  
  last7Days.forEach(dateObj => {
    const moodEntry = moods.find(m => m.date === dateObj.dateStr);
    const dayName = dateObj.dayName;
    const dateDisplay = dateObj.display;
    
    if (moodEntry) {
      chartHTML += `
        <div class="mood-day-entry has-data">
          <div class="mood-day-emoji">${moodEntry.emoji}</div>
          <div class="mood-day-label">${dayName}</div>
          <div class="mood-day-date">${dateDisplay}</div>
          <div class="mood-day-mood">${moodEntry.mood}</div>
        </div>
      `;
    } else {
      chartHTML += `
        <div class="mood-day-entry">
          <div class="mood-day-emoji">−</div>
          <div class="mood-day-label">${dayName}</div>
          <div class="mood-day-date">${dateDisplay}</div>
          <div class="mood-day-mood">No entry</div>
        </div>
      `;
    }
  });
  
  chartHTML += '</div>';
  
  // Add mood summary
  const moodCounts = {};
  moods.forEach(m => {
    moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
  });
  
  const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
    moodCounts[a] > moodCounts[b] ? a : b, 'N/A'
  );
  
  chartHTML += `
    <div class="mood-summary">
      <p><strong>Total entries:</strong> ${moods.length}</p>
      <p><strong>Most common mood:</strong> ${dominantMood}</p>
    </div>
  `;
  
  moodWeeklyChart.innerHTML = chartHTML;
  
  // Highlight today's mood button if exists
  const today = new Date().toISOString().split('T')[0];
  const todayMood = moods.find(m => m.date === today);
  if (todayMood) {
    const todayButton = document.querySelector(`.mood-btn[data-mood="${todayMood.mood}"]`);
    if (todayButton) {
      todayButton.classList.add('selected');
    }
  }
}

function getLast7Days() {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    days.push({
      dateStr: date.toISOString().split('T')[0],
      dayName: dayNames[date.getDay()],
      display: `${date.getMonth() + 1}/${date.getDate()}`
    });
  }
  
  return days;
}
