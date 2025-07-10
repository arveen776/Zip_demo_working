// script.js

const apiQuotes   = '/api/quotes';
const apiServices = '/api/services';

// ─── EMPLOYEE PAGE ─────────────────────────────────────────────────────────────
if (location.pathname.endsWith('employee.html')) {
  const select = document.getElementById('service-select');

  async function loadServices() {
    try {
      const res = await fetch(apiServices);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const services = await res.json();

      // Remember current choice
      const cur = select.value;

      // Clear existing but keep the placeholder
      select.innerHTML = '<option value="">-- Select service --</option>';

      // Re-populate
      services.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = `${s.name} ($${s.cost.toFixed(2)})`;
        select.appendChild(opt);
      });

      // Restore selection if still valid
      if (services.find(s => s.name === cur)) {
        select.value = cur;
      }
    } catch (err) {
      console.error('Error loading services:', err);
      select.innerHTML = '<option value="">Error loading services</option>';
    }
  }

  // Initial load + poll every 5 seconds
  loadServices();
  setInterval(loadServices, 5000);

  // Handle quote submission
  document.getElementById('quote-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('employee-name').value.trim();
    const desc = document.getElementById('service-select').value;
    const qty  = Number(document.getElementById('item-qty').value);
    if (!name || !desc || qty < 1) {
      document.getElementById('quote-result').textContent = 'Please complete all fields.';
      return;
    }
    try {
      const res = await fetch(apiQuotes, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, desc, qty})
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const {id, total} = await res.json();
      document.getElementById('quote-result').innerHTML =
        `<p>Quote ID ${id}: $${total.toFixed(2)}</p>`;
    } catch (err) {
      console.error('Error submitting quote:', err);
      document.getElementById('quote-result').innerHTML =
        `<p style="color:red;">Failed to submit quote.</p>`;
    }
  });

// ─── MANAGER PAGE ──────────────────────────────────────────────────────────────
} else if (location.pathname.endsWith('manager.html')) {
  // Load and display quotes
  async function loadQuotes() {
    try {
      const res    = await fetch(apiQuotes);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const quotes = await res.json();
      const tbody  = document.querySelector('#quotes-table tbody');
      tbody.innerHTML = quotes
        .map(q => q.quoteItems
          .map(item => `
            <tr>
              <td>${q.id}</td>
              <td>${q.employeeName}</td>
              <td>${item.service.name}</td>
              <td>${item.qty}</td>
              <td>$${item.lineTotal.toFixed(2)}</td>
            </tr>
          `).join('')
        ).join('');
      const totalValue = quotes
        .flatMap(q => q.quoteItems)
        .reduce((sum, i) => sum + i.lineTotal, 0);
      document.getElementById('summary').textContent =
        `Total Value: $${totalValue.toFixed(2)}`;
    } catch (err) {
      console.error('Error loading quotes:', err);
    }
  }

  // Load and display service catalog
  async function loadServices() {
    try {
      const res       = await fetch(apiServices);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const services = await res.json();
      const tbody     = document.querySelector('#services-table tbody');
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

      // Attach update handlers
      document.querySelectorAll('.update-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id          = btn.dataset.id;
          const name        = document.querySelector(`.edit-name[data-id='${id}']`).value;
          const description = document.querySelector(`.edit-desc[data-id='${id}']`).value;
          const cost        = document.querySelector(`.edit-cost[data-id='${id}']`).value;
          try {
            const res = await fetch(`${apiServices}/${id}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({name, description, cost})
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            loadServices();
          } catch (err) {
            console.error('Error updating service:', err);
          }
        });
      });

      // Attach delete handlers
      document.querySelectorAll('.delete-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            const res = await fetch(`${apiServices}/${id}`, {method: 'DELETE'});
            if (res.status === 204) loadServices();
            else throw new Error(`Status ${res.status}`);
          } catch (err) {
            console.error('Error deleting service:', err);
          }
        });
      });

    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  // Handle new service creation
  document.getElementById('service-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name        = document.getElementById('service-name').value.trim();
    const description = document.getElementById('service-desc').value.trim();
    const cost        = document.getElementById('service-cost').value;
    if (!name || cost === '') return;
    try {
      const res = await fetch(apiServices, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, description, cost})
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      document.getElementById('service-form').reset();
      loadServices();
    } catch (err) {
      console.error('Error creating service:', err);
    }
  });

  // Initial load & polling
  loadQuotes();
  setInterval(loadQuotes, 5000);
  loadServices();
  setInterval(loadServices, 5000);
}
