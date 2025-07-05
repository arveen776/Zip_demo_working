const apiUrl = '/api/quotes';

if (location.pathname.endsWith('employee.html')) {
  // Employee page logic
  document.getElementById('quote-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const desc = document.getElementById('desc').value;
    const qty  = Number(document.getElementById('qty').value);

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name, desc, qty})
    });
    const quote = await res.json();
    document.getElementById('quote-result').innerHTML =
      `<p>Quote ID ${quote.id}: $${quote.total.toFixed(2)}</p>`;
  });

} else {
  // Manager page logic
  async function loadQuotes() {
    const res = await fetch(apiUrl);
    const quotes = await res.json();

    const tbody = document.querySelector('#quotes-table tbody');
    tbody.innerHTML = quotes.map(q =>
      `<tr>
         <td>${q.id}</td><td>${q.name}</td>
         <td>${q.desc}</td><td>${q.qty}</td>
         <td>$${q.total.toFixed(2)}</td>
       </tr>`).join('');

    const sum = quotes.reduce((acc,q) => acc+q.total,0);
    document.getElementById('summary').textContent =
      `Total Value: $${sum.toFixed(2)}`;
  }

  // Reload every 5s
  loadQuotes();
  setInterval(loadQuotes, 5000);
}
