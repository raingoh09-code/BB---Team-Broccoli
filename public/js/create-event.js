// Protect this page
requireAuth();

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createEventForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  // Set minimum date to today
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');

    const eventData = {
      title: document.getElementById('title').value,
      description: document.getElementById('description').value,
      date: document.getElementById('date').value,
      time: document.getElementById('time').value,
      location: document.getElementById('location').value,
      category: document.getElementById('category').value,
      maxAttendees: document.getElementById('maxAttendees').value || null
    };

    try {
      const data = await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });

      successMessage.textContent = 'Event created successfully!';
      successMessage.classList.add('show');
      
      // Reset form
      form.reset();
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = 'events.html';
      }, 2000);
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.classList.add('show');
    }
  });
});
