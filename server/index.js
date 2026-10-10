import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { predictRisk } from './risk_model.js';

const app = express();
const port = Number(process.env.PORT) || 3001;
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientBuildDirectory = path.resolve(serverDirectory, '../dist');

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || value.trim() === '') return NaN;
  return Number(value.replaceAll(',', '').replace(/^RM\s*/i, '').trim());
};

function validateInput(body = {}) {
  const source = body && typeof body === 'object' ? body : {};
  const fields = {
    revenue: parseNumber(source.revenue),
    expenses: parseNumber(source.expenses),
    payroll: parseNumber(source.payroll),
    employees: parseNumber(source.employees),
  };
  const errors = {};

  if (!Number.isFinite(fields.revenue) || fields.revenue <= 0 || fields.revenue > 1_000_000_000) {
    errors.revenue = 'Enter monthly revenue greater than RM 0.';
  }
  for (const field of ['expenses', 'payroll']) {
    if (!Number.isFinite(fields[field]) || fields[field] < 0 || fields[field] > 1_000_000_000) {
      errors[field] = 'Enter a monthly amount of RM 0 or more.';
    }
  }
  if (!Number.isInteger(fields.employees) || fields.employees < 1 || fields.employees > 1_000_000) {
    errors.employees = 'Enter a whole number of at least 1.';
  }

  return { fields, errors };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: 'demo-rules' });
});

app.use(express.static(clientBuildDirectory));

app.post('/api/predict', (req, res) => {
  const { fields, errors } = validateInput(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Check the highlighted inputs and try again.', fields: errors });
  }

  try {
    return res.json({ prediction: predictRisk(fields) });
  } catch (error) {
    console.error('Prediction failed:', error);
    return res.status(500).json({ error: 'We could not calculate this scenario. Please try again.' });
  }
});

app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  return res.sendFile(path.join(clientBuildDirectory, 'index.html'), (error) => {
    if (error) next();
  });
});

app.listen(port, () => {
  console.log(`Nadi API listening on http://localhost:${port}`);
});
