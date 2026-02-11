// Protect this page
requireAuth();

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createCommunityForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');

    const communityData = {
      name: document.getElementById('name').value,
      description: document.getElementById('description').value,
      category: document.getElementById('category').value,
      location: document.getElementById('location').value
    };

    try {
      const data = await apiRequest('/communities', {
        method: 'POST',
        body: JSON.stringify(communityData)
      });

      successMessage.textContent = 'Community created successfully!';
      successMessage.classList.add('show');
      
      // Reset form
      form.reset();
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = 'communities.html';
      }, 2000);
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.classList.add('show');
    }
  });
});
