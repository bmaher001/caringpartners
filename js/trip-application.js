/* =====================================================
   CPI TRIP APPLICATION - Wizard Form JavaScript
   =====================================================
   Handles the multi-step wizard form for trip applications
   ===================================================== */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    MIN_AGE: 18,
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_FILE_TYPES: ['application/pdf'],
    DIRECTUS_URL: 'YOUR_DIRECTUS_URL',
    DIRECTUS_COLLECTION: 'trip_applications'
  };

  // State
  let state = {
    currentStep: '1',
    isMinor: false,
    isReturning: false,
    dateOfBirth: null
  };

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const form = document.getElementById('trip-application-form');
    if (!form) return;

    console.log('CPI Trip Application Form - Initializing...');
    
    setupDateSelects();
    setupEventListeners();
    
    console.log('CPI Trip Application Form - Ready!');
  }

  // Populate date selects
  function setupDateSelects() {
    const daySelect = document.getElementById('dob-day');
    const yearSelect = document.getElementById('dob-year');
    
    if (!daySelect || !yearSelect) return;

    // Days 1-31
    for (let i = 1; i <= 31; i++) {
      const opt = document.createElement('option');
      opt.value = i.toString().padStart(2, '0');
      opt.textContent = i;
      daySelect.appendChild(opt);
    }

    // Years
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i >= currentYear - 100; i--) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i;
      yearSelect.appendChild(opt);
    }
  }

  // Setup all event listeners
  function setupEventListeners() {
    // Date of birth
    ['dob-month', 'dob-day', 'dob-year'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', onDateChange);
    });

    // Step 1 Next
    const step1Next = document.getElementById('step1-next');
    if (step1Next) {
      step1Next.addEventListener('click', () => goToStep('2'));
    }

    // Selection cards
    document.querySelectorAll('.selection-card').forEach(card => {
      card.addEventListener('click', function() {
        const radio = this.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          // Update UI
          this.parentElement.querySelectorAll('.selection-card').forEach(c => c.classList.remove('selected'));
          this.classList.add('selected');
          // Enable next button
          const step2Next = document.getElementById('step2-next');
          if (step2Next) step2Next.disabled = false;
        }
      });
    });

    // Step 2 Next
    const step2Next = document.getElementById('step2-next');
    if (step2Next) {
      step2Next.addEventListener('click', onStep2Next);
    }

    // Back buttons
    document.querySelectorAll('.wizard-btn-back').forEach(btn => {
      btn.addEventListener('click', function() {
        goToStep(this.getAttribute('data-back'));
      });
    });

    // File uploads
    setupFileUpload('returning-file-drop', 'returning-consent-file', 'returning-file-name');
    setupFileUpload('minor-new-file-drop', 'minor-new-consent-file', 'minor-new-file-name');

    // Health conditional fields
    setupConditionalRadio('on_medications', 'medications-details');
    setupConditionalRadio('has_allergies', 'allergies-details');
    setupConditionalRadio('has_dietary', 'dietary-details');

    // Submit buttons - IMPORTANT: Use click event, not form submit
    const returningSubmit = document.getElementById('returning-submit');
    if (returningSubmit) {
      returningSubmit.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        submitReturning();
      });
    }

    const newSubmit = document.getElementById('new-submit');
    if (newSubmit) {
      newSubmit.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        submitNew();
      });
    }
    
    // Minor new participant - continue to full form
    const minorConsentNext = document.getElementById('minor-consent-next');
    if (minorConsentNext) {
      minorConsentNext.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleMinorConsentNext();
      });
    }
    
    // Step 3b back button - goes to different step based on minor/adult
    const step3bBack = document.getElementById('step3b-back');
    if (step3bBack) {
      step3bBack.addEventListener('click', function() {
        if (state.isMinor) {
          goToStep('3c'); // Minor goes back to parental consent
        } else {
          goToStep('2'); // Adult goes back to participation question
        }
      });
    }

    // Prevent default form submission
    const form = document.getElementById('trip-application-form');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
      });
    }
  }

  // Date change handler
  function onDateChange() {
    const month = document.getElementById('dob-month').value;
    const day = document.getElementById('dob-day').value;
    const year = document.getElementById('dob-year').value;

    if (month && day && year) {
      state.dateOfBirth = new Date(year, parseInt(month) - 1, parseInt(day));
      const age = calculateAge(state.dateOfBirth);
      state.isMinor = age < CONFIG.MIN_AGE;
      
      document.getElementById('is-minor').value = state.isMinor ? 'true' : 'false';
      document.getElementById('step1-next').disabled = false;
      
      console.log('Age:', age, 'Is Minor:', state.isMinor);
    } else {
      document.getElementById('step1-next').disabled = true;
    }
  }

  function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // Step 2 Next handler
  function onStep2Next() {
    const participation = document.querySelector('input[name="participation"]:checked');
    if (!participation) return;

    state.isReturning = participation.value === 'returning';
    document.getElementById('is-returning').value = state.isReturning ? 'true' : 'false';

    if (state.isReturning) {
      // Returning participant
      if (state.isMinor) {
        const upload = document.getElementById('returning-minor-upload');
        if (upload) upload.classList.remove('form-hidden');
      }
      goToStep('3a');
    } else {
      // New participant
      if (state.isMinor) {
        // Minor new participant: go to parental consent only step
        goToStep('3c');
      } else {
        // Adult new participant: show professional section and full form
        const profSection = document.getElementById('professional-section');
        if (profSection) profSection.classList.remove('form-hidden');
        goToStep('3b');
      }
    }
  }

  // Navigate to step
  function goToStep(stepId) {
    document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
    const target = document.querySelector(`.wizard-step[data-step="${stepId}"]`);
    if (target) {
      target.classList.add('active');
      state.currentStep = stepId;
      // Scroll to top
      document.getElementById('trip-application-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    console.log('Navigated to step:', stepId);
  }

  // File upload setup
  function setupFileUpload(dropId, inputId, nameId) {
    const dropArea = document.getElementById(dropId);
    const fileInput = document.getElementById(inputId);
    const fileName = document.getElementById(nameId);
    
    if (!dropArea || !fileInput || !fileName) return;

    dropArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', function() {
      if (this.files.length > 0) {
        handleFileSelect(this.files[0], dropArea, fileName);
      }
    });

    dropArea.addEventListener('dragover', e => {
      e.preventDefault();
      dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));

    dropArea.addEventListener('drop', e => {
      e.preventDefault();
      dropArea.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect(e.dataTransfer.files[0], dropArea, fileName);
      }
    });

    const removeBtn = fileName.querySelector('.file-remove-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', e => {
        e.stopPropagation();
        fileInput.value = '';
        fileName.classList.add('form-hidden');
        dropArea.classList.remove('has-file');
      });
    }
  }

  function handleFileSelect(file, dropArea, fileName) {
    if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('Please upload a PDF file.');
      return;
    }
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      alert('File size must be less than 10MB.');
      return;
    }
    dropArea.classList.add('has-file');
    fileName.classList.remove('form-hidden');
    fileName.querySelector('.file-name-text').textContent = file.name;
  }

  // Conditional radio fields
  function setupConditionalRadio(radioName, detailsId) {
    document.querySelectorAll(`input[name="${radioName}"]`).forEach(radio => {
      radio.addEventListener('change', function() {
        const details = document.getElementById(detailsId);
        if (details) {
          if (this.value === 'yes') {
            details.classList.remove('form-hidden');
          } else {
            details.classList.add('form-hidden');
          }
        }
      });
    });
  }

  // Submit for returning participant
  function submitReturning() {
    console.log('=== SUBMITTING RETURNING PARTICIPANT ===');
    
    const firstName = document.getElementById('returning-first-name');
    const lastName = document.getElementById('returning-last-name');
    const errors = [];

    if (!firstName.value.trim()) {
      errors.push('First Name');
      firstName.classList.add('error');
    } else {
      firstName.classList.remove('error');
    }

    if (!lastName.value.trim()) {
      errors.push('Last Name');
      lastName.classList.add('error');
    } else {
      lastName.classList.remove('error');
    }

    // Check file for minors
    if (state.isMinor) {
      const fileInput = document.getElementById('returning-consent-file');
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        errors.push('Parental Consent Form');
      }
    }

    if (errors.length > 0) {
      alert('Please fill in all required fields:\n- ' + errors.join('\n- '));
      return;
    }

    // Submit
    doSubmit();
  }

  // Submit for minor new participant (parental consent only)
  function handleMinorConsentNext() {
    console.log('=== MINOR CONSENT - CONTINUE TO FULL FORM ===');
    
    // Check file upload
    const fileInput = document.getElementById('minor-new-consent-file');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Please upload the signed Parental Consent Form before continuing.');
      return;
    }

    // Show education section for minors
    const eduSection = document.getElementById('education-section');
    if (eduSection) eduSection.classList.remove('form-hidden');
    
    // Go to full form (step 3b)
    goToStep('3b');
  }

  // Submit for new participant
  function submitNew() {
    console.log('=== SUBMITTING NEW PARTICIPANT ===');
    
    const requiredFields = [
      { id: 'agreement-checkbox', name: 'Agreement', type: 'checkbox' },
      { id: 'hear-about', name: 'How did you hear about us' },
      { id: 'full-name', name: 'Full Name' },
      { id: 'place-of-birth', name: 'Place of Birth' },
      { id: 'mailing-address', name: 'Mailing Address' },
      { id: 'phone', name: 'Phone Number' },
      { id: 'email', name: 'Email' },
      { id: 'passport-number', name: 'Passport Number' },
      { id: 'passport-issue', name: 'Passport Issue Date' },
      { id: 'passport-expiry', name: 'Passport Expiry Date' },
      { id: 'preferred-airport', name: 'Preferred Airport' },
      { id: 'glove-size', name: 'Glove Size' },
      { id: 'stethoscope', name: 'Stethoscope' },
      { id: 'bp-cuff', name: 'BP Cuff' },
      { id: 'scrub-size', name: 'Scrub Size' },
      { id: 'tshirt-size', name: 'T-shirt Size' },
      { id: 'church-info', name: 'Church Information' },
      { id: 'pastor-email', name: 'Pastor Email' },
      { id: 'emergency-contact', name: 'Emergency Contact' }
    ];

    const errors = [];

    requiredFields.forEach(field => {
      const el = document.getElementById(field.id);
      if (!el) return;
      
      if (field.type === 'checkbox') {
        if (!el.checked) {
          errors.push(field.name);
          el.classList.add('error');
        } else {
          el.classList.remove('error');
        }
      } else {
        if (!el.value.trim()) {
          errors.push(field.name);
          el.classList.add('error');
        } else {
          el.classList.remove('error');
        }
      }
    });

    // Check radio groups
    ['on_medications', 'has_allergies', 'has_dietary'].forEach(name => {
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      if (!checked) {
        errors.push(name.replace(/_/g, ' '));
      }
    });

    // Adults don't need parental consent (they go directly to 3b)
    // Minors already uploaded consent in step 3c
    
    // Check education fields for minors
    if (state.isMinor) {
      const schoolName = document.getElementById('school-name');
      const schoolYear = document.getElementById('school-year');
      
      if (!schoolName || !schoolName.value.trim()) {
        errors.push('Your School');
        if (schoolName) schoolName.classList.add('error');
      } else {
        if (schoolName) schoolName.classList.remove('error');
      }
      
      if (!schoolYear || !schoolYear.value) {
        errors.push('Grade');
        if (schoolYear) schoolYear.classList.add('error');
      } else {
        if (schoolYear) schoolYear.classList.remove('error');
      }
    }

    if (errors.length > 0) {
      alert('Please fill in all required fields:\n- ' + errors.join('\n- '));
      return;
    }

    // Submit
    doSubmit();
  }

  // Actual submission
  async function doSubmit() {
    const form = document.getElementById('trip-application-form');
    const loading = document.getElementById('form-loading');

    // Show loading
    form.style.display = 'none';
    loading.style.display = 'block';

    // Collect data
    const formData = new FormData(form);
    formData.set('date_of_birth', state.dateOfBirth.toISOString().split('T')[0]);
    formData.set('is_minor', state.isMinor);
    formData.set('is_returning', state.isReturning);
    formData.set('status', 'pending');
    formData.set('submitted_at', new Date().toISOString());

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Form submitted:', Object.fromEntries(formData));

      // Show success
      loading.style.display = 'none';
      form.style.display = 'block';
      goToStep('success');

    } catch (error) {
      console.error('Submission error:', error);
      loading.style.display = 'none';
      form.style.display = 'block';
      goToStep('error');
    }
  }

})();
