/**
 * CPI Volunteer Calendar Picker
 * Dynamic calendar that fetches available dates from Directus
 * Supports: First Saturday, Third Tuesday, and Special/Custom days
 */

class VolunteerCalendar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      maxCapacity: options.maxCapacity || 50,
      directusUrl: options.directusUrl || null,
      collectionName: options.collectionName || 'volunteer_sessions',
      onSelectionChange: options.onSelectionChange || null,
      // Fallback to calculated dates if no Directus URL (for development/testing)
      useFallbackDates: options.useFallbackDates !== false,
      ...options
    };
    
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.selectedDates = [];
    this.volunteerDates = new Map(); // Store volunteer dates info from Directus
    this.isLoading = true;
    
    this.init();
  }

  async init() {
    if (!this.container) {
      console.error('VolunteerCalendar: Container not found');
      return;
    }

    // Show loading state
    this.renderLoading();

    // Fetch dates from Directus
    if (this.options.directusUrl) {
      await this.fetchVolunteerDates();
    } else if (this.options.useFallbackDates) {
      // Use calculated fallback dates for development/testing
      this.calculateFallbackDates();
    }

    this.isLoading = false;
    this.render();
  }

  // Fetch volunteer dates from Directus
  async fetchVolunteerDates() {
    try {
      const today = new Date();
      const todayStr = this.formatDateKey(today);
      
      // Fetch active sessions from today onwards
      const response = await fetch(
        `${this.options.directusUrl}/items/${this.options.collectionName}?` +
        `filter[is_active][_eq]=true&` +
        `filter[date][_gte]=${todayStr}&` +
        `sort=date&` +
        `fields=id,date,session_type,time_start,time_end,label,max_capacity,registered_count,notes`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        data.data.forEach(session => {
          const dateKey = session.date;
          const date = new Date(session.date + 'T00:00:00');
          
          // Format time display
          const timeDisplay = this.formatTimeRange(session.time_start, session.time_end);
          
          this.volunteerDates.set(dateKey, {
            id: session.id,
            date: date,
            type: session.session_type || 'custom', // saturday, tuesday, special
            time: timeDisplay,
            timeStart: session.time_start,
            timeEnd: session.time_end,
            label: session.label || this.getDefaultLabel(session.session_type),
            maxCapacity: session.max_capacity || this.options.maxCapacity,
            registeredCount: session.registered_count || 0,
            notes: session.notes || ''
          });
        });
        
        console.log(`VolunteerCalendar: Loaded ${data.data.length} sessions from Directus`);
      } else {
        console.error('VolunteerCalendar: Failed to fetch from Directus', response.status);
        // Fallback to calculated dates
        if (this.options.useFallbackDates) {
          this.calculateFallbackDates();
        }
      }
    } catch (error) {
      console.error('VolunteerCalendar: Error fetching dates', error);
      // Fallback to calculated dates
      if (this.options.useFallbackDates) {
        this.calculateFallbackDates();
      }
    }
  }

  // Format time range for display
  formatTimeRange(startTime, endTime) {
    if (!startTime || !endTime) return '';
    
    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'pm' : 'am';
      const hour12 = h % 12 || 12;
      return minutes === '00' ? `${hour12}${ampm}` : `${hour12}:${minutes}${ampm}`;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }

  // Get default label based on session type
  getDefaultLabel(type) {
    switch (type) {
      case 'saturday': return 'First Saturday';
      case 'tuesday': return 'Third Tuesday';
      case 'special': return 'Special Session';
      default: return 'Volunteer Session';
    }
  }

  // Calculate fallback dates (First Saturday & Third Tuesday) for development
  calculateFallbackDates() {
    console.log('VolunteerCalendar: Using fallback calculated dates');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      // First Saturday
      const firstSaturday = this.getFirstSaturday(year, month);
      if (firstSaturday >= today) {
        const key = this.formatDateKey(firstSaturday);
        this.volunteerDates.set(key, {
          id: null,
          date: firstSaturday,
          type: 'saturday',
          time: '10:00am - 12:00pm',
          timeStart: '10:00',
          timeEnd: '12:00',
          label: 'First Saturday',
          maxCapacity: this.options.maxCapacity,
          registeredCount: 0,
          notes: ''
        });
      }

      // Third Tuesday
      const thirdTuesday = this.getThirdTuesday(year, month);
      if (thirdTuesday >= today) {
        const key = this.formatDateKey(thirdTuesday);
        this.volunteerDates.set(key, {
          id: null,
          date: thirdTuesday,
          type: 'tuesday',
          time: '6:30pm - 8:00pm',
          timeStart: '18:30',
          timeEnd: '20:00',
          label: 'Third Tuesday',
          maxCapacity: this.options.maxCapacity,
          registeredCount: 0,
          notes: ''
        });
      }
    }
  }

  // Calculate First Saturday of a given month
  getFirstSaturday(year, month) {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
    return new Date(year, month, 1 + daysUntilSaturday);
  }

  // Calculate Third Tuesday of a given month
  getThirdTuesday(year, month) {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
    const firstTuesday = 1 + daysUntilTuesday;
    return new Date(year, month, firstTuesday + 14);
  }

  // Format date key (YYYY-MM-DD)
  formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format date for display
  formatDisplayDate(date) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Get capacity status for a date
  getCapacityStatus(dateKey) {
    const info = this.volunteerDates.get(dateKey);
    
    if (!info) {
      return {
        available: 0,
        total: 0,
        isFull: true,
        status: 'unavailable'
      };
    }

    const available = info.maxCapacity - info.registeredCount;
    const isFull = available <= 0;
    const isLimited = available <= 10 && available > 0;

    return {
      available,
      total: info.maxCapacity,
      registered: info.registeredCount,
      isFull,
      status: isFull ? 'full' : (isLimited ? 'limited' : 'available')
    };
  }

  // Get month name
  getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  }

  // Get days in month
  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // Get first day of month (0 = Sunday)
  getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  // Navigate to previous month
  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.render();
  }

  // Navigate to next month
  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.render();
  }

  // Render loading state
  renderLoading() {
    this.container.innerHTML = `
      <div class="volunteer-calendar">
        <div class="calendar-loading">
          <div class="loading-spinner"></div>
          <p>Loading available dates...</p>
        </div>
      </div>
    `;
  }

  // Render calendar
  render() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = this.getDaysInMonth(this.currentYear, this.currentMonth);
    const firstDay = this.getFirstDayOfMonth(this.currentYear, this.currentMonth);

    let html = `
      <div class="volunteer-calendar">
        <div class="calendar-header">
          <button type="button" class="calendar-nav-btn" id="cal-prev">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h4 class="calendar-month-title">${this.getMonthName(this.currentMonth)} ${this.currentYear}</h4>
          <button type="button" class="calendar-nav-btn" id="cal-next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        
        <div class="calendar-weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div class="calendar-days">
    `;

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const dateKey = this.formatDateKey(date);
      const volunteerInfo = this.volunteerDates.get(dateKey);
      const isPast = date < today;
      const isSelected = this.selectedDates.includes(dateKey);

      let dayClass = 'calendar-day';
      let statusHtml = '';
      let isClickable = false;
      let tooltip = '';

      if (volunteerInfo && !isPast) {
        const capacity = this.getCapacityStatus(dateKey);
        
        if (capacity.isFull) {
          dayClass += ' volunteer-date full';
          statusHtml = '<span class="day-status full">Full</span>';
          tooltip = `${volunteerInfo.label} - Full`;
        } else {
          dayClass += ' volunteer-date available';
          isClickable = true;
          if (capacity.status === 'limited') {
            statusHtml = `<span class="day-status limited">${capacity.available} left</span>`;
          }
          tooltip = `${volunteerInfo.label}\n${volunteerInfo.time}\n${capacity.available} spots available`;
        }

        if (isSelected) {
          dayClass += ' selected';
        }

        // Add type class for styling (saturday, tuesday, special)
        dayClass += ` ${volunteerInfo.type}`;
        
      } else if (isPast) {
        dayClass += ' past';
      }

      html += `
        <div class="${dayClass}" 
             data-date="${dateKey}" 
             ${isClickable ? 'data-clickable="true"' : ''}
             ${tooltip ? `title="${tooltip}"` : ''}>
          <span class="day-number">${day}</span>
          ${statusHtml}
        </div>
      `;
    }

    html += `
        </div>
        
        <div class="calendar-legend">
          <div class="legend-item">
            <span class="legend-dot saturday"></span>
            <span>First Saturday</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot tuesday"></span>
            <span>Third Tuesday</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot special"></span>
            <span>Special Day</span>
          </div>
        </div>
      </div>
      
      <div class="selected-dates-container">
        <h4 class="selected-dates-title">Selected Dates:</h4>
        <div id="selected-dates-list" class="selected-dates-list">
          ${this.selectedDates.length === 0 ? '<p class="no-dates">No dates selected yet</p>' : ''}
        </div>
      </div>
      <div class="error-message" id="dates-error">Please select at least one date</div>
    `;

    this.container.innerHTML = html;
    this.renderSelectedDates();
    this.attachEventListeners();
  }

  // Render selected dates list
  renderSelectedDates() {
    const listEl = document.getElementById('selected-dates-list');
    if (!listEl) return;

    if (this.selectedDates.length === 0) {
      listEl.innerHTML = '<p class="no-dates">No dates selected yet</p>';
      return;
    }

    let html = '';
    this.selectedDates.forEach(dateKey => {
      const info = this.volunteerDates.get(dateKey);
      if (info) {
        // Determine badge class based on type
        let badgeClass = 'selected-date-badge';
        if (info.type === 'saturday') badgeClass += ' saturday';
        else if (info.type === 'tuesday') badgeClass += ' tuesday';
        else badgeClass += ' special';

        html += `
          <div class="selected-date-item" data-date="${dateKey}">
            <input type="hidden" name="volunteer_dates" value="${this.formatDisplayDate(info.date)}">
            <div class="selected-date-info">
              <div class="selected-date-header">
                <span class="selected-date-day">${this.formatDisplayDate(info.date)}</span>
                <span class="${badgeClass}">${info.label}</span>
              </div>
              <span class="selected-date-time">${info.time}</span>
              ${info.notes ? `<span class="selected-date-notes">${info.notes}</span>` : ''}
            </div>
            <button type="button" class="selected-date-remove" data-date="${dateKey}" aria-label="Remove date">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        `;
      }
    });

    listEl.innerHTML = html;

    // Attach remove listeners
    listEl.querySelectorAll('.selected-date-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDate(btn.dataset.date);
      });
    });
  }

  // Toggle date selection
  toggleDate(dateKey) {
    const index = this.selectedDates.indexOf(dateKey);
    
    if (index > -1) {
      this.selectedDates.splice(index, 1);
    } else {
      this.selectedDates.push(dateKey);
    }

    // Update calendar day styling
    const dayEl = this.container.querySelector(`[data-date="${dateKey}"]`);
    if (dayEl) {
      dayEl.classList.toggle('selected', this.selectedDates.includes(dateKey));
    }

    // Update selected dates list
    this.renderSelectedDates();

    // Hide error if dates selected
    const errorMsg = document.getElementById('dates-error');
    if (errorMsg && this.selectedDates.length > 0) {
      errorMsg.classList.remove('visible');
    }

    // Callback
    if (this.options.onSelectionChange) {
      this.options.onSelectionChange(this.getSelectedDates());
    }
  }

  // Attach event listeners
  attachEventListeners() {
    // Navigation
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevMonth());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextMonth());
    }

    // Day selection
    this.container.querySelectorAll('.calendar-day[data-clickable="true"]').forEach(day => {
      day.addEventListener('click', () => {
        this.toggleDate(day.dataset.date);
      });
    });
  }

  // Get selected dates (formatted for display)
  getSelectedDates() {
    return this.selectedDates.map(dateKey => {
      const info = this.volunteerDates.get(dateKey);
      if (info) {
        return `${this.formatDisplayDate(info.date)} (${info.label} - ${info.time})`;
      }
      return dateKey;
    });
  }

  // Get selected dates with full info (for API submission)
  getSelectedDatesData() {
    return this.selectedDates.map(dateKey => {
      const info = this.volunteerDates.get(dateKey);
      return {
        date: dateKey,
        sessionId: info?.id || null,
        label: info?.label || '',
        time: info?.time || '',
        type: info?.type || 'custom'
      };
    });
  }

  // Validate selection
  validate() {
    const errorMsg = document.getElementById('dates-error');
    
    if (this.selectedDates.length === 0) {
      if (errorMsg) errorMsg.classList.add('visible');
      return false;
    }
    
    if (errorMsg) errorMsg.classList.remove('visible');
    return true;
  }

  // Refresh data from Directus
  async refresh() {
    this.volunteerDates.clear();
    this.isLoading = true;
    this.renderLoading();
    
    if (this.options.directusUrl) {
      await this.fetchVolunteerDates();
    } else if (this.options.useFallbackDates) {
      this.calculateFallbackDates();
    }
    
    this.isLoading = false;
    this.render();
  }
}

// Export
window.VolunteerCalendar = VolunteerCalendar;
