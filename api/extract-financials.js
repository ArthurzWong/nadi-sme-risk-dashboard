import { extractDocument } from '../server/document_extractor.js';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const { fileName, contentBase64 } = request.body || {};
    if (typeof fileName !== 'string' || typeof contentBase64 !== 'string') {
      return response.status(400).json({ error: 'Choose a financial statement to extract.' });
    }
    return response.status(200).json(await extractDocument({ fileName, contentBase64 }));
  } catch (error) {
    return response.status(400).json({ error: error.message || 'We could not read that file.' });
  }
}
