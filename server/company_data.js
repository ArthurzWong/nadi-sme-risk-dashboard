import { extractDocument } from './document_extractor.js';

const YAHOO_SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search';
const YAHOO_TIMESERIES_URL = 'https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries';

const average = (values) => {
  const usable = values.filter((value) => Number.isFinite(value) && value > 0).slice(0, 2);
  return usable.length ? usable.reduce((total, value) => total + value, 0) / usable.length : null;
};

const timeSeriesValues = (result, metric) => (result || [])
  .flatMap((entry) => entry[metric] || [])
  .map((point) => point.reportedValue?.raw)
  .filter(Number.isFinite);

async function googleSearch(companyName) {
  const key = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!key || !cx) return [];
  const query = encodeURIComponent(`"${companyName}" annual report financial statements Malaysia`);
  const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${query}&num=5`);
  if (!response.ok) return [];
  const body = await response.json();
  return (body.items || []).map((item) => ({ title: item.title, url: item.link })).filter((item) => item.url);
}

async function tryGoogleAnnualReport(companyName) {
  const results = await googleSearch(companyName);
  const annualReport = results.find((item) => /annual.?report|financial.?statements/i.test(`${item.title} ${item.url}`) && /\.pdf(?:$|\?)/i.test(item.url));
  if (!annualReport) return { values: {}, sources: results };
  try {
    const response = await fetch(annualReport.url, { headers: { 'user-agent': 'Nadi SME Intelligence financial scenario tool' } });
    if (!response.ok) return { values: {}, sources: results };
    const buffer = Buffer.from(await response.arrayBuffer());
    const extracted = await extractDocument({ fileName: annualReport.url, contentBase64: buffer.toString('base64') });
    return { values: extracted.values, sources: results };
  } catch {
    return { values: {}, sources: results };
  }
}

export async function searchBursaCompanies(query) {
  if (!query || query.trim().length < 2) return [];
  const response = await fetch(`${YAHOO_SEARCH_URL}?q=${encodeURIComponent(query.trim())}&quotesCount=20&newsCount=0`);
  if (!response.ok) throw new Error('Public company search is temporarily unavailable.');
  const body = await response.json();
  return (body.quotes || [])
    .filter((quote) => quote.symbol?.endsWith('.KL') && quote.quoteType === 'EQUITY')
    .map((quote) => ({ symbol: quote.symbol, name: quote.longname || quote.shortname || quote.symbol, exchange: 'Bursa Malaysia' }));
}

export async function getCompanyFinancials({ symbol, name }) {
  if (!/^[A-Z0-9.-]+\.KL$/i.test(symbol || '')) throw new Error('Choose a Bursa Malaysia listed company.');
  const metricList = [
    'annualTotalRevenue',
    'annualOperatingExpense',
    'annualSellingGeneralAndAdministration',
    'annualCashCashEquivalentsAndShortTermInvestments',
    'annualCurrentLiabilities',
  ].join(',');
  const now = Math.floor(Date.now() / 1000);
  const start = now - (8 * 365 * 24 * 60 * 60);
  const response = await fetch(`${YAHOO_TIMESERIES_URL}/${encodeURIComponent(symbol)}?symbol=${encodeURIComponent(symbol)}&type=${metricList}&period1=${start}&period2=${now}`);
  const body = response.ok ? await response.json() : {};
  const results = body.timeseries?.result || [];
  const revenue = average(timeSeriesValues(results, 'annualTotalRevenue'));
  const operatingExpense = average(timeSeriesValues(results, 'annualOperatingExpense')) || average(timeSeriesValues(results, 'annualSellingGeneralAndAdministration'));
  const cashBalance = average(timeSeriesValues(results, 'annualCashCashEquivalentsAndShortTermInvestments'));
  const currentLiabilities = average(timeSeriesValues(results, 'annualCurrentLiabilities'));
  const google = await tryGoogleAnnualReport(name || symbol);
  const annualValues = {
    revenue: google.values.revenue || revenue,
    expenses: google.values.expenses || operatingExpense,
    payroll: google.values.payroll || null,
    employees: google.values.employees || null,
    cashBalance: google.values.cashBalance || cashBalance,
    currentLiabilities: google.values.currentLiabilities || currentLiabilities,
  };
  const source = google.sources.length ? 'Google Custom Search and public market data' : 'Public market data';
  return { annualValues: Object.fromEntries(Object.entries(annualValues).filter(([, value]) => Number.isFinite(value) && value > 0)), source, sourceLinks: google.sources.slice(0, 3) };
}
