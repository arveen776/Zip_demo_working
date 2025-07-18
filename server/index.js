// server/index.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

// Create Express app
const app = express();

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the client folder
app.use(express.static(path.join(__dirname, '../client')));

// Serve root path with employee.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/employee.html'));
});

// Catch-all for direct access to HTML pages (employee, manager, customers)
app.get('/:page(employee|manager|customers)\.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', `${req.params.page}.html`));
});

// ─── CREATE QUOTE ─────────────────────────────────────────────────────────────
app.post('/api/quotes', async (req, res) => {
  const { customer, label, items } = req.body;
  if (
    !customer ||
    typeof label !== 'string' ||
    !label.trim() ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({ error: 'Payload must include customer (ID), non-empty items array, and a quote label.' });
  }

  try {
    const quote = await prisma.quote.create({
      data: {
        label:    label.trim(),
        customer: { connect: { id: Number(customer) } }
      }
    });

    let total = 0;
    for (const { serviceId, qty } of items) {
      const id = Number(serviceId);
      const q  = Number(qty);
      if (!id || q < 1) continue;

      const svc = await prisma.service.findUnique({ where: { id } });
      if (!svc) continue;

      const lineTotal = svc.cost * q;
      total += lineTotal;

      await prisma.quoteItem.create({ data: { quoteId: quote.id, serviceId: id, qty: q, lineTotal }});
    }

    return res.json({ id: quote.id, label: quote.label, total });
  } catch (error) {
    console.error('Error creating quote:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── FETCH QUOTES ─────────────────────────────────────────────────────────────
app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({
      include: { quoteItems: { include: { service: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── CLEAR ALL QUOTES ──────────────────────────────────────────────────────────
app.delete('/api/quotes', async (req, res) => {
  try {
    await prisma.quoteItem.deleteMany();
    await prisma.quote.deleteMany();
    return res.sendStatus(204);
  } catch (error) {
    console.error('Error clearing quotes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── SERVICE CRUD ──────────────────────────────────────────────────────────────
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { name: 'asc' }});
    return res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/services', async (req, res) => {
  try {
    const { name, description, cost } = req.body;
    if (!name || cost == null) return res.status(400).json({ error: 'name and cost are required' });
    const service = await prisma.service.create({ data: { name, description, cost: parseFloat(cost) }});
    return res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
app.put('/api/services/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, cost } = req.body;
    const service = await prisma.service.update({ where: { id }, data: { name, description, cost: cost != null ? parseFloat(cost) : undefined }});
    return res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    return res.status(404).json({ error: 'Service not found' });
  }
});
app.delete('/api/services/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.quoteItem.deleteMany({ where: { serviceId: id }});
    await prisma.service.delete({ where: { id }});
    return res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── CUSTOMER CRUD ─────────────────────────────────────────────────────────────
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({ include: { quotes: { include: { quoteItems: true } } }, orderBy: { id: 'desc' }});
    return res.json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/api/customers/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const cust = await prisma.customer.findUnique({ where: { id }, include: { quotes: { include: { quoteItems: { include: { service: true } }}, orderBy: { createdAt: 'desc' }}}});
    if (!cust) return res.status(404).json({ error: 'Customer not found' });
    return res.json(cust);
  } catch (err) {
    console.error('Error fetching customer:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const newCust = await prisma.customer.create({ data: { name, phone, address, notes }});
    return res.status(201).json(newCust);
  } catch (err) {
    console.error('Error creating customer:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
app.put('/api/customers/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, address, notes } = req.body;
  try {
    const cust = await prisma.customer.update({ where: { id }, data: { name, phone, address, notes }});
    return res.json(cust);
  } catch (err) {
    console.error('Error updating customer:', err);
    return res.status(404).json({ error: 'Customer not found' });
  }
});
app.delete('/api/customers/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.quoteItem.deleteMany({ where: { quote: { customerId: id } }});
    await prisma.quote.deleteMany({ where: { customerId: id }});
    await prisma.customer.delete({ where: { id }});
    return res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting customer:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── QUOTE DETAIL & UPDATE ────────────────────────────────────────────────────

// Fetch a single quote (with its items, services, and status)
app.get('/api/quotes/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        quoteItems: { include: { service: true } }
      }
    });
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    return res.json(quote);
  } catch (err) {
    console.error('Error fetching quote detail:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update quote label and/or status
app.put('/api/quotes/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { label, status } = req.body;

  // Build the update payload dynamically
  const data = {};
  if (label   !== undefined) data.label  = label.trim();
  if (status  !== undefined) data.status = status;

  try {
    const updated = await prisma.quote.update({
      where: { id },
      data
    });
    return res.json(updated);
  } catch (err) {
    console.error('Error updating quote:', err);
    return res.status(404).json({ error: 'Quote not found' });
  }
});


// ─── START SERVER ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
