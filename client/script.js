// -----------------------------------
// client/script.js
// -----------------------------------

// ─── THEME SWITCHER ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const userRole = sessionStorage.getItem('userRole');
  const currentPage = location.pathname.split('/').pop();

  if (currentPage !== 'login.html' && !userRole) {
    window.location.href = 'login.html';
    return;
  }

  if (userRole === 'employee' && (currentPage === 'manager.html' || currentPage === 'customers.html')) {
    window.location.href = 'employee.html';
    return;
  }

  const nav = document.querySelector('.main-nav');
  if (nav) {
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout';
    logoutButton.id = 'logout-btn';
    logoutButton.addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      sessionStorage.removeItem('userRole');
      window.location.href = 'login.html';
    });
    nav.appendChild(logoutButton);
  }

  const themeSwitcher = document.getElementById('theme-switcher');
  const currentTheme = localStorage.getItem('theme') || 'light';

  document.documentElement.setAttribute('data-theme', currentTheme);

  if (currentTheme === 'dark') {
    themeSwitcher.textContent = '☀️';
  }

  themeSwitcher.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      themeSwitcher.textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      themeSwitcher.textContent = '☀️';
    }
  });
});


// API endpoints
const apiCustomers = '/api/customers';
const apiQuotes    = '/api/quotes';
const apiServices  = '/api/services';

// script.js (only the EMPLOYEE PAGE section; keep your other page logic below unchanged)

