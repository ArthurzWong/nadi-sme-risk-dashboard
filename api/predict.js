import { predictRisk } from '../server/risk_model.js';

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || value.trim() === '') return Number.NaN;
  return Number(value.replaceAll(',', '').replace(/^RM\s*/i, '').trim());
};

function validateInput(body) {
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

export default function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const { fields, errors } = validateInput(request.body);
  if (Object.keys(errors).length > 0) {
    return response.status(400).json({ error: 'Check the highlighted inputs and try again.', fields: errors });
  }

  try {
    return response.status(200).json({ prediction: predictRisk(fields) });
  } catch (error) {
    console.error('Prediction failed:', error);
    return response.status(500).json({ error: 'We could not calculate this scenario. Please try again.' });
  }
}
