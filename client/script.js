// script.js

const apiQuotes   = '/api/quotes';
const apiServices = '/api/services';

// ─── EMPLOYEE PAGE ─────────────────────────────────────────────────────────────
if (location.pathname.endsWith('employee.html')) {
  const nameInput  = document.getElementById('employee-name');
  const addLineBtn = document.getElementById('add-line');
  const submitBtn  = document.getElementById('submit-quote');
  const resultDiv  = document.getElementById('quote-result');
  const linesBody  = document.querySelector('#quote-lines tbody');

  // Cached service list
  let servicesList = [];

  // Fetch latest services and update all selects
  async function loadServices() {
    try {
      const res = await fetch(apiServices);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      servicesList = await res.json();
      updateAllSelects();
    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  // Rebuild each <select> in existing rows
  function updateAllSelects() {
    document.querySelectorAll('#quote-lines select').forEach(select => {
      const prev = select.value;
      // Rebuild options
      select.innerHTML = '<option value="">-- Select service --</option>' +
        servicesList.map(s =>
          `<option value="${s.id}">${s.name} ($${s.cost.toFixed(2)})</option>`
        ).join('');
      // Restore previous selection if still available
      if (servicesList.some(s => String(s.id) === prev)) select.value = prev;
    });
  }

  // Create a new line item row
  function newLineRow() {
    const tr = document.createElement('tr');
    // Service cell
    const svcTd = document.createElement('td');
    const sel   = document.createElement('select');
    sel.innerHTML = '<option value="">-- Select service --</option>' +
      servicesList.map(s =>
        `<option value="${s.id}">${s.name} ($${s.cost.toFixed(2)})</option>`
      ).join('');
    svcTd.appendChild(sel);

    // Quantity cell
    const qtyTd = document.createElement('td');
    const qtyIn = document.createElement('input');
    qtyIn.type  = 'number';
    qtyIn.min   = 1;
    qtyIn.value = 1;
    qtyTd.appendChild(qtyIn);

    // Remove button cell
    const rmTd  = document.createElement('td');
    const rmBtn = document.createElement('button');
    rmBtn.type  = 'button';
    rmBtn.textContent = '×';
    rmBtn.onclick = () => tr.remove();
    rmTd.appendChild(rmBtn);

    tr.append(svcTd, qtyTd, rmTd);
    return tr;
  }

  // Initialize: load services + add first row
  (async () => {
    await loadServices();
    linesBody.appendChild(newLineRow());
  })();

  // Poll for new services every 5s
  setInterval(loadServices, 5000);

  // Add another line
  addLineBtn.addEventListener('click', () => {
    linesBody.appendChild(newLineRow());
  });

  // Submit bundled quote
  submitBtn.addEventListener('click', async () => {
    const customer = nameInput.value.trim();
    if (!customer) {
      resultDiv.textContent = 'Enter customer name.';
      return;
    }

    const items = Array.from(linesBody.children).map(tr => {
      return {
        serviceId: tr.querySelector('select').value,
        qty:       tr.querySelector('input').value
      };
    }).filter(i => i.serviceId && i.qty > 0);

    if (items.length === 0) {
      resultDiv.textContent = 'Add at least one valid line-item.';
      return;
    }

    try {
      const res = await fetch(apiQuotes, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, items })
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const { id, total } = await res.json();
      resultDiv.innerHTML = `<p>Quote #${id} Total: $${total.toFixed(2)}</p>`;
      // Reset form
      nameInput.value = '';
      linesBody.innerHTML = '';
      linesBody.appendChild(newLineRow());
    } catch (err) {
      console.error('Error submitting quote:', err);
      resultDiv.textContent = 'Error submitting quote.';
    }
  });


// ─── MANAGER PAGE ──────────────────────────────────────────────────────────────
} else if (location.pathname.endsWith('manager.html')) {
  // Load and display grouped quotes
  async function loadQuotes() {
    try {
      const res    = await fetch(apiQuotes);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const quotes = await res.json();
      const container = document.getElementById('quotes-container');
      container.innerHTML = '';

      quotes.forEach(q => {
        const section = document.createElement('section');
        section.innerHTML = `
          <h3>Quote #${q.id} – ${q.employeeName}</h3>
          <table>
            <thead><tr><th>Service</th><th>Qty</th><th>Line Total</th></tr></thead>
            <tbody>
              ${q.quoteItems.map(item => `
                <tr>
                  <td>${item.service.name}</td>
                  <td>${item.qty}</td>
                  <td>$${item.lineTotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>Subtotal</strong></td>
                <td><strong>$${q.quoteItems.reduce((s,i)=>s+i.lineTotal,0).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>`;
        container.appendChild(section);
      });
    } catch (err) {
      console.error('Error loading quotes:', err);
    }
  }

  // Load and display service catalog (CRUD) – unchanged from previous code
  async function loadServices() {
    try {
      const res      = await fetch(apiServices);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const services = await res.json();
      const tbody    = document.querySelector('#services-table tbody');
      tbody.innerHTML = services.map(s => `
        <tr>
          <td>${s.id}</td>
          <td><input data-id="${s.id}" class="edit-name" value="${s.name}" /></td>
          <td><input data-id="${s.id}" class="edit-desc" value="${s.description || ''}" /></td>
          <td><input data-id="${s.id}" class="edit-cost" type="number" step="0.01" min="0" value="${s.cost.toFixed(2)}" /></td>
          <td>
            <button data-id="${s.id}" class="update-service">Save</button>
            <button data-id="${s.id}" class="delete-service">Delete</button>
          </td>
        </tr>
      `).join('');

      // Attach update and delete handlers...
      document.querySelectorAll('.update-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id          = btn.dataset.id;
          const name        = document.querySelector(`.edit-name[data-id='${id}']`).value;
          const description = document.querySelector(`.edit-desc[data-id='${id}']`).value;
          const cost        = document.querySelector(`.edit-cost[data-id='${id}']`).value;
          try {
            const r = await fetch(`${apiServices}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, cost }) });
            if (!r.ok) throw new Error(r.statusText);
            loadServices();
          } catch (e) { console.error(e); }
        });
      });
      document.querySelectorAll('.delete-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            const r = await fetch(`${apiServices}/${id}`, { method: 'DELETE' });
            if (r.status === 204) loadServices();
            else throw new Error(r.statusText);
          } catch (e) { console.error(e); }
        });
      });

    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  // Service creation form handler
  document.getElementById('service-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name        = document.getElementById('service-name').value.trim();
    const description = document.getElementById('service-desc').value.trim();
    const cost        = document.getElementById('service-cost').value;
    if (!name || cost === '') return;
    try {
      const r = await fetch(apiServices, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, cost }) });
      if (!r.ok) throw new Error(r.statusText);
      document.getElementById('service-form').reset();
      loadServices();
    } catch (e) { console.error(e); }
  });

  // Initial load & polling
  loadQuotes(); setInterval(loadQuotes, 5000);
  loadServices(); setInterval(loadServices, 5000);

  // ─── Clear All Quotes Handler ─────────────────────────────────────────────
document.getElementById('clear-quotes').addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete ALL quotes?')) return;

  try {
    const res = await fetch(apiQuotes, { method: 'DELETE' });
    if (res.status === 204) {
      loadQuotes();            // refresh the UI
      alert('All quotes have been cleared.');
    } else {
      throw new Error(`Status ${res.status}`);
    }
  } catch (err) {
    console.error('Error clearing quotes:', err);
    alert('Failed to clear quotes.');
  }
});

}