if (location.pathname.endsWith('login.html')) {
  const loginForm = document.getElementById('login-form');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('error-message');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput.value;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const { role } = await res.json();
        sessionStorage.setItem('userRole', role);
        if (role === 'manager') {
          window.location.href = 'manager.html';
        } else {
          window.location.href = 'employee.html';
        }
      } else {
        errorMessage.textContent = 'Invalid password';
        errorMessage.style.display = 'block';
      }
    } catch (err) {
      console.error('Login error:', err);
      errorMessage.textContent = 'An error occurred. Please try again.';
      errorMessage.style.display = 'block';
    }
  });
} else if (location.pathname.endsWith('employee.html')) {
  // API endpoints (adjust as needed)
  const apiCustomers = '/api/customers';
  const apiServices  = '/api/services';
  const apiQuotes    = '/api/quotes';

  // Customer elements
  const customerSearch = document.getElementById('customer-search');
  const custSelect     = document.getElementById('customer-select');
  const profileDiv     = document.getElementById('customer-profile');
  const pName          = document.getElementById('profile-name');
  const pPhone         = document.getElementById('profile-phone');
  const pAddress       = document.getElementById('profile-address');
  const pNotes         = document.getElementById('profile-notes');

  // Add customer elements
  const addCustomerBtn      = document.getElementById('add-customer-btn');
  const addCustomerForm     = document.getElementById('add-customer-form');
  const newCustomerForm     = document.getElementById('new-customer-form');
  const cancelNewCustomerBtn = document.getElementById('cancel-new-customer');

  // Quote elements
  const labelInput = document.getElementById('quote-label');
  const addLineBtn = document.getElementById('add-line');
  const submitBtn  = document.getElementById('submit-quote');
  const resultDiv  = document.getElementById('quote-result');
  const linesBody  = document.querySelector('#quote-lines tbody');
  const estimatedTotalSpan = document.getElementById('estimated-total');
  const clearQuoteBtn = document.getElementById('clear-quote');

  // Appointment display elements
  const refreshAppointmentsBtn = document.getElementById('refresh-appointments');
  const appointmentFilter = document.getElementById('appointment-filter');
  const appointmentsContainer = document.getElementById('appointments-container');

  // In‑memory lists
  let customersList = [];
  let servicesList  = [];

  //────── Create a new line row with both search + select + qty ──────
  function newLineRow() {
    const tr = document.createElement('tr');
    tr.classList.add('line-row');

    // search cell
    const tdSearch = document.createElement('td');
    const inpSearch = document.createElement('input');
    inpSearch.type = 'text';
    inpSearch.className = 'service-search';
    inpSearch.placeholder = 'Type to search…';
    inpSearch.autocomplete = 'off';
    tdSearch.appendChild(inpSearch);

    // select cell
    const tdSelect = document.createElement('td');
    const sel = document.createElement('select');
    sel.className = 'service-select';
    tdSelect.appendChild(sel);

    // qty cell
    const tdQty = document.createElement('td');
    const inpQty = document.createElement('input');
    inpQty.type = 'number';
    inpQty.className = 'service-qty';
    inpQty.min = 1;
    inpQty.value = 1;
    tdQty.appendChild(inpQty);

    // remove cell
    const tdRm = document.createElement('td');
    const btnRm = document.createElement('button');
    btnRm.type = 'button';
    btnRm.className = 'remove-line secondary';
    btnRm.textContent = '×';
    btnRm.addEventListener('click', () => {
      tr.remove();
      updateEstimatedTotal();
    });
    tdRm.appendChild(btnRm);

    tr.append(tdSearch, tdSelect, tdQty, tdRm);

    // wire up live‑filter + top‑match auto‑select
    inpSearch.addEventListener('input', () => {
      const term = inpSearch.value.trim().toLowerCase();
      const servicesToDisplay = term === ''
        ? servicesList
        : servicesList.filter(s => s.name.toLowerCase().includes(term));

      // 1) rebuild the dropdown to only matching services
      populateServiceSelect(sel, servicesToDisplay);

      // 2) auto‑select the very first match (if any)
      if (servicesToDisplay.length > 0) {
        sel.value = String(servicesToDisplay[0].id);
      }

      // 3) update the running total
      updateEstimatedTotal();
    });

    // Add event listeners for changes to update total
    sel.addEventListener('change', () => {
      updateEstimatedTotal();
    });
    inpQty.addEventListener('input', updateEstimatedTotal);

    // Populate services dropdown for this new row initially
    populateServiceSelect(sel);
    updateEstimatedTotal();

    return tr;
  }

  // Helper function to populate service select dropdowns
  function populateServiceSelect(selectElement, services = servicesList) {
    const prev = selectElement.value;
    selectElement.innerHTML =
      '<option value="">-- Select service --</option>' +
      services.map(s => {
        const cost = typeof s.cost === 'number' ? s.cost.toFixed(2) : 'N/A';
        return `<option value="${s.id}">${s.name} (${cost})</option>`;
      }).join('');
    if (services.some(s => String(s.id) === prev)) {
      selectElement.value = prev;
    }
  }

  //────── Update Estimated Total ──────
  function updateEstimatedTotal() {
    let total = 0;
    Array.from(linesBody.children).forEach(tr => {
      const serviceId = tr.querySelector('select.service-select').value;
      const qty = parseInt(tr.querySelector('input.service-qty').value);
      const service = servicesList.find(s => String(s.id) === serviceId);
      if (service && qty > 0) {
        total += service.cost * qty;
      }
    });
    estimatedTotalSpan.textContent = total.toFixed(2);
  }

  //────── Load customers, populate select & in‑memory list ──────
  async function loadCustomers() {
    try {
      const res  = await fetch(apiCustomers);
      const list = await res.json();
      customersList = list;

      // repopulate dropdown
      const prev = custSelect.value;
      custSelect.innerHTML =
        '<option value="">-- Select customer --</option>' +
        list.map(c =>
          `<option value="${c.id}">${c.name}</option>`
        ).join('');
      custSelect.value = prev;

    } catch (err) {
      console.error('Error loading customers:', err);
    }
  }

  //────── Show profile panel for a given customer id ──────
  async function showCustomerProfile(customer) {
    pName.textContent    = customer.name;
    pPhone.textContent   = customer.phone   || '–';
    pAddress.textContent = customer.address || '–';
    pNotes.textContent   = customer.notes   || '';
    profileDiv.classList.remove('hidden');
    
    // Load next appointment for this customer
    await loadNextAppointment(customer.id);
  }

  //────── Bind the customer‑search input to auto‑select + show profile ──────
  customerSearch.addEventListener('input', () => {
    const term = customerSearch.value.trim().toLowerCase();
    if (!term) {
      custSelect.value = '';
      profileDiv.classList.add('hidden');
      return;
    }
    const match = customersList.find(c =>
      c.name.toLowerCase().includes(term)
    );
    if (match) {
      custSelect.value = match.id;
      showCustomerProfile(match);
    } else {
      custSelect.value = '';
      profileDiv.classList.add('hidden');
    }
  });

  //────── Load services, populate every service-select & in‑mem list ──────
  async function loadServices() {
    try {
      const res = await fetch(apiServices);
      servicesList = await res.json();

      // Populate all existing service-select dropdowns
      document.querySelectorAll('select.service-select').forEach(sel => {
        populateServiceSelect(sel);
      });
      updateEstimatedTotal(); // Update total after services are loaded
    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  //────── Load next appointment for a customer ──────
  async function loadNextAppointment(customerId) {
    try {
      const res = await fetch(`/api/appointments/next/${customerId}`);
      if (!res.ok) throw new Error(res.status);
      const appointment = await res.json();
      
      console.log('Next appointment response:', appointment); // Debug log
      
      const appointmentInfo = document.getElementById('appointment-info');
      if (appointment) {
        const date = new Date(appointment.date).toLocaleDateString();
        const time = appointment.time;
        const duration = `${appointment.duration} min`;
        const notes = appointment.notes || '';
        
        appointmentInfo.innerHTML = `
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Duration:</strong> ${duration}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        `;
        appointmentInfo.classList.remove('no-appointment');
      } else {
        appointmentInfo.innerHTML = '<p>No upcoming appointments scheduled</p>';
        appointmentInfo.classList.add('no-appointment');
      }
    } catch (err) {
      console.error('Error loading next appointment:', err);
      const appointmentInfo = document.getElementById('appointment-info');
      appointmentInfo.innerHTML = '<p>Unable to load appointment information</p>';
      appointmentInfo.classList.add('no-appointment');
    }
  }

  //────── Show/hide profile when user picks from dropdown ──────
  custSelect.addEventListener('change', () => {
    const selectedCustomer = customersList.find(c => String(c.id) === custSelect.value);
    if (selectedCustomer) {
      showCustomerProfile(selectedCustomer);
    } else {
      profileDiv.classList.add('hidden');
    }
  });

  //────── Show/hide the add customer form ──────
  addCustomerBtn.addEventListener('click', () => {
    addCustomerForm.classList.remove('hidden');
  });
  cancelNewCustomerBtn.addEventListener('click', () => {
    addCustomerForm.classList.add('hidden');
  });

  //────── Handle new customer form submission ──────
  newCustomerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name:    document.getElementById('new-cust-name').value.trim(),
      phone:   document.getElementById('new-cust-phone').value.trim(),
      address: document.getElementById('new-cust-address').value.trim(),
      notes:   document.getElementById('new-cust-notes').value.trim()
    };
    if (!payload.name) {
      alert('Name is required.');
      return;
    }
    try {
      const res = await fetch(apiCustomers, {
        method:  'POST',
        headers: {'Content-Type':'application/json'},
        body:    JSON.stringify(payload)
      });
      if (res.ok) {
        newCustomerForm.reset();
        addCustomerForm.classList.add('hidden');
        await loadCustomers();
        const newCustomer = await res.json();
        custSelect.value = newCustomer.id;
        showCustomerProfile(newCustomer);
      } else {
        alert('Error adding customer.');
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Failed to create customer.');
    }
  });

  //────── Load and display upcoming appointments ──────
  async function loadUpcomingAppointments() {
    try {
      appointmentsContainer.innerHTML = `
        <div class="loading-appointments">
          <i class="fas fa-spinner fa-spin"></i> Loading appointments...
        </div>
      `;

      const res = await fetch('/api/appointments');
      if (!res.ok) throw new Error(res.status);
      const allAppointments = await res.json();

      // Filter appointments based on current filter
      const filterValue = appointmentFilter.value;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let filteredAppointments = allAppointments.filter(apt => {
        // Fix timezone issue by creating date in local timezone
        const aptDate = new Date(apt.date);
        const localAptDate = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
        
        switch (filterValue) {
          case 'today':
            return localAptDate.getTime() === today.getTime() && apt.status === 'Scheduled';
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return localAptDate.getTime() === tomorrow.getTime() && apt.status === 'Scheduled';
          case 'week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return localAptDate >= today && localAptDate <= weekFromNow && apt.status === 'Scheduled';
          case 'all':
            return localAptDate >= today && apt.status === 'Scheduled';
          default:
            return localAptDate.getTime() === today.getTime() && apt.status === 'Scheduled';
        }
      });

      // Sort by date and time
      filteredAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
      });

      if (filteredAppointments.length === 0) {
        appointmentsContainer.innerHTML = `
          <div class="no-appointments">
            <i class="fas fa-calendar-times"></i>
            <p>No appointments found for the selected period.</p>
          </div>
        `;
        return;
      }

              const appointmentsHTML = filteredAppointments.map(apt => {
          // Fix timezone issue by creating date in local timezone
          const aptDate = new Date(apt.date);
          const localAptDate = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let cardClass = 'appointment-card';
          if (localAptDate.getTime() === today.getTime()) {
            cardClass += ' today';
          } else if (localAptDate.getTime() === today.getTime() + 86400000) { // tomorrow
            cardClass += ' upcoming';
          }

        const dateStr = new Date(apt.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });

        return `
          <div class="${cardClass}" data-customer-id="${apt.customerId}">
            <span class="appointment-status-badge ${apt.status.toLowerCase()}">${apt.status}</span>
            <div class="appointment-header">
              <div class="appointment-time">${apt.time}</div>
              <div class="appointment-date">${dateStr}</div>
            </div>
            <div class="appointment-customer">${apt.customer.name}</div>
            <div class="appointment-details">
              <strong>Duration:</strong> ${apt.duration} minutes<br>
              <strong>Phone:</strong> ${apt.customer.phone || 'N/A'}
            </div>
            ${apt.notes ? `<div class="appointment-notes">${apt.notes}</div>` : ''}
            <div class="appointment-actions">
              <button class="view-customer" onclick="selectCustomerForQuote(${apt.customerId})">
                <i class="fas fa-user"></i> Select Customer
              </button>
              <button class="mark-complete" onclick="markAppointmentComplete(${apt.id})">
                <i class="fas fa-check"></i> Complete
              </button>
              <button class="cancel-appointment" onclick="cancelAppointment(${apt.id})">
                <i class="fas fa-times"></i> Cancel
              </button>
            </div>
          </div>
        `;
      }).join('');

      appointmentsContainer.innerHTML = `
        <div class="appointments-grid">
          ${appointmentsHTML}
        </div>
      `;

    } catch (err) {
      console.error('Error loading appointments:', err);
      appointmentsContainer.innerHTML = `
        <div class="no-appointments">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load appointments. Please try again.</p>
        </div>
      `;
    }
  }

  //────── Appointment action functions ──────
  window.selectCustomerForQuote = function(customerId) {
    custSelect.value = customerId;
    const selectedCustomer = customersList.find(c => c.id === customerId);
    if (selectedCustomer) {
      showCustomerProfile(selectedCustomer);
    }
    // Scroll to quote section
    document.getElementById('quote-label').scrollIntoView({ behavior: 'smooth' });
  };

  window.markAppointmentComplete = async function(appointmentId) {
    if (!confirm('Mark this appointment as completed?')) return;
    
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ status: 'Completed' })
      });
      
      if (res.ok) {
        loadUpcomingAppointments();
      } else {
        alert('Failed to update appointment status.');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Failed to update appointment status.');
    }
  };

  window.cancelAppointment = async function(appointmentId) {
    if (!confirm('Cancel this appointment?')) return;
    
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ status: 'Cancelled' })
      });
      
      if (res.ok) {
        loadUpcomingAppointments();
      } else {
        alert('Failed to cancel appointment.');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Failed to cancel appointment.');
    }
  };

  //────── Initialize page ──────
  (async () => {
    await loadCustomers();
    await loadServices();
    linesBody.appendChild(newLineRow());
    await loadUpcomingAppointments();
  })();

  updateEstimatedTotal(); // Initial calculation

  // Appointment display event listeners
  refreshAppointmentsBtn.addEventListener('click', loadUpcomingAppointments);
  appointmentFilter.addEventListener('change', loadUpcomingAppointments);

  // "+ Add Service" button
  addLineBtn.addEventListener('click', () => {
    linesBody.appendChild(newLineRow());
    updateEstimatedTotal();
  });

  // "Clear Quote" button
  clearQuoteBtn.addEventListener('click', () => {
    custSelect.value = '';
    customerSearch.value = '';
    profileDiv.classList.add('hidden');
    labelInput.value = '';
    linesBody.innerHTML = '';
    linesBody.appendChild(newLineRow());
    updateEstimatedTotal();
    resultDiv.textContent = '';
  });

  // "Submit Quote" button
  submitBtn.addEventListener('click', async () => {
    const customerId = custSelect.value;
    const label      = labelInput.value.trim();

    if (!customerId) {
      resultDiv.textContent = 'Please select a customer.';
      return;
    }
    if (!label) {
      resultDiv.textContent = 'Please enter a quote label.';
      return;
    }

    const items = Array.from(linesBody.children)
      .map(tr => ({
        serviceId: tr.querySelector('select.service-select').value,
        qty:       tr.querySelector('input.service-qty').value
      }))
      .filter(i => i.serviceId && i.qty > 0);

    if (!items.length) {
      resultDiv.textContent = 'Add at least one service line.';
      return;
    }

    try {
      const res = await fetch(apiQuotes, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          customer: Number(customerId),
          label,
          items
        })
      });
      if (!res.ok) throw new Error(res.status);
      const { id, total } = await res.json();
      resultDiv.innerHTML =
        `<p>Quote #${id} (“${label}”) Total: $${total.toFixed(2)}</p>`;

      // reset form
      if (!location.hash) {
        customerSearch.value = '';
        custSelect.value     = '';
        profileDiv.classList.add('hidden');
      }
      labelInput.value = '';
      linesBody.innerHTML = '';
      linesBody.appendChild(newLineRow());
      updateEstimatedTotal();
    } catch (err) {
      console.error('Error submitting quote:', err);
      resultDiv.textContent = 'Failed to submit quote.';
    }
  });




