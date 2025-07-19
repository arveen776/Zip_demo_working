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

  // In‑memory lists
  let customersList = [];
  let servicesList  = [];

  //────── Bind a service‑search input to its select for auto‑match ──────
  function bindServiceSearch(inputEl, selectEl) {
    inputEl.addEventListener('input', () => {
      const term = inputEl.value.trim().toLowerCase();
      if (!term) {
        selectEl.value = '';
        return;
      }
      const match = servicesList.find(s =>
        s.name.toLowerCase().includes(term)
      );
      selectEl.value = match ? match.id : '';
    });
  }

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
    btnRm.addEventListener('click', () => tr.remove());
    tdRm.appendChild(btnRm);

    tr.append(tdSearch, tdSelect, tdQty, tdRm);

    // wire up auto‑match
    bindServiceSearch(inpSearch, sel);

    return tr;
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
  async function showCustomerProfile(id) {
    try {
      const res = await fetch(`${apiCustomers}/${id}`);
      if (!res.ok) return;
      const c = await res.json();
      pName.textContent    = c.name;
      pPhone.textContent   = c.phone   || '–';
      pAddress.textContent = c.address || '–';
      pNotes.textContent   = c.notes   || '';
      profileDiv.style.display = 'block';
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }

  //────── Bind the customer‑search input to auto‑select + show profile ──────
  customerSearch.addEventListener('input', () => {
    const term = customerSearch.value.trim().toLowerCase();
    if (!term) {
      custSelect.value = '';
      profileDiv.style.display = 'none';
      return;
    }
    const match = customersList.find(c =>
      c.name.toLowerCase().includes(term)
    );
    if (match) {
      custSelect.value = match.id;
      showCustomerProfile(match.id);
    } else {
      custSelect.value = '';
      profileDiv.style.display = 'none';
    }
  });

  //────── Load services, populate every service-select & in‑mem list ──────
  async function loadServices() {
    try {
      const res = await fetch(apiServices);
      servicesList = await res.json();

      document.querySelectorAll('select.service-select').forEach(sel => {
        const prev = sel.value;
        sel.innerHTML =
          '<option value="">-- Select service --</option>' +
          servicesList.map(s =>
            `<option value="${s.id}">${s.name} ($${s.cost.toFixed(2)})</option>`
          ).join('');
        if (servicesList.some(s => String(s.id) === prev)) {
          sel.value = prev;
        }
      });
    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  //────── Show/hide profile when user picks from dropdown ──────
  custSelect.addEventListener('change', () => {
    if (custSelect.value) showCustomerProfile(custSelect.value);
    else profileDiv.style.display = 'none';
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
        showCustomerProfile(newCustomer.id);
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

  // "+ Add Service" button
  addLineBtn.addEventListener('click', () => {
    linesBody.appendChild(newLineRow());
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
        profileDiv.style.display = 'none';
      }
      labelInput.value = '';
      linesBody.innerHTML = '';
      linesBody.appendChild(newLineRow());
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

  // Function to render service frequency chart
  function renderServiceFrequencyChart() {
    const serviceCounts = {};
    allQuotes.forEach(quote => {
      quote.quoteItems.forEach(item => {
        const serviceName = item.service.name;
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + item.qty;
      });
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
            <table>
              <thead><tr><th>Service</th><th>Qty</th><th>Line Total</th></tr></thead>
              <tbody>
                ${q.quoteItems.map(i => `
                  <tr>
                    <td>${i.service.name}</td>
                    <td>${i.qty}</td>
                    <td>$${i.lineTotal.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2"><strong>Subtotal</strong></td>
                  <td><strong>$${qTotal.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
      }).join('');
      return `
        <section class="customer-section">
          <h2>${name} — Total: $${custTotal.toFixed(2)}</h2>
          ${htmlQuotes}
        </section><hr/>
      `;
    }).join('');
  }

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
          <td colspan="6" style="text-align:center; padding:1rem;">
            No customers match “${filterText}”
          </td>
        </tr>`;
    } else {
      tableBody.innerHTML = filtered.map(c => `
        <tr>
          <td>${c.id}</td>
          <td>${c.name}</td>
          <td>${c.phone || ''}</td>
          <td>${c.address || ''}</td>
          <td>${c.notes || ''}</td>
          <td>
            <button class="view-cust" data-id="${c.id}">View</button>
            <button class="del-cust"  data-id="${c.id}">Delete</button>
          </td>
        </tr>
      `).join('');
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
          <td colspan="6" style="text-align:center; padding:1rem; color:red;">
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
        <p><strong>${c.name}</strong></p>
        <p>Phone: ${c.phone   || '–'}</p>
        <p>Address: ${c.address|| '–'}</p>
        <p>Notes: ${c.notes   || ''}</p>
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
