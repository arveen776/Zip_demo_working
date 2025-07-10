const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Serve static files from client folder
app.use(express.static(path.join(__dirname, '../client')));

// ─── QUOTE ENDPOINTS ───────────────────────────────────────────────────────────

// Employee: Create a new quote
app.post('/api/quotes', async (req, res) => {
  try {
    const { name, desc, qty } = req.body;
    // Ensure service exists (default cost = 0)
    const service = await prisma.service.upsert({
      where: { name: desc },
      update: {},
      create: { name: desc, description: desc, cost: 0 }
    });

    // Create the quote and its line item
    const quote = await prisma.quote.create({
      data: {
        employeeName: name,
        quoteItems: {
          create: {
            service: { connect: { id: service.id } },
            qty,
            lineTotal: service.cost * qty
          }
        }
      },
      include: { quoteItems: true }
    });

    // Calculate total
    const total = quote.quoteItems.reduce((sum, item) => sum + item.lineTotal, 0);
    res.json({ id: quote.id, total });

  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manager: Fetch all quotes
app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        quoteItems: {
          include: { service: true }
        }
      }
    });
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── SERVICE CATALOG CRUD ───────────────────────────────────────────────────────

// List all services
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new service
app.post('/api/services', async (req, res) => {
  try {
    const { name, description, cost } = req.body;
    if (!name || cost == null) {
      return res.status(400).json({ error: 'name and cost are required' });
    }
    const service = await prisma.service.create({
      data: { name, description, cost: parseFloat(cost) }
    });
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an existing service
app.put('/api/services/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, cost } = req.body;
  try {
    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        cost: cost != null ? parseFloat(cost) : undefined
      }
    });
    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(404).json({ error: 'Service not found' });
  }
});

// Delete a service (cascade‐style)
app.delete('/api/services/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    // 1) Remove all quoteItems that reference this service
    await prisma.quoteItem.deleteMany({
      where: { serviceId: id }
    });

    // 2) Now delete the service itself
    await prisma.service.delete({
      where: { id }
    });

    return res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