// ─── MANAGER PAGE ─────────────────────────────────────────────────────────────
} else if (location.pathname.endsWith('manager.html')) {
  // API endpoints
  const apiCustomers = '/api/customers';
  const apiQuotes    = '/api/quotes';
  const apiServices  = '/api/services';


  // Filter elements
  const customerSearch = document.getElementById('customer-search');
  const custFilter     = document.getElementById('filter-customer');
  const labelSearch    = document.getElementById('label-search');
  const labelFilter    = document.getElementById('filter-label');
  const clearBtn       = document.getElementById('clear-quotes');
  const dateFromInput = document.getElementById('filter-date-from');
  const dateToInput   = document.getElementById('filter-date-to');


  // Profile display
  const profileDiv = document.getElementById('manager-customer-profile');
  const pName      = document.getElementById('mgr-profile-name');
  const pPhone     = document.getElementById('mgr-profile-phone');
  const pAddress   = document.getElementById('mgr-profile-address');
  const pNotes     = document.getElementById('mgr-profile-notes');
  const tabs       = document.querySelectorAll('#manager-tabs button');
  const panelQuotes  = document.getElementById('tab-quotes');
  const panelServices = document.getElementById('tab-services');
  const panelAnalytics = document.getElementById('tab-analytics');

  // KPIs
  const kpiRevenue  = document.getElementById('kpi-revenue');
  const kpiQuotes   = document.getElementById('kpi-quotes');
  const kpiAvgValue = document.getElementById('kpi-avg-value');

  // Chart
  const chartCanvas = document.getElementById('revenue-chart');
  let revenueChart  = null;
  let serviceFrequencyChart = null;
  let quoteStatusChart = null;
  let topServicesRevenueChart = null;
  let quotesPerCustomerChart = null;

  // Function to render service frequency chart
  function renderServiceFrequencyChart() {
    const serviceCounts = {};
    allQuotes.forEach(quote => {
      if (quote.quoteItems && Array.isArray(quote.quoteItems)) {
        quote.quoteItems.forEach(item => {
          if (item.service && item.service.name && typeof item.qty === 'number') {
            const serviceName = item.service.name;
            serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + item.qty;
          }
        });
      }
    });

    const sortedServiceCounts = Object.entries(serviceCounts).sort(([, a], [, b]) => b - a);
    const topN = 10; // Display top 10 services
    const labels = sortedServiceCounts.slice(0, topN).map(([name,]) => name);
    const data = sortedServiceCounts.slice(0, topN).map(([, count]) => count);

    if (serviceFrequencyChart) {
      serviceFrequencyChart.destroy();
    }

    const ctx = document.getElementById('service-frequency-chart').getContext('2d');
    serviceFrequencyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Service Frequency',
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Function to render quote status chart
  function renderQuoteStatusChart() {
    const statusCounts = {};
    allQuotes.forEach(quote => {
      if (quote.status) {
        const status = quote.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      } else {
        statusCounts['Pending'] = (statusCounts['Pending'] || 0) + 1; // Default to Pending if status is missing
      }
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    if (quoteStatusChart) {
      quoteStatusChart.destroy();
    }

    const ctx = document.getElementById('quote-status-chart').getContext('2d');
    quoteStatusChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }

  // Function to render top services by revenue chart
  function renderTopServicesRevenueChart() {
    const serviceRevenue = {};
    allQuotes.forEach(quote => {
      if (quote.quoteItems && Array.isArray(quote.quoteItems)) {
        quote.quoteItems.forEach(item => {
          if (item.service && item.service.name && typeof item.lineTotal === 'number') {
            const serviceName = item.service.name;
            serviceRevenue[serviceName] = (serviceRevenue[serviceName] || 0) + item.lineTotal;
          }
        });
      }
    });

    const sortedServices = Object.entries(serviceRevenue).sort(([,a],[,b]) => b - a);
    const topN = 10; // Display top 10 services
    const labels = sortedServices.slice(0, topN).map(([name,]) => name);
    const data = sortedServices.slice(0, topN).map(([,revenue]) => revenue);

    if (topServicesRevenueChart) {
      topServicesRevenueChart.destroy();
    }

    const ctx = document.getElementById('top-services-revenue-chart').getContext('2d');
    topServicesRevenueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue',
          data: data,
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Function to render quotes per customer chart
  function renderQuotesPerCustomerChart() {
    const customerQuotes = {};
    allQuotes.forEach(quote => {
      const customerName = quote.customer?.name || 'Unknown';
      customerQuotes[customerName] = (customerQuotes[customerName] || 0) + 1;
    });

    const labels = Object.keys(customerQuotes);
    const data = Object.values(customerQuotes);

    if (quotesPerCustomerChart) {
      quotesPerCustomerChart.destroy();
    }

    const ctx = document.getElementById('quotes-per-customer-chart').getContext('2d');
    quotesPerCustomerChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Quotes',
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }


  // Quotes container
  const quotesDiv = document.getElementById('quotes-container');

  // In‑memory data
  let allQuotes     = [];
  let customersList = [];
  let labelsList    = [];

  // Load customers for filter
  async function loadCustomerFilter() {
    try {
      const res  = await fetch(apiCustomers);
      customersList = await res.json();
      console.log('customersList after fetch:', customersList);
      const prev = custFilter.value;
      custFilter.innerHTML =
        '<option value="">All Customers</option>' +
        customersList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      custFilter.value = prev;
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  }
  

  // Build label options
  function populateLabelFilter() {
    labelsList = Array.from(new Set(allQuotes.map(q => q.label).filter(l=>l)));
    const prev = labelFilter.value;
    labelFilter.innerHTML =
      '<option value="">All Labels</option>' +
      labelsList.map(l => `<option value="${l}">${l}</option>`).join('');
    labelFilter.value = prev;
  }

  // Fetch quotes and render
  async function fetchQuotes() {
    try {
      const res = await fetch(apiQuotes);
      allQuotes = await res.json();
      console.log('allQuotes before customer mapping:', allQuotes);
      allQuotes.forEach(q => {
        q.customer = customersList.find(c => c.id === q.customerId);
      });
      console.log('allQuotes after customer mapping:', allQuotes);
      populateLabelFilter();
      renderQuotes();
    } catch (err) {
      console.error('Error fetching quotes:', err);
    }
  }

  // Render filtered quotes
async function renderQuotes() {
  const custId = custFilter.value;
  let filtered = custId
    ? allQuotes.filter(q => String(q.customerId) === custId)
    : allQuotes;

  // Label filter
  const lbl = labelFilter.value;
  if (lbl) filtered = filtered.filter(q => q.label === lbl);

  // ─── Date Range Filtering ──────────────────────────────────────────
  const fromDate = dateFromInput.value
    ? new Date(dateFromInput.value)
    : null;
  const toDate = dateToInput.value
    ? new Date(dateToInput.value)
    : null;
  if (fromDate) {
    filtered = filtered.filter(q => new Date(q.createdAt) >= fromDate);
  }
  if (toDate) {
    // include the entire "to" day
    const endOfTo = new Date(
      toDate.getTime() + 24 * 60 * 60 * 1000 - 1
    );
    filtered = filtered.filter(
      q => new Date(q.createdAt) <= endOfTo
    );
  }

  // Show customer profile if selected
  if (custId) {
    try {
      const r = await fetch(`${apiCustomers}/${custId}`);
      if (r.ok) {
        const c = await r.json();
        pName.textContent    = c.name;
        pPhone.textContent   = c.phone   || '–';
        pAddress.textContent = c.address || '–';
        pNotes.textContent   = c.notes   || '';
        profileDiv.style.display = 'block';
      }
    } catch {}
  } else {
    profileDiv.style.display = 'none';
  }

  // ... the rest of your existing grouping/rendering logic goes here ...

  // ─── KPI & Chart Rendering ──────────────────────────────────────────
  const totalRevenue = filtered.reduce((sum, q) => {
    return sum + q.quoteItems.reduce((s, i) => s + i.lineTotal, 0);
  }, 0);
  const totalQuotes = filtered.length;
  const avgQuoteValue = totalQuotes > 0 ? totalRevenue / totalQuotes : 0;

  kpiRevenue.textContent  = `${totalRevenue.toFixed(2)}`;
  kpiQuotes.textContent   = totalQuotes;
  kpiAvgValue.textContent = `${avgQuoteValue.toFixed(2)}`;

  // Chart Data
  const chartData = filtered.reduce((acc, q) => {
    const date = new Date(q.createdAt).toLocaleDateString();
    const quoteTotal = q.quoteItems.reduce((s, i) => s + i.lineTotal, 0);
    acc[date] = (acc[date] || 0) + quoteTotal;
    return acc;
  }, {});

  const sortedChartData = Object.entries(chartData).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  const chartLabels = sortedChartData.map(entry => entry[0]);
  const chartValues = sortedChartData.map(entry => entry[1]);

  if (revenueChart) {
    revenueChart.destroy();
  }
  revenueChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Revenue',
        data: chartValues,
        borderColor: '#1DB954',
        backgroundColor: 'rgba(29, 185, 84, 0.1)',
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });



    // Group by customer name
    const groups = {};
    filtered.forEach(q => {
      const name = q.customer?.name || 'Unknown';
      (groups[name] = groups[name]||[]).push(q);
    });

    // Build HTML
    quotesDiv.innerHTML = Object.entries(groups).map(([name, quotes]) => {
      const custTotal = quotes.reduce(
        (sum,q) => sum + q.quoteItems.reduce((s,i)=>s+i.lineTotal,0),
        0
      );
      const htmlQuotes = quotes.map(q => {
        const qTotal = q.quoteItems.reduce((s,i)=>s+i.lineTotal,0);
        return `
          <div class="quote-card">
            <h4>Quote #${q.id} — ${q.label||'–'} — ${new Date(q.createdAt).toLocaleDateString()}</h4>
            <div class="quote-status-control">
              <label>Status:</label>
              <select class="quote-status-select" data-id="${q.id}">
                <option value="Pending" ${q.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Approved" ${q.status === 'Approved' ? 'selected' : ''}>Approved</option>
                <option value="Rejected" ${q.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
              </select>
              <button class="view-quote-details" data-id="${q.id}">View Customer</button>
            </div>
            <table>
              <thead><tr><th>Service</th><th>Qty</th><th>Line Total</th></tr></thead>
              <tbody>
                ${q.quoteItems.map(i => `
                  <tr>
                    <td>${i.service.name}</td>
                    <td>${i.qty}</td>
                    <td>${i.lineTotal.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2"><strong>Subtotal</strong></td>
                  <td><strong>${qTotal.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
      }).join('');
      return `
        <section class="customer-section">
          <h2>${name} — Total: ${custTotal.toFixed(2)}</h2>
          ${htmlQuotes}
        </section><hr/>
      `;
    }).join('');

    // Attach event listeners for the new buttons
    document.querySelectorAll('.view-quote-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const quoteId = btn.dataset.id;
        const quote = allQuotes.find(q => String(q.id) === quoteId);
        const customer = customersList.find(c => c.id === quote.customerId);
        showCustomerProfile(customer);
      });
    });

    // Attach event listeners for the status change
    document.querySelectorAll('.quote-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const quoteId = e.target.dataset.id;
        const newStatus = e.target.value;
        try {
          const res = await fetch(`${apiQuotes}/${quoteId}`, {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) {
            // Update local data and re-render everything
            const updatedQuote = await res.json();
            const index = allQuotes.findIndex(q => q.id == quoteId);
            if (index !== -1) {
              allQuotes[index].status = updatedQuote.status;
            }
            renderQuotes();
          } else {
            alert('Failed to update quote status.');
          }
        } catch (err) {
          console.error('Error updating quote status:', err);
          alert('Failed to update quote status.');
        }
      });
    });
  }

  function showCustomerProfile(customer) {
    const modal = document.getElementById('quote-detail-modal');
    const content = document.getElementById('quote-detail-content');
    content.innerHTML = `
      <h4>Customer Profile</h4>
      <p><strong>Name:</strong> ${customer.name}</p>
      <p><strong>Email:</strong> ${customer.email || '–'}</p>
      <p><strong>Phone:</strong> ${customer.phone || '–'}</p>
      <p><strong>Address:</strong> ${customer.address || '–'}</p>
      <p><strong>Notes:</strong> ${customer.notes || ''}</p>
    `;
    modal.classList.remove('hidden');
  }

  document.getElementById('close-quote-detail-modal').addEventListener('click', () => {
    document.getElementById('quote-detail-modal').classList.add('hidden');
  });

  // Auto‑match search bindings
  customerSearch.addEventListener('input', () => {
    const term = customerSearch.value.trim().toLowerCase();
    custFilter.value = (customersList.find(c => c.name.toLowerCase().includes(term)) || {id:''}).id;
    renderQuotes();
  });
  labelSearch.addEventListener('input', () => {
    const term = labelSearch.value.trim().toLowerCase();
    labelFilter.value = labelsList.find(l => l.toLowerCase().includes(term)) || '';
    renderQuotes();
  });
  
  // Dropdown changes & clear all
  custFilter .addEventListener('change', renderQuotes);
  labelFilter.addEventListener('change', renderQuotes);
  clearBtn.addEventListener('click', async () => {
    if (!confirm('Delete all quotes?')) return;
    const r = await fetch(apiQuotes, { method: 'DELETE' });
    if (r.status === 204) {
      await fetchQuotes();
      alert('All quotes cleared.');
    } else alert('Failed to clear quotes.');
  // Date range filters
  dateFromInput.addEventListener('change', renderQuotes);
  dateToInput  .addEventListener('change', renderQuotes);
  });

    // Tab switching logic
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      // Activate the clicked tab
      tabs.forEach(b => b.classList.toggle('active', b === btn));

      // Show/hide panels
      if (btn.dataset.tab === 'quotes') {
        panelQuotes.classList.remove('hidden');
        panelServices.classList.add('hidden');
        panelAnalytics.classList.add('hidden');
      } else if (btn.dataset.tab === 'services') {
        panelServices.classList.remove('hidden');
        panelQuotes.classList.add('hidden');
        panelAnalytics.classList.add('hidden');
      } else if (btn.dataset.tab === 'analytics') {
        panelAnalytics.classList.remove('hidden');
        panelQuotes.classList.add('hidden');
        panelServices.classList.add('hidden');
        renderServiceFrequencyChart();
        renderQuoteStatusChart();
        renderTopServicesRevenueChart();
        renderQuotesPerCustomerChart();
      }
    });
  });


  // Initial load & polling
  loadCustomerFilter().then(fetchQuotes);

  // ─── SERVICE CATALOG CRUD ─────────────────────────────────────────────────
  async function loadServices() {
    try {
      const res = await fetch(apiServices);
      const services = await res.json();
      const tbody = document.querySelector('#services-table tbody');
      tbody.innerHTML = services.map(s => `
        <tr>
          <td>${s.id}</td>
          <td><input data-id="${s.id}" class="edit-name"  value="${s.name}" /></td>
          <td><input data-id="${s.id}" class="edit-desc"  value="${s.description||''}" /></td>
          <td><input data-id="${s.id}" class="edit-cost"  type="number" step="0.01" min="0" value="${s.cost.toFixed(2)}" /></td>
          <td>
            <button data-id="${s.id}" class="update-service">Save</button>
            <button data-id="${s.id}" class="delete-service">Delete</button>
          </td>
        </tr>`).join('');

      // Attach Save handlers
      document.querySelectorAll('.update-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id  = btn.dataset.id;
          const name = document.querySelector(`.edit-name[data-id="${id}"]`).value;
          const desc = document.querySelector(`.edit-desc[data-id="${id}"]`).value;
          const cost = parseFloat(document.querySelector(`.edit-cost[data-id="${id}"]`).value);
          await fetch(`${apiServices}/${id}`, {
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name, description: desc, cost })
          });
          loadServices();
        });
      });

      // Attach Delete handlers
      document.querySelectorAll('.delete-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          await fetch(`${apiServices}/${id}`, { method:'DELETE' });
          loadServices();
        });
      });
    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  // New service form
  document.getElementById('service-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name        = document.getElementById('service-name').value.trim();
    const description = document.getElementById('service-desc').value.trim();
    const cost        = parseFloat(document.getElementById('service-cost').value);
    if (!name || isNaN(cost)) {
      alert('Name and cost are required');
      return;
    }
    await fetch(apiServices, {
      method: 'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, description, cost })
    });
    document.getElementById('service-form').reset();
    loadServices();
  });

  // Initial load for services
  loadServices();



 // script.js (CUSTOMERS PAGE section)
} else if (location.pathname.endsWith('customers.html')) {
  // ── Element refs ─────────────────────────────────────────────────────
  const listSec        = document.getElementById('list-section');
  const detailSec      = document.getElementById('customer-detail');
  const custForm       = document.getElementById('customer-form');
  const tableBody      = document.querySelector('#customers-table tbody');
  const customerSearch = document.getElementById('customer-search');

  // KPIs
  const kpiTotalCustomers = document.getElementById('kpi-total-customers');
  const kpiTotalQuotes    = document.getElementById('kpi-total-quotes');
  const kpiTotalRevenue   = document.getElementById('kpi-total-revenue');

  const infoDiv                = document.getElementById('profile-display');
  const profileForm            = document.getElementById('profile-form');
  const editBtn                = document.getElementById('edit-profile');
  const cancelBtn              = document.getElementById('cancel-profile');
  const quotesT                = document.querySelector('#detail-quotes tbody');
  const totalTd                = document.getElementById('customer-total');
  const quoteDetailPanel       = document.getElementById('quote-detail-panel');
  const quoteDetailTableBody   = document.querySelector('#quote-detail-table tbody');
  const quoteDetailSubtotal    = document.getElementById('quote-detail-subtotal');
  const closeQuoteDetailBtn    = document.getElementById('close-quote-detail');
  const backBtn                = document.getElementById('back-to-list');

  // Appointment elements (for customer detail view)
  const addAppointmentBtn      = document.getElementById('add-appointment-btn');
  const addAppointmentForm     = document.getElementById('add-appointment-form');
  const appointmentForm        = document.getElementById('appointment-form');
  const cancelAppointmentBtn   = document.getElementById('cancel-appointment');
  const appointmentsTableBody  = document.querySelector('#detail-appointments tbody');

  // Appointment elements (for customer creation form)
  const scheduleAppointmentCheckbox = document.getElementById('schedule-appointment');
  const appointmentFields = document.getElementById('appointment-fields');
  const custAppointmentDate = document.getElementById('cust-appointment-date');
  const custAppointmentTime = document.getElementById('cust-appointment-time');
  const custAppointmentDuration = document.getElementById('cust-appointment-duration');
  const custAppointmentNotes = document.getElementById('cust-appointment-notes');

  // Debug: Check if appointment elements exist
  console.log('Appointment elements found:', {
    addAppointmentBtn: !!addAppointmentBtn,
    addAppointmentForm: !!addAppointmentForm,
    appointmentForm: !!appointmentForm,
    cancelAppointmentBtn: !!cancelAppointmentBtn,
    appointmentsTableBody: !!appointmentsTableBody,
    scheduleAppointmentCheckbox: !!scheduleAppointmentCheckbox,
    appointmentFields: !!appointmentFields
  });

  let customersList = [];
  let currentCust   = null;

  // ── Render customer list with optional name filter ─────────────────────
  function renderCustomers(filterText = '') {
    const term     = filterText.toLowerCase();
    const filtered = customersList.filter(c =>
      c.name.toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:1rem;">
            No customers match “${filterText}”
          </td>
        </tr>`;
    } else {
      tableBody.innerHTML = filtered.map(c => {
        const totalSpending = c.quotes.reduce((sum, q) => {
          return sum + q.quoteItems.reduce((itemSum, item) => itemSum + item.lineTotal, 0);
        }, 0);
        const lastQuoteDate = c.quotes.length > 0
          ? new Date(Math.max(...c.quotes.map(q => new Date(q.createdAt)))).toLocaleDateString()
          : 'N/A';
        
        // Format next appointment
        let nextAppointmentText = 'None';
        if (c.nextAppointment) {
          const date = new Date(c.nextAppointment.date).toLocaleDateString();
          const time = c.nextAppointment.time;
          nextAppointmentText = `${date} at ${time}`;
        }
        
        return `
          <tr>
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>${c.email || ''}</td>
            <td>${c.phone || ''}</td>
            <td>${c.address || ''}</td>
            <td>${c.notes || ''}</td>
            <td>${totalSpending.toFixed(2)}</td>
            <td>${lastQuoteDate}</td>
            <td>${nextAppointmentText}</td>
            <td>
              <button class="view-cust" data-id="${c.id}">View</button>
              <button class="del-cust"  data-id="${c.id}">Delete</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Attach handlers
    document.querySelectorAll('.view-cust').forEach(btn =>
      btn.addEventListener('click', () => showDetail(btn.dataset.id))
    );
    document.querySelectorAll('.del-cust').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this customer and all their quotes?')) return;
        const res = await fetch(`/api/customers/${btn.dataset.id}`, { method: 'DELETE' });
        if (res.status === 204) loadCustomers();
        else alert('Failed to delete customer.');
      })
    );
  }

  // ── Fetch customers from API, store and render ─────────────────────────
  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error(res.status);
      customersList = await res.json();
      
      // Fetch next appointments for all customers
      const customersWithAppointments = await Promise.all(
        customersList.map(async (customer) => {
          try {
            const appointmentRes = await fetch(`/api/appointments/next/${customer.id}`);
            if (appointmentRes.ok) {
              const nextAppointment = await appointmentRes.json();
              return { ...customer, nextAppointment };
            }
          } catch (err) {
            console.error(`Error fetching appointment for customer ${customer.id}:`, err);
          }
          return { ...customer, nextAppointment: null };
        })
      );
      
      customersList = customersWithAppointments;
      renderCustomers(customerSearch.value.trim());

      // Calculate and render KPIs
      const totalCustomers = customersList.length;
      const totalQuotes = customersList.reduce((sum, c) => sum + c.quotes.length, 0);
      const totalRevenue = customersList.reduce((sum, c) => {
        return sum + c.quotes.reduce((qSum, q) => {
          return qSum + q.quoteItems.reduce((iSum, i) => iSum + i.lineTotal, 0);
        }, 0);
      }, 0);

      kpiTotalCustomers.textContent = totalCustomers;
      kpiTotalQuotes.textContent = totalQuotes;
      kpiTotalRevenue.textContent = `${totalRevenue.toFixed(2)}`;

    } catch (err) {
      console.error('Error loading customers:', err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:1rem; color:red;">
            Failed to load customers.
          </td>
        </tr>`;
    }
  }

  // ── Live‐filter binding ────────────────────────────────────────────────
  customerSearch.addEventListener('input', e =>
    renderCustomers(e.target.value.trim())
  );

  // ── Appointment checkbox handler ─────────────────────────────────────
  if (scheduleAppointmentCheckbox) {
    scheduleAppointmentCheckbox.addEventListener('change', () => {
      if (scheduleAppointmentCheckbox.checked) {
        appointmentFields.classList.remove('hidden');
        // Set default date to today
        custAppointmentDate.value = new Date().toISOString().split('T')[0];
      } else {
        appointmentFields.classList.add('hidden');
      }
    });
  }

  // ── Add‐Customer form ────────────────────────────────────────────────
  custForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name:    document.getElementById('cust-name').value.trim(),
      email:   document.getElementById('cust-email').value.trim(),
      phone:   document.getElementById('cust-phone').value.trim(),
      address: document.getElementById('cust-address').value.trim(),
      notes:   document.getElementById('cust-notes').value.trim()
    };
    if (!payload.name) {
      alert('Name is required.');
      return;
    }

    // Check if appointment should be scheduled
    const shouldScheduleAppointment = scheduleAppointmentCheckbox && scheduleAppointmentCheckbox.checked;
    let appointmentData = null;

    if (shouldScheduleAppointment) {
      const appointmentDate = custAppointmentDate.value;
      const appointmentTime = custAppointmentTime.value;
      
      if (!appointmentDate || !appointmentTime) {
        alert('Please fill in both appointment date and time.');
        return;
      }

      appointmentData = {
        date: appointmentDate,
        time: appointmentTime,
        duration: parseInt(custAppointmentDuration.value) || 60,
        notes: custAppointmentNotes.value.trim()
      };
    }

    try {
      // First create the customer
      const customerRes = await fetch('/api/customers', {
        method:  'POST',
        headers: {'Content-Type':'application/json'},
        body:    JSON.stringify(payload)
      });
      
      if (!customerRes.ok) {
        alert('Error adding customer.');
        return;
      }

      const newCustomer = await customerRes.json();

      // If appointment data exists, create the appointment
      if (appointmentData) {
        const appointmentRes = await fetch('/api/appointments', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            customerId: newCustomer.id,
            ...appointmentData
          })
        });

        if (appointmentRes.ok) {
          alert(`Customer created successfully with appointment scheduled for ${appointmentData.date} at ${appointmentData.time}!`);
        } else {
          alert('Customer created but failed to schedule appointment.');
        }
      } else {
        alert('Customer created successfully!');
      }

      // Reset form
      custForm.reset();
      if (scheduleAppointmentCheckbox) {
        scheduleAppointmentCheckbox.checked = false;
        appointmentFields.classList.add('hidden');
      }
      await loadCustomers();
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Error adding customer.');
    }
  });

  // ── Show detail + profile + quotes ────────────────────────────────────
  async function showDetail(id) {
    listSec.classList.add('hidden');
    detailSec.classList.remove('hidden');

    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) throw new Error(res.status);
      const c = await res.json();
      currentCust = c;

      // Profile display
      infoDiv.innerHTML = `
        <p><strong>Name:</strong> ${c.name}</p>
        <p><strong>Email:</strong> ${c.email || '–'}</p>
        <p><strong>Phone:</strong> ${c.phone   || '–'}</p>
        <p><strong>Address:</strong> ${c.address|| '–'}</p>
        <p><strong>Notes:</strong> ${c.notes   || ''}</p>
      `;
      profileForm.classList.add('hidden');
      infoDiv.classList.remove('hidden');

      // Quotes table
      let sum = 0;
      quotesT.innerHTML = c.quotes.map(q => {
        const sub = q.quoteItems.reduce((a,i) => a + i.lineTotal, 0);
        sum += sub;
        return `
          <tr>
            <td>${q.id}</td>
            <td>${q.label || '–'}</td>
            <td>${new Date(q.createdAt).toLocaleDateString()}</td>
            <td>$${sub.toFixed(2)}</td>
            <td>
              <button class="view-quote" data-id="${q.id}">View Details</button>
              <button class="edit-quote" data-id="${q.id}">Edit Label</button>
            </td>
            <td>
              <select class="quote-status-select" data-id="${q.id}">
                <option value="Pending" ${q.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Approved" ${q.status === 'Approved' ? 'selected' : ''}>Approved</option>
                <option value="Rejected" ${q.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
              </select>
            </td>
          </tr>
        `;
      }).join('');
      totalTd.textContent = `$${sum.toFixed(2)}`;

      // Quote handlers
      document.querySelectorAll('.view-quote').forEach(btn =>
        btn.addEventListener('click', () => showQuoteDetail(btn.dataset.id))
      );
      document.querySelectorAll('.edit-quote').forEach(btn =>
        btn.addEventListener('click', () => editQuoteLabel(btn.dataset.id))
      );
      document.querySelectorAll('.quote-status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
          const quoteId = e.target.dataset.id;
          const newStatus = e.target.value;
          try {
            const res = await fetch(`/api/quotes/${quoteId}`, {
              method: 'PUT',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
              // Update the current customer's quotes in memory
              const updatedQuote = await res.json();
              const quoteIndex = currentCust.quotes.findIndex(q => q.id == quoteId);
              if (quoteIndex !== -1) {
                currentCust.quotes[quoteIndex].status = updatedQuote.status;
              }
              // Re-render the detail view to reflect the change
              showDetail(currentCust.id);
            } else {
              alert('Failed to update quote status.');
            }
          } catch (err) {
            console.error('Error updating quote status:', err);
            alert('Failed to update quote status.');
          }
        });
      });

      // Load and display appointments
      await loadAppointments();
    } catch (err) {
      console.error('Error fetching customer detail:', err);
    }
  }

  // ── Edit profile inline ──────────────────────────────────────────────
  editBtn.addEventListener('click', () => {
    document.getElementById('edit-name').value    = currentCust.name;
    document.getElementById('edit-email').value   = currentCust.email   || '';
    document.getElementById('edit-phone').value   = currentCust.phone   || '';
    document.getElementById('edit-address').value = currentCust.address || '';
    document.getElementById('edit-notes').value   = currentCust.notes   || '';
    profileForm.classList.remove('hidden');
    infoDiv.classList.add('hidden');
  });
  cancelBtn.addEventListener('click', () => {
    profileForm.classList.add('hidden');
    infoDiv.classList.remove('hidden');
  });
  profileForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name:    document.getElementById('edit-name').value.trim(),
      email:   document.getElementById('edit-email').value.trim(),
      phone:   document.getElementById('edit-phone').value.trim(),
      address: document.getElementById('edit-address').value.trim(),
      notes:   document.getElementById('edit-notes').value.trim()
    };
    const res = await fetch(`/api/customers/${currentCust.id}`, {
      method:  'PUT',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify(payload)
    });
    if (res.ok) showDetail(currentCust.id);
    else alert('Error updating profile.');
  });

  // ── Quote detail popup ────────────────────────────────────────────────
  async function showQuoteDetail(qid) {
    try {
      const res = await fetch(`/api/quotes/${qid}`);
      if (!res.ok) throw new Error(res.status);
      const q = await res.json();
      quoteDetailTableBody.innerHTML = q.quoteItems
        .map(i => `
          <tr>
            <td>${i.service.name}</td>
            <td>${i.qty}</td>
            <td>$${i.lineTotal.toFixed(2)}</td>
          </tr>`)
        .join('');
      const sub = q.quoteItems.reduce((a,i) => a + i.lineTotal, 0);
      quoteDetailSubtotal.textContent = `$${sub.toFixed(2)}`;
      quoteDetailPanel.classList.remove('hidden');
    } catch (err) {
      console.error('Error loading quote details:', err);
    }
  }
  closeQuoteDetailBtn.addEventListener('click', () => {
    quoteDetailPanel.classList.add('hidden');
  });

  // ── Edit quote label ──────────────────────────────────────────────────
  async function editQuoteLabel(qid) {
    const newLabel = prompt(`Enter new label for quote #${qid}:`);
    if (!newLabel) return;
    const res = await fetch(`/api/quotes/${qid}`, {
      method:  'PUT',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify({ label: newLabel })
    });
    if (res.ok) showDetail(currentCust.id);
    else alert('Error updating quote label.');
  }

  // ── Appointment Functions ────────────────────────────────────────────────
  async function loadAppointments() {
    try {
      const res = await fetch(`/api/appointments/customer/${currentCust.id}`);
      if (!res.ok) throw new Error(res.status);
      const appointments = await res.json();
      
      if (appointments.length === 0) {
        appointmentsTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center; padding:1rem; color:#666;">
              No appointments scheduled
            </td>
          </tr>`;
      } else {
        appointmentsTableBody.innerHTML = appointments.map(apt => {
          const date = new Date(apt.date).toLocaleDateString();
          const time = apt.time;
          const duration = `${apt.duration} min`;
          const status = apt.status;
          const notes = apt.notes || '';
          
          return `
            <tr>
              <td>${date}</td>
              <td>${time}</td>
              <td>${duration}</td>
              <td><span class="appointment-status ${status.toLowerCase()}">${status}</span></td>
              <td>${notes}</td>
              <td>
                <button class="edit-appointment" data-id="${apt.id}">Edit</button>
                <button class="delete-appointment" data-id="${apt.id}">Delete</button>
              </td>
            </tr>
          `;
        }).join('');

        // Attach appointment handlers
        document.querySelectorAll('.edit-appointment').forEach(btn =>
          btn.addEventListener('click', () => editAppointment(btn.dataset.id))
        );
        document.querySelectorAll('.delete-appointment').forEach(btn =>
          btn.addEventListener('click', () => deleteAppointment(btn.dataset.id))
        );
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      appointmentsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:1rem; color:red;">
            Failed to load appointments
          </td>
        </tr>`;
    }
  }

  async function editAppointment(appointmentId) {
    const newStatus = prompt('Enter new status (Scheduled, Completed, Cancelled, No-Show):');
    if (!newStatus) return;
    
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await loadAppointments();
      } else {
        alert('Failed to update appointment status.');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Failed to update appointment status.');
    }
  }

  async function deleteAppointment(appointmentId) {
    if (!confirm('Delete this appointment?')) return;
    
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      });
      if (res.status === 204) {
        await loadAppointments();
      } else {
        alert('Failed to delete appointment.');
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      alert('Failed to delete appointment.');
    }
  }

  // ── Appointment Form Handlers ─────────────────────────────────────────────
  addAppointmentBtn.addEventListener('click', () => {
    addAppointmentForm.classList.remove('hidden');
    // Set default date to today
    document.getElementById('appointment-date').value = new Date().toISOString().split('T')[0];
  });

  cancelAppointmentBtn.addEventListener('click', () => {
    addAppointmentForm.classList.add('hidden');
    appointmentForm.reset();
  });

  appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      customerId: currentCust.id,
      date: document.getElementById('appointment-date').value,
      time: document.getElementById('appointment-time').value,
      duration: parseInt(document.getElementById('appointment-duration').value),
      notes: document.getElementById('appointment-notes').value.trim()
    };

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        appointmentForm.reset();
        addAppointmentForm.classList.add('hidden');
        await loadAppointments();
      } else {
        alert('Error creating appointment.');
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
      alert('Failed to create appointment.');
    }
  });

  // ── Back to list ──────────────────────────────────────────────────────
  backBtn.addEventListener('click', () => {
    detailSec.classList.add('hidden');
    listSec.classList.remove('hidden');
    loadCustomers();
  });

  // ── Initialize ────────────────────────────────────────────────────────
  loadCustomers();
}
