import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { internalAuth } from './middleware/auth.js';
import { scansRouter } from './routes/scans.js';

const app = new Hono();

app.use('*', logger());

// Health check — no auth required
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'shipsafe-api' });
});

// All /api/* routes require internal auth
app.use('/api/*', internalAuth);

// Routes
app.route('/api/scans', scansRouter);

const port = Number(process.env.PORT) || 4000;

console.log(`ShipSafe API running on port ${port}`);

serve({ fetch: app.fetch, port });
