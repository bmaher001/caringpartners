/* =====================================================
   CPI FORMS - JavaScript
   =====================================================
   This file contains all form-related scripts for CPI website.
   Used across all form pages for consistency.
   ===================================================== */

(function() {
  'use strict';
  
  // Directus API Configuration
  // TODO: Update these values with your actual Directus configuration
  const DIRECTUS_URL = 'YOUR_DIRECTUS_URL'; // e.g., 'https://your-directus.com'
  const DIRECTUS_COLLECTION = 'checkup_forms'; // The collection name in Directus
  
  document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('wf-form-Checkup-Form');
    const successMessage = document.getElementById('form-success');
    const errorMessage = document.getElementById('form-error');
    const loadingMessage = document.getElementById('form-loading');
    
    if (!form) return;
    
    // Hide messages initially
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    loadingMessage.style.display = 'none';
    
    // Prevent Webflow's default form handling
    form.setAttribute('data-wf-skip-submit', 'true');
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Hide previous messages
      successMessage.style.display = 'none';
      errorMessage.style.display = 'none';
      
      // Show loading state
      form.style.display = 'none';
      loadingMessage.style.display = 'block';
      
      // Collect form data
      const formData = new FormData(form);
      const data = {
        accepted_jesus: formData.get('accepted-jesus'),
        name: formData.get('Checkup-Name'),
        address: formData.get('Checkup-Address'),
        age_range: formData.get('age-range'),
        email: formData.get('Checkup-Email'),
        phone: formData.get('Checkup-Phone'),
        brochure_source: formData.get('Checkup-Brochure-Source'),
        pastor_contact: formData.get('pastor-contact'),
        contact_method: formData.get('contact-method'),
        message: formData.get('Checkup-Message'),
        submitted_at: new Date().toISOString()
      };
      
      try {
        // TODO: Uncomment and configure when Directus is ready
        /*
        const response = await fetch(`${DIRECTUS_URL}/items/${DIRECTUS_COLLECTION}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add authorization header if needed
            // 'Authorization': 'Bearer YOUR_TOKEN'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error('Failed to submit form');
        }
        */
        
        // Simulate successful submission (remove this when Directus is ready)
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Form data to be submitted:', data);
        
        // Show success message
        loadingMessage.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Reset form
        form.reset();
        
      } catch (error) {
        console.error('Form submission error:', error);
        
        // Show error message
        loadingMessage.style.display = 'none';
        form.style.display = 'block';
        errorMessage.style.display = 'block';
        
        // Scroll to error message
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
})();
