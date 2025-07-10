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
  console.log('Incoming quote payload:', JSON.stringify(req.body));
  const { customer, items } = req.body;

  // Validate payload
  if (!customer || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ error: 'Payload must include customer and non-empty items array' });
  }

  try {
    // Create the quote header
    const quote = await prisma.quote.create({
      data: { employeeName: customer }
    });

    let total = 0;
    // Insert each line item
    for (const line of items) {
      const serviceId = Number(line.serviceId);
      const qty = Number(line.qty);
      if (!serviceId || qty < 1) continue;

      // Fetch service cost
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service) {
        console.warn(`Service ID ${serviceId} not found, skipping`);
        continue;
      }

      const lineTotal = service.cost * qty;
      total += lineTotal;

      await prisma.quoteItem.create({
        data: {
          quoteId: quote.id,
          serviceId,
          qty,
          lineTotal
        }
      });
    }

    return res.json({ id: quote.id, total });
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

// ─── START SERVER ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
