import { getCompanyFinancials } from '../server/company_data.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const { symbol, name } = request.body || {};
    return response.status(200).json(await getCompanyFinancials({ symbol, name }));
  } catch (error) {
    return response.status(502).json({ error: error.message || 'Company financials are unavailable.' });
  }
}
