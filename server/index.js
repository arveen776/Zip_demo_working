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
app.use(express.static(path.join(__dirname, '../client')));

// ─── CREATE QUOTE ─────────────────────────────────────────────────────────────
app.post('/api/quotes', async (req, res) => {
  // Expected payload: { customer: <Int>, label: <String>, items: [ { serviceId, qty }, … ] }
  const { customer, label, items } = req.body;

  // Basic validation
  if (
    !customer ||
    typeof label !== 'string' ||
    !label.trim() ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      error:
        'Payload must include customer (ID), non-empty items array, and a quote label.'
    });
  }

  try {
    // 1) Create the new Quote header, linking to the Customer and storing the label
    const quote = await prisma.quote.create({
      data: {
        label:       label.trim(),
        customer:    { connect: { id: Number(customer) } },
        // If you still want to record the technician name, add:
        // employeeName: req.body.employeeName || 'Unknown Technician',
      }
    });

    // 2) Loop through each line-item, fetch its cost, create QuoteItem, sum total
    let total = 0;
    for (const { serviceId, qty } of items) {
      const id = Number(serviceId);
      const q  = Number(qty);
      if (!id || q < 1) continue;

      const svc = await prisma.service.findUnique({ where: { id } });
      if (!svc) continue;

      const lineTotal = svc.cost * q;
      total += lineTotal;

      await prisma.quoteItem.create({
        data: {
          quoteId:   quote.id,
          serviceId: id,
          qty:       q,
          lineTotal
        }
      });
    }

    // 3) Return the new Quote ID, label, and aggregate total
    return res.json({
      id:    quote.id,
      label: quote.label,
      total
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── FETCH QUOTES ─────────────────────────────────────────────────────────────
app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        quoteItems: { include: { service: true } }
      },
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
    // 1) Remove every line-item
    await prisma.quoteItem.deleteMany();
    // 2) Then remove every quote
    await prisma.quote.deleteMany();
    return res.sendStatus(204);
  } catch (error) {
    console.error('Error clearing quotes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── SERVICE CRUD ──────────────────────────────────────────────────────────────

// List services
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create service
app.post('/api/services', async (req, res) => {
  try {
    const { name, description, cost } = req.body;
    if (!name || cost == null) {
      return res.status(400).json({ error: 'name and cost are required' });
    }
    const service = await prisma.service.create({
      data: { name, description, cost: parseFloat(cost) }
    });
    return res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update service
app.put('/api/services/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, cost } = req.body;
    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        cost: cost != null ? parseFloat(cost) : undefined
      }
    });
    return res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    return res.status(404).json({ error: 'Service not found' });
  }
});

// Delete service + cascade
app.delete('/api/services/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Remove dependent quoteItems
    await prisma.quoteItem.deleteMany({ where: { serviceId: id } });
    // Delete the service
    await prisma.service.delete({ where: { id } });
    return res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── CUSTOMER CRUD ─────────────────────────────────────────────────────────────

// List all customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { quotes: { include: { quoteItems: true } } },
      orderBy: { id: 'desc' }
    });
    res.json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 2) Fetch one customer by ID
app.get('/api/customers/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const cust = await prisma.customer.findUnique({
      where: { id },
      include: {
        quotes: {
          include: { quoteItems: { include: { service: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!cust) return res.status(404).json({ error: 'Customer not found' });
    res.json(cust);
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Create a new customer
app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const newCust = await prisma.customer.create({
      data: { name, phone, address, notes }
    });
    res.status(201).json(newCust);
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 4) Update an existing customer
app.put('/api/customers/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, address, phone, notes } = req.body;
  try {
    const cust = await prisma.customer.update({
      where: { id },
      data: { name, address, phone, notes }
    });
    res.json(cust);
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(404).json({ error: 'Customer not found' });
  }
});

// 5) Delete a customer (and their quotes/items)
app.delete('/api/customers/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    // remove linked quoteItems & quotes first
    await prisma.quoteItem.deleteMany({ where: { quote: { customerId: id } } });
    await prisma.quote.deleteMany({ where: { customerId: id } });
    // then delete customer
    await prisma.customer.delete({ where: { id } });
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update customer
app.put('/api/customers/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, address, notes } = req.body;
  const updated = await prisma.customer.update({
    where: { id },
    data: { name, phone, address, notes }
  });
  res.json(updated);
});

// Get a single quote (with items & services)
app.get('/api/quotes/:id', async (req, res) => {
  const id = Number(req.params.id);
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      quoteItems: { include: { service: true } }
    }
  });
  res.json(quote);
});

// Update quote label
app.put('/api/quotes/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { label } = req.body;
  const updated = await prisma.quote.update({
    where: { id },
    data: { label }
  });
  res.json(updated);
});

// ─── START SERVER ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
