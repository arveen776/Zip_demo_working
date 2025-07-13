// -----------------------------------
// client/script.js
// -----------------------------------

// API endpoints
const apiCustomers = '/api/customers';
const apiQuotes    = '/api/quotes';
const apiServices  = '/api/services';

// ─── EMPLOYEE PAGE ─────────────────────────────────────────────────────────────
if (location.pathname.endsWith('employee.html')) {
  const custSelect  = document.getElementById('customer-select');
  const profileDiv  = document.getElementById('customer-profile');
  const pName       = document.getElementById('profile-name');
  const pPhone      = document.getElementById('profile-phone');
  const pAddress    = document.getElementById('profile-address');
  const pNotes      = document.getElementById('profile-notes');
  const labelInput  = document.getElementById('quote-label');
  const addLineBtn  = document.getElementById('add-line');
  const submitBtn   = document.getElementById('submit-quote');
  const resultDiv   = document.getElementById('quote-result');
  const linesBody   = document.querySelector('#quote-lines tbody');

  let servicesList = [];

  function getHashParams() {
    return location.hash
      .substring(1)
      .split('&')
      .reduce((acc, kv) => {
        const [k, v] = kv.split('=');
        if (k && v) acc[k] = decodeURIComponent(v);
        return acc;
      }, {});
  }

  async function loadCustomers() {
    try {
      const res  = await fetch(apiCustomers);
      const list = await res.json();
      const cur  = custSelect.value;
      custSelect.innerHTML =
        '<option value="">-- Select customer --</option>' +
        list.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

      const { c } = getHashParams();
      if (c) {
        custSelect.value    = c;
        custSelect.disabled = true;
        await showCustomerProfile(c);
      } else if (cur) {
        custSelect.value = cur;
      }
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  }

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

  // Immediately show/hide profile on dropdown change
  custSelect.addEventListener('change', () => {
    if (custSelect.value) showCustomerProfile(custSelect.value);
    else profileDiv.style.display = 'none';
  });

  async function loadServices() {
    try {
      const res = await fetch(apiServices);
      servicesList = await res.json();
      document.querySelectorAll('#quote-lines select').forEach(sel => {
        const prev = sel.value;
        sel.innerHTML =
          '<option value="">-- Select service --</option>' +
          servicesList.map(s =>
            `<option value="${s.id}">${s.name} ($${s.cost.toFixed(2)})</option>`
          ).join('');
        if (servicesList.some(s => String(s.id) === prev)) sel.value = prev;
      });
    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  function newLineRow() {
    const tr = document.createElement('tr');

    const svcTd = document.createElement('td');
    const sel   = document.createElement('select');
    sel.innerHTML =
      '<option value="">-- Select service --</option>' +
      servicesList.map(s =>
        `<option value="${s.id}">${s.name} ($${s.cost.toFixed(2)})</option>`
      ).join('');
    svcTd.appendChild(sel);

    const qtyTd = document.createElement('td');
    const qtyIn = document.createElement('input');
    qtyIn.type  = 'number';
    qtyIn.min   = 1;
    qtyIn.value = 1;
    qtyTd.appendChild(qtyIn);

    const rmTd  = document.createElement('td');
    const rmBtn = document.createElement('button');
    rmBtn.type  = 'button';
    rmBtn.textContent = '×';
    rmBtn.onclick     = () => tr.remove();
    rmTd.appendChild(rmBtn);

    tr.append(svcTd, qtyTd, rmTd);
    return tr;
  }

  (async () => {
    await loadCustomers();
    await loadServices();
    linesBody.appendChild(newLineRow());
  })();

  setInterval(loadCustomers, 5000);
  setInterval(loadServices, 5000);

  addLineBtn.onclick = () => linesBody.appendChild(newLineRow());

  submitBtn.onclick = async () => {
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
        serviceId: tr.querySelector('select').value,
        qty:       tr.querySelector('input').value
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

      if (!location.hash) {
        custSelect.value = '';
        profileDiv.style.display = 'none';
      }
      labelInput.value = '';
      linesBody.innerHTML = '';
      linesBody.appendChild(newLineRow());
    } catch (err) {
      console.error('Error submitting quote:', err);
      resultDiv.textContent = 'Failed to submit quote.';
    }
  };


// ─── MANAGER PAGE ─────────────────────────────────────────────────────────────
} else if (location.pathname.endsWith('manager.html')) {
  const custFilter   = document.getElementById('filter-customer');
  const labelFilter  = document.getElementById('filter-label');
  const clearBtn     = document.getElementById('clear-quotes');
  const profileDiv   = document.getElementById('manager-customer-profile');
  const pName        = document.getElementById('mgr-profile-name');
  const pPhone       = document.getElementById('mgr-profile-phone');
  const pAddress     = document.getElementById('mgr-profile-address');
  const pNotes       = document.getElementById('mgr-profile-notes');
  const quotesDiv    = document.getElementById('quotes-container');

  let allQuotes = [];

  async function loadCustomerFilter() {
    try {
      const res  = await fetch(apiCustomers);
      const list = await res.json();
      custFilter.innerHTML =
        '<option value="">All Customers</option>' +
        list.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (err) {
      console.error(err);
    }
  }

  function populateLabelFilter() {
    const labels = Array.from(
      new Set(allQuotes.map(q => q.label).filter(l => l))
    );
    labelFilter.innerHTML =
      '<option value="">All Labels</option>' +
      labels.map(l => `<option value="${l}">${l}</option>`).join('');
  }

  async function fetchQuotes() {
    try {
      const res = await fetch(apiQuotes);
      allQuotes = await res.json();
      populateLabelFilter();
      renderQuotes();
    } catch (err) {
      console.error(err);
    }
  }

  async function renderQuotes() {
    const custId = custFilter.value;
    let filtered = custId
      ? allQuotes.filter(q => String(q.customerId) === custId)
      : allQuotes;

    const lbl = labelFilter.value;
    if (lbl) filtered = filtered.filter(q => q.label === lbl);

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
      } catch { /*ignore*/ }
    } else {
      profileDiv.style.display = 'none';
    }

    const groups = {};
    filtered.forEach(q => {
      const name = q.customer?.name || 'Grand';
      groups[name] = groups[name] || [];
      groups[name].push(q);
    });

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
        </section><hr/>`;
    }).join('');
  }

  clearBtn.addEventListener('click', async () => {
    if (!confirm('Delete all quotes?')) return;
    const r = await fetch(apiQuotes, { method:'DELETE' });
    if (r.status === 204) {
      await fetchQuotes();
      alert('All quotes cleared.');
    } else {
      alert('Failed to clear quotes.');
    }
  });

  custFilter .addEventListener('change', renderQuotes);
  labelFilter.addEventListener('change', renderQuotes);

  loadCustomerFilter().then(fetchQuotes);
  setInterval(fetchQuotes, 5000);

  // ─── SERVICE CATALOG CRUD (UNCHANGED) ──────────────────────────────────────────
  async function loadServices() {
    try {
      const res      = await fetch(apiServices);
      const services = await res.json();
      const tbody    = document.querySelector('#services-table tbody');
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

      document.querySelectorAll('.update-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id          = btn.dataset.id;
          const name        = document.querySelector(`.edit-name[data-id="${id}"]`).value;
          const description = document.querySelector(`.edit-desc[data-id="${id}"]`).value;
          const cost        = document.querySelector(`.edit-cost[data-id="${id}"]`).value;
          await fetch(`${apiServices}/${id}`, {
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ name, description, cost })
          });
          loadServices();
        });
      });

      document.querySelectorAll('.delete-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const r  = await fetch(`${apiServices}/${id}`, { method:'DELETE' });
          if (r.status === 204) loadServices();
        });
      });

    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  document.getElementById('service-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name        = document.getElementById('service-name').value.trim();
    const description = document.getElementById('service-desc').value.trim();
    const cost        = document.getElementById('service-cost').value;
    await fetch(apiServices, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ name, description, cost })
    });
    document.getElementById('service-form').reset();
    loadServices();
  });

  loadServices();
  setInterval(loadServices, 5000);


 // ─── CUSTOMERS PAGE ────────────────────────────────────────────────────────────
} else if (location.pathname.endsWith('customers.html')) {
  const listSec     = document.getElementById('list-section');
  const detailSec   = document.getElementById('customer-detail');
  const custForm    = document.getElementById('customer-form');
  const tableB      = document.querySelector('#customers-table tbody');
  const infoDiv     = document.getElementById('profile-display');
  const profileForm = document.getElementById('profile-form');
  const editBtn     = document.getElementById('edit-profile');
  const cancelBtn   = document.getElementById('cancel-profile');
  const quotesT     = document.querySelector('#detail-quotes tbody');
  const totalTd     = document.getElementById('customer-total');
  const backBtn     = document.getElementById('back-to-list');

  let currentCust;  // holds the customer object when in detail view

  // 1) Fetch & render the customer list
  async function loadCustomers() {
    const res  = await fetch('/api/customers');
    const list = await res.json();
    tableB.innerHTML = list.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td>${c.phone || ''}</td>
        <td>${c.address || ''}</td>
        <td>${c.notes || ''}</td>
        <td>
          <button class="view-cust"  data-id="${c.id}">View</button>
          <button class="del-cust"   data-id="${c.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    // re-attach View handlers
    document.querySelectorAll('.view-cust').forEach(btn =>
      btn.onclick = () => showDetail(btn.dataset.id)
    );
    // re-attach Delete handlers
    document.querySelectorAll('.del-cust').forEach(btn =>
      btn.onclick = async () => {
        if (!confirm('Delete this customer and all their quotes?')) return;
        await fetch(`/api/customers/${btn.dataset.id}`, { method:'DELETE' });
        loadCustomers();
      }
    );
  }

  // 2) Handle Add-Customer form submission
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
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    if (res.ok) {
      custForm.reset();
      loadCustomers();
    } else {
      console.error('Failed to add customer:', res.status);
      alert('Error adding customer.');
    }
  });

  // 3) Show a single customer’s profile + quotes
  async function showDetail(id) {
    listSec.classList.add('hidden');
    detailSec.classList.remove('hidden');

    const res = await fetch(`/api/customers/${id}`);
    const c   = await res.json();
    currentCust = c;

    // render profile display
    infoDiv.innerHTML = `
      <p><strong>${c.name}</strong></p>
      <p>Phone: ${c.phone || '–'}</p>
      <p>Address: ${c.address || '–'}</p>
      <p>Notes: ${c.notes || ''}</p>
    `;

    // render quotes table & total
    let sum = 0;
    quotesT.innerHTML = c.quotes.map(q => {
      const st = q.quoteItems.reduce((a,i)=>a+i.lineTotal, 0);
      sum += st;
      return `
        <tr>
          <td>${q.id}</td>
          <td>${q.label || '–'}</td>
          <td>${new Date(q.createdAt).toLocaleDateString()}</td>
          <td>$${st.toFixed(2)}</td>
          <td>
            <button class="view-quote" data-id="${q.id}">View Details</button>
            <button class="edit-quote" data-id="${q.id}">Edit Label</button>
          </td>
        </tr>
      `;
    }).join('');
    totalTd.textContent = `$${sum.toFixed(2)}`;

    // attach quote handlers
    document.querySelectorAll('.view-quote').forEach(btn =>
      btn.onclick = () => showQuoteDetail(btn.dataset.id)
    );
    document.querySelectorAll('.edit-quote').forEach(btn =>
      btn.onclick = () => editQuoteLabel(btn.dataset.id)
    );
  }

  // 4) Edit customer profile inline
  editBtn.onclick = () => {
    document.getElementById('edit-name').value    = currentCust.name;
    document.getElementById('edit-phone').value   = currentCust.phone  || '';
    document.getElementById('edit-address').value = currentCust.address|| '';
    document.getElementById('edit-notes').value   = currentCust.notes  || '';
    profileForm.classList.remove('hidden');
    infoDiv.classList.add('hidden');
  };
  cancelBtn.onclick = () => {
    profileForm.classList.add('hidden');
    infoDiv.classList.remove('hidden');
  };
  profileForm.onsubmit = async e => {
    e.preventDefault();
    const payload = {
      name:    document.getElementById('edit-name').value.trim(),
      phone:   document.getElementById('edit-phone').value.trim(),
      address: document.getElementById('edit-address').value.trim(),
      notes:   document.getElementById('edit-notes').value.trim()
    };
    await fetch(`/api/customers/${currentCust.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    showDetail(currentCust.id);
  };

  // 5) Quote-detail popup
  async function showQuoteDetail(qid) {
    const r    = await fetch(`/api/quotes/${qid}`);
    const q    = await r.json();
    const panel= document.getElementById('quote-detail-panel');
    const tb   = document.querySelector('#quote-detail-table tbody');
    const ft   = document.getElementById('quote-detail-subtotal');

    tb.innerHTML = q.quoteItems.map(i => `
      <tr>
        <td>${i.service.name}</td>
        <td>${i.qty}</td>
        <td>$${i.lineTotal.toFixed(2)}</td>
      </tr>
    `).join('');
    const sub = q.quoteItems.reduce((a,i)=>a+i.lineTotal, 0);
    ft.textContent = `$${sub.toFixed(2)}`;
    panel.classList.remove('hidden');
  }
  document.getElementById('close-quote-detail').onclick = () => {
    document.getElementById('quote-detail-panel').classList.add('hidden');
  };

  // 6) Edit quote label
  async function editQuoteLabel(qid) {
    const newLabel = prompt(`Enter new label for quote #${qid}:`);
    if (!newLabel) return;
    await fetch(`/api/quotes/${qid}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ label: newLabel })
    });
    showDetail(currentCust.id);
  }

  // 7) Back button
  backBtn.onclick = () => {
    detailSec.classList.add('hidden');
    listSec.classList.remove('hidden');
    loadCustomers();
  };

  // 8) Kick things off
  loadCustomers();
}
