import { searchBursaCompanies } from '../server/company_data.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    return response.status(200).json({ companies: await searchBursaCompanies(String(request.query?.q || '')) });
  } catch (error) {
    return response.status(502).json({ error: error.message || 'Company search is unavailable.' });
  }
}
