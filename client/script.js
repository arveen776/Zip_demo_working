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




// script.js (manager section only; leave the rest intact)

} else if (location.pathname.endsWith('manager.html')) {
  // API endpoints (adjust if needed)
  const apiCustomers = '/api/customers';
  const apiQuotes    = '/api/quotes';
  const apiServices  = '/api/services';

  // Filter elements
  const customerSearch = document.getElementById('customer-search');
  const custFilter     = document.getElementById('filter-customer');
  const labelSearch    = document.getElementById('label-search');
  const labelFilter    = document.getElementById('filter-label');
  const clearBtn       = document.getElementById('clear-quotes');

  // Profile display
  const profileDiv = document.getElementById('manager-customer-profile');
  const pName      = document.getElementById('mgr-profile-name');
  const pPhone     = document.getElementById('mgr-profile-phone');
  const pAddress   = document.getElementById('mgr-profile-address');
  const pNotes     = document.getElementById('mgr-profile-notes');

  // Quotes container
  const quotesDiv = document.getElementById('quotes-container');

  // In‑memory data
  let allQuotes     = [];
  let customersList = [];
  let labelsList    = [];

  // ─── Load and bind customers to filter dropdown ────────────────────────────
  async function loadCustomerFilter() {
    try {
      const res  = await fetch(apiCustomers);
      const list = await res.json();
      customersList = list;

      // Rebuild dropdown
      const prev = custFilter.value;
      custFilter.innerHTML =
        '<option value="">All Customers</option>' +
        list.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      custFilter.value = prev;
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  }

  // ─── Build label list and populate label dropdown ────────────────────────
  function populateLabelFilter() {
    labelsList = Array.from(
      new Set(allQuotes.map(q => q.label).filter(l => l))
    );
    const prev = labelFilter.value;
    labelFilter.innerHTML =
      '<option value="">All Labels</option>' +
      labelsList.map(l => `<option value="${l}">${l}</option>`).join('');
    labelFilter.value = prev;
  }

  // ─── Fetch all quotes, update filters & UI ────────────────────────────────
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

  // ─── Render filtered quotes to the page ─────────────────────────────────
  async function renderQuotes() {
    const custId = custFilter.value;
    let filtered = custId
      ? allQuotes.filter(q => String(q.customerId) === custId)
      : allQuotes;

    const lbl = labelFilter.value;
    if (lbl) filtered = filtered.filter(q => q.label === lbl);

    // Show profile panel if a customer is selected
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
      } catch { /* ignore */ }
    } else {
      profileDiv.style.display = 'none';
    }

    // Group by customer name
    const groups = {};
    filtered.forEach(q => {
      const name = q.customer?.name || 'Unknown';
      groups[name] = groups[name] || [];
      groups[name].push(q);
    });

    // Build HTML
    quotesDiv.innerHTML = Object.entries(groups).map(([name, quotes]) => {
      const custTotal = quotes.reduce(
        (sum, q) =>
          sum +
          q.quoteItems.reduce((s, i) => s + i.lineTotal, 0),
        0
      );
      const htmlQuotes = quotes.map(q => {
        const qTotal = q.quoteItems.reduce((s, i) => s + i.lineTotal, 0);
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

  // ─── Auto‑match logic for customer and label search inputs ───────────────
  customerSearch.addEventListener('input', () => {
    const term = customerSearch.value.trim().toLowerCase();
    if (!term) {
      custFilter.value = '';
      renderQuotes();
      return;
    }
    const match = customersList.find(c =>
      c.name.toLowerCase().includes(term)
    );
    custFilter.value = match ? match.id : '';
    renderQuotes();
  });

  labelSearch.addEventListener('input', () => {
    const term = labelSearch.value.trim().toLowerCase();
    if (!term) {
      labelFilter.value = '';
      renderQuotes();
      return;
    }
    const match = labelsList.find(l =>
      l.toLowerCase().includes(term)
    );
    labelFilter.value = match || '';
    renderQuotes();
  });

  // ─── Handlers for dropdown changes & Clear All ───────────────────────────
  custFilter .addEventListener('change', renderQuotes);
  labelFilter.addEventListener('change', renderQuotes);

  clearBtn.addEventListener('click', async () => {
    if (!confirm('Delete all quotes?')) return;
    const r = await fetch(apiQuotes, { method: 'DELETE' });
    if (r.status === 204) {
      await fetchQuotes();
      alert('All quotes cleared.');
    } else {
      alert('Failed to clear quotes.');
    }
  });

  // ─── Initial load & polling ──────────────────────────────────────────────
  loadCustomerFilter().then(fetchQuotes);
  setInterval(fetchQuotes, 5000);

  // ─── SERVICE CATALOG CRUD (unchanged) ────────────────────────────────────
  // … your existing loadServices, form submit, etc. …




 // script.js (CUSTOMERS PAGE section)
} else if (location.pathname.endsWith('customers.html')) {
  // ── Element refs ─────────────────────────────────────────────────────
  const listSec        = document.getElementById('list-section');
  const detailSec      = document.getElementById('customer-detail');
  const custForm       = document.getElementById('customer-form');
  const tableBody      = document.querySelector('#customers-table tbody');
  const customerSearch = document.getElementById('customer-search');

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
