/**
 * CPI Volunteer Date Picker
 * Automatically calculates First Saturday and Third Tuesday of each month
 * Integrates with Directus for capacity management
 */

class VolunteerDatePicker {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      monthsAhead: options.monthsAhead || 6,
      maxCapacity: options.maxCapacity || 50,
      directusUrl: options.directusUrl || null,
      collectionName: options.collectionName || 'volunteer_sessions',
      onSelectionChange: options.onSelectionChange || null,
      ...options
    };
    
    this.selectedDates = [];
    this.capacityData = {};
    
    this.init();
  }

  async init() {
    if (!this.container) {
      console.error('Container not found');
      return;
    }

    // Show loading state
    this.container.innerHTML = '<div class="loading-spinner"></div><p class="loading-text">Loading available dates...</p>';

    // Fetch capacity data from Directus if URL provided
    if (this.options.directusUrl) {
      await this.fetchCapacityData();
    }

    // Generate and render dates
    const dates = this.generateVolunteerDates();
    this.render(dates);
  }

  // Calculate First Saturday of a given month
  getFirstSaturday(year, month) {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    // Saturday is day 6
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
    return new Date(year, month, 1 + daysUntilSaturday);
  }

  // Calculate Third Tuesday of a given month
  getThirdTuesday(year, month) {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    // Tuesday is day 2
    const daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
    const firstTuesday = 1 + daysUntilTuesday;
    // Third Tuesday = First Tuesday + 14 days
    return new Date(year, month, firstTuesday + 14);
  }

  // Generate volunteer dates for the next X months
  generateVolunteerDates() {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < this.options.monthsAhead; i++) {
      const targetMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const year = targetMonth.getFullYear();
      const month = targetMonth.getMonth();

      // First Saturday
      const firstSaturday = this.getFirstSaturday(year, month);
      if (firstSaturday >= today) {
        dates.push({
          date: firstSaturday,
          type: 'saturday',
          time: '10:00am - 12:00pm',
          label: 'First Saturday'
        });
      }

      // Third Tuesday
      const thirdTuesday = this.getThirdTuesday(year, month);
      if (thirdTuesday >= today) {
        dates.push({
          date: thirdTuesday,
          type: 'tuesday',
          time: '6:30pm - 8:00pm',
          label: 'Third Tuesday'
        });
      }
    }

    // Sort by date
    dates.sort((a, b) => a.date - b.date);

    return dates;
  }

  // Fetch capacity data from Directus
  async fetchCapacityData() {
    try {
      const response = await fetch(`${this.options.directusUrl}/items/${this.options.collectionName}?fields=date,registered_count,max_capacity,is_cancelled`);
      
      if (response.ok) {
        const data = await response.json();
        data.data.forEach(session => {
          this.capacityData[session.date] = {
            registered: session.registered_count || 0,
            maxCapacity: session.max_capacity || this.options.maxCapacity,
            isCancelled: session.is_cancelled || false
          };
        });
      }
    } catch (error) {
      console.error('Error fetching capacity data:', error);
      // Continue without capacity data - will show as available
    }
  }

  // Format date for display
  formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  // Format date for data attribute (YYYY-MM-DD)
  formatDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  // Get capacity status for a date
  getCapacityStatus(dateKey) {
    const capacity = this.capacityData[dateKey];
    
    if (!capacity) {
      // No data from Directus - assume available
      return {
        available: this.options.maxCapacity,
        total: this.options.maxCapacity,
        isFull: false,
        isCancelled: false,
        status: 'available'
      };
    }

    const available = capacity.maxCapacity - capacity.registered;
    const isFull = available <= 0;
    const isLimited = available <= 10 && available > 0;

    return {
      available,
      total: capacity.maxCapacity,
      isFull,
      isCancelled: capacity.isCancelled,
      status: capacity.isCancelled ? 'cancelled' : (isFull ? 'full' : (isLimited ? 'limited' : 'available'))
    };
  }

  // Render the date picker
  render(dates) {
    // Group dates by month
    const groupedDates = {};
    dates.forEach(dateObj => {
      const monthKey = dateObj.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!groupedDates[monthKey]) {
        groupedDates[monthKey] = [];
      }
      groupedDates[monthKey].push(dateObj);
    });

    let html = '<div class="volunteer-dates-container">';

    for (const [month, monthDates] of Object.entries(groupedDates)) {
      html += `
        <div class="volunteer-month-section">
          <h4 class="volunteer-month-title">${month}</h4>
      `;

      monthDates.forEach(dateObj => {
        const dateKey = this.formatDateKey(dateObj.date);
        const capacity = this.getCapacityStatus(dateKey);
        const isDisabled = capacity.isFull || capacity.isCancelled;
        const isSelected = this.selectedDates.includes(dateKey);

        let statusHtml = '';
        if (capacity.isCancelled) {
          statusHtml = '<span class="volunteer-date-full-badge">CANCELLED</span>';
        } else if (capacity.isFull) {
          statusHtml = '<span class="volunteer-date-full-badge">FULL</span>';
        } else {
          const spotsClass = capacity.status === 'limited' ? 'limited' : '';
          statusHtml = `
            <span class="volunteer-date-spots ${spotsClass}">${capacity.available} spots available</span>
            <input type="checkbox" class="volunteer-date-checkbox" 
                   name="volunteer_dates" 
                   value="${this.formatDate(dateObj.date)}"
                   data-date="${dateKey}"
                   ${isSelected ? 'checked' : ''}>
          `;
        }

        html += `
          <div class="volunteer-date-card ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" 
               data-date="${dateKey}">
            <div class="volunteer-date-info">
              <span class="volunteer-date-day">${this.formatDate(dateObj.date)}</span>
              <span class="volunteer-date-time">${dateObj.label} • ${dateObj.time}</span>
            </div>
            <div class="volunteer-date-status">
              ${statusHtml}
            </div>
          </div>
        `;
      });

      html += '</div>';
    }

    html += '</div>';
    html += '<div class="error-message" id="dates-error">Please select at least one date</div>';

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  // Attach event listeners
  attachEventListeners() {
    const cards = this.container.querySelectorAll('.volunteer-date-card:not(.disabled)');
    
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking directly on checkbox
        if (e.target.type === 'checkbox') return;
        
        const checkbox = card.querySelector('.volunteer-date-checkbox');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          this.handleSelection(card, checkbox);
        }
      });

      const checkbox = card.querySelector('.volunteer-date-checkbox');
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          this.handleSelection(card, checkbox);
        });
      }
    });
  }

  // Handle date selection
  handleSelection(card, checkbox) {
    const dateKey = card.dataset.date;
    
    if (checkbox.checked) {
      card.classList.add('selected');
      if (!this.selectedDates.includes(dateKey)) {
        this.selectedDates.push(dateKey);
      }
    } else {
      card.classList.remove('selected');
      this.selectedDates = this.selectedDates.filter(d => d !== dateKey);
    }

    // Hide error message if dates selected
    const errorMsg = document.getElementById('dates-error');
    if (errorMsg && this.selectedDates.length > 0) {
      errorMsg.classList.remove('visible');
    }

    // Callback
    if (this.options.onSelectionChange) {
      this.options.onSelectionChange(this.getSelectedDates());
    }
  }

  // Get selected dates
  getSelectedDates() {
    const checkboxes = this.container.querySelectorAll('.volunteer-date-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  // Validate selection
  validate() {
    const selected = this.getSelectedDates();
    const errorMsg = document.getElementById('dates-error');
    
    if (selected.length === 0) {
      if (errorMsg) errorMsg.classList.add('visible');
      return false;
    }
    
    if (errorMsg) errorMsg.classList.remove('visible');
    return true;
  }
}

// Export for use
window.VolunteerDatePicker = VolunteerDatePicker;
