import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { internalAuth } from './middleware/auth.js';
import { scansRouter } from './routes/scans.js';
import { reportsRouter } from './routes/reports.js';
import { accountRouter } from './routes/account.js';
import { scheduleMonitoring, runMonitoring } from './cron/monitoring.js';

const app = new Hono();

app.use('*', logger());

// Health check — no auth required
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'hardened-api' });
});

// Public routes — no auth required
app.route('/api/reports', reportsRouter);

// All other /api/* routes require internal auth
app.use('/api/*', internalAuth);

// Routes
app.route('/api/scans', scansRouter);
app.route('/api/account', accountRouter);

// Debug endpoint — trigger monitoring manually (remove before prod)
app.get('/api/debug/run-monitoring', async (c) => {
  const result = await runMonitoring();
  return c.json({ status: 'ok', ...result });
});

const port = Number(process.env.PORT) || 4000;

// Start cron jobs
scheduleMonitoring();

console.log(`Hardened API running on port ${port}`);

serve({ fetch: app.fetch, port });
