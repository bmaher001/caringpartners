/* =====================================================
   CPI PASTORAL REFERENCE FORM - JavaScript
   =====================================================
   Handles the pastoral reference form functionality
   ===================================================== */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    DIRECTUS_URL: 'YOUR_DIRECTUS_URL',
    DIRECTUS_COLLECTION: 'pastoral_references'
  };

  // State
  let state = {
    applicationId: null,
    tripId: null,
    applicantName: null,
    tripName: null
  };

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const form = document.getElementById('pastoral-reference-form');
    if (!form) return;

    console.log('Pastoral Reference Form - Initializing...');
    
    parseUrlParams();
    setupEventListeners();
    
    console.log('Pastoral Reference Form - Ready!');
  }

  // Parse URL parameters
  function parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    state.applicationId = urlParams.get('application') || urlParams.get('id') || '';
    state.tripId = urlParams.get('trip') || '';
    state.applicantName = urlParams.get('applicant') || urlParams.get('name') || '';
    state.tripName = urlParams.get('trip_name') || urlParams.get('tripName') || '';
    
    // Set hidden fields
    document.getElementById('application-id').value = state.applicationId;
    document.getElementById('trip-id').value = state.tripId;
    
    // Update display
    const applicantDisplay = document.getElementById('applicant-name-display');
    const tripDisplay = document.getElementById('trip-info-display');
    const tripNameDisplay = document.getElementById('trip-name-display');
    
    if (applicantDisplay) {
      applicantDisplay.textContent = state.applicantName ? decodeURIComponent(state.applicantName) : 'Not specified';
    }
    
    if (tripDisplay) {
      tripDisplay.textContent = state.tripName ? decodeURIComponent(state.tripName) : (state.tripId || 'Mission Trip');
    }
    
    if (tripNameDisplay) {
      tripNameDisplay.textContent = state.tripName ? decodeURIComponent(state.tripName) : 'Mission Trip Application';
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    // Reservations conditional field
    document.querySelectorAll('input[name="has_reservations"]').forEach(radio => {
      radio.addEventListener('change', function() {
        const details = document.getElementById('reservations-details');
        if (details) {
          if (this.value === 'yes') {
            details.classList.remove('form-hidden');
          } else {
            details.classList.add('form-hidden');
          }
        }
      });
    });

    // Submit button
    const submitBtn = document.getElementById('pastoral-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        handleSubmit();
      });
    }

    // Prevent default form submission
    const form = document.getElementById('pastoral-reference-form');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
      });
    }
  }

  // Handle form submission
  async function handleSubmit() {
    console.log('=== SUBMITTING PASTORAL REFERENCE ===');
    
    const form = document.getElementById('pastoral-reference-form');
    const loading = document.getElementById('pastoral-loading');
    const success = document.getElementById('pastoral-success');
    const error = document.getElementById('pastoral-error');
    
    // Validate required fields
    const requiredFields = [
      { id: 'pastor-name', name: 'Your Name' },
      { id: 'pastor-title', name: 'Your Title' },
      { id: 'church-name', name: 'Church Name' },
      { id: 'pastor-email', name: 'Email' },
      { id: 'pastor-phone', name: 'Phone Number' },
      { id: 'relationship-type', name: 'Relationship Type' },
      { id: 'relationship-duration', name: 'Relationship Duration' },
      { id: 'integrity-rating', name: 'Integrity Rating' },
      { id: 'recommendation-level', name: 'Recommendation' }
    ];
    
    const errors = [];
    
    requiredFields.forEach(field => {
      const el = document.getElementById(field.id);
      if (!el || !el.value.trim()) {
        errors.push(field.name);
        if (el) el.classList.add('error');
      } else {
        if (el) el.classList.remove('error');
      }
    });
    
    // Check radio groups
    ['growing_faith', 'servant_leader', 'has_reservations'].forEach(name => {
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      if (!checked) {
        errors.push(name.replace(/_/g, ' '));
      }
    });
    
    if (errors.length > 0) {
      alert('Please fill in all required fields:\n- ' + errors.join('\n- '));
      return;
    }
    
    // Show loading
    form.style.display = 'none';
    loading.style.display = 'block';
    
    // Collect form data
    const formData = new FormData(form);
    formData.set('submitted_at', new Date().toISOString());
    formData.set('applicant_name', state.applicantName || '');
    formData.set('trip_name', state.tripName || '');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Pastoral Reference submitted:', Object.fromEntries(formData));
      
      // Show success
      loading.style.display = 'none';
      success.classList.remove('form-hidden');
      
      // Update success message
      const successName = document.getElementById('success-applicant-name');
      if (successName) {
        successName.textContent = state.applicantName ? decodeURIComponent(state.applicantName) : 'the applicant';
      }
      
    } catch (err) {
      console.error('Submission error:', err);
      loading.style.display = 'none';
      error.classList.remove('form-hidden');
    }
  }

})();
