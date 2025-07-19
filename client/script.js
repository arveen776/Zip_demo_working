// -----------------------------------
// client/script.js
// -----------------------------------

// API endpoints
const apiCustomers = '/api/customers';
const apiQuotes    = '/api/quotes';
const apiServices  = '/api/services';

// script.js (only the EMPLOYEE PAGE section; keep your other page logic below unchanged)

if (location.pathname.endsWith('employee.html')) {
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

    // wire up auto‑match
    inpSearch.addEventListener('input', () => {
      const term = inpSearch.value.trim().toLowerCase();
      const filteredServices = servicesList.filter(s =>
        s.name.toLowerCase().includes(term)
      );
      sel.innerHTML =
        '<option value="">-- Select service --</option>' +
        filteredServices.map(s => {
          const cost = typeof s.cost === 'number' ? s.cost.toFixed(2) : 'N/A';
          return `<option value="${s.id}">${s.name} (${cost})</option>`;
        }).join('');
      if (filteredServices.some(s => String(s.id) === sel.value)) {
        // Keep selected value if it's still in the filtered list
      } else {
        sel.value = ''; // Clear selection if not in filtered list
      }
      populateServiceSelect(sel, filteredServices);
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
  function showCustomerProfile(customer) {
    pName.textContent    = customer.name;
    pPhone.textContent   = customer.phone   || '–';
    pAddress.textContent = customer.address || '–';
    pNotes.textContent   = customer.notes   || '';
    profileDiv.classList.remove('hidden');
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

  //────── Initialize page ──────
  (async () => {
    await loadCustomers();
    await loadServices();
    linesBody.appendChild(newLineRow());
  })();

  // Keep dropdowns fresh
  setInterval(loadCustomers, 5000);
  setInterval(loadServices, 5000);
  updateEstimatedTotal(); // Initial calculation

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

    const labels = Object.keys(serviceCounts);
    const data = Object.values(serviceCounts);

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
    const labels = sortedServices.map(([name,]) => name);
    const data = sortedServices.map(([,revenue]) => revenue);

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

  const chartLabels = Object.keys(chartData);
  const chartValues = Object.values(chartData);

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
  }

  function showCustomerProfile(customer) {
    const modal = document.getElementById('quote-detail-modal');
    const content = document.getElementById('quote-detail-content');
    content.innerHTML = `
      <h4>Customer Profile</h4>
      <p><strong>Name:</strong> ${customer.name}</p>
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
      }
    });
  });


  // Initial load & polling
  loadCustomerFilter().then(fetchQuotes);
  setInterval(fetchQuotes, 5000);

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

      // Attach Quote Status Change handlers
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
              // Update local data and re-render charts
              const updatedQuote = await res.json();
              const index = allQuotes.findIndex(q => q.id == quoteId);
              if (index !== -1) {
                allQuotes[index].status = updatedQuote.status;
              }
              renderServiceFrequencyChart();
              renderQuoteStatusChart();
              renderTopServicesRevenueChart();
            } else {
              alert('Failed to update quote status.');
            }
          } catch (err) {
            console.error('Error updating quote status:', err);
            alert('Failed to update quote status.');
          }
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

  // Initial load & polling for services
  loadServices();
  setInterval(loadServices, 5000);



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
        return `
          <tr>
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>${c.phone || ''}</td>
            <td>${c.address || ''}</td>
            <td>${c.notes || ''}</td>
            <td>${totalSpending.toFixed(2)}</td>
            <td>${lastQuoteDate}</td>
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
          <td colspan="7" style="text-align:center; padding:1rem; color:red;">
            Failed to load customers.
          </td>
        </tr>`;
    }
  }

  // ── Live‐filter binding ────────────────────────────────────────────────
  customerSearch.addEventListener('input', e =>
    renderCustomers(e.target.value.trim())
  );

  // ── Add‐Customer form ────────────────────────────────────────────────
  custForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name:    document.getElementById('cust-name').value.trim(),
      phone:   document.getElementById('cust-phone').value.trim(),
      address: document.getElementById('cust-address').value.trim(),
      notes:   document.getElementById('cust-notes').value.trim()
    };
    if (!payload.name) {
      alert('Name is required.');
      return;
    }
    const res = await fetch('/api/customers', {
      method:  'POST',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify(payload)
    });
    if (res.ok) {
      custForm.reset();
      await loadCustomers();
    } else {
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
    } catch (err) {
      console.error('Error fetching customer detail:', err);
    }
  }

  // ── Edit profile inline ──────────────────────────────────────────────
  editBtn.addEventListener('click', () => {
    document.getElementById('edit-name').value    = currentCust.name;
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

  // ── Back to list ──────────────────────────────────────────────────────
  backBtn.addEventListener('click', () => {
    detailSec.classList.add('hidden');
    listSec.classList.remove('hidden');
    loadCustomers();
  });

  // ── Initialize ────────────────────────────────────────────────────────
  loadCustomers();
}
