import { extractDocument, extractFinancialBuffer } from './document_extractor.js';

const YAHOO_SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search';
const YAHOO_TIMESERIES_URL = 'https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries';
const YAHOO_PROFILE_URL = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary';
const BURSA_ANNOUNCEMENT_URL = 'https://www.bursamalaysia.com/api/v1/announcements/search';
const BURSA_DISCLOSURE_URL = 'https://disclosure.bursamalaysia.com';

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

async function getYahooEmployeeCount(symbol) {
  try {
    const response = await fetch(`${YAHOO_PROFILE_URL}/${encodeURIComponent(symbol)}?modules=summaryProfile`);
    if (!response.ok) return null;
    const body = await response.json();
    const employees = body.quoteSummary?.result?.[0]?.summaryProfile?.fullTimeEmployees;
    return Number.isInteger(employees) && employees > 0 ? employees : null;
  } catch {
    return null;
  }
}

async function getBursaAnnualReport(symbol) {
  const stockCode = symbol.replace(/\.KL$/i, '');
  try {
    const searchUrl = new URL(BURSA_ANNOUNCEMENT_URL);
    searchUrl.search = new URLSearchParams({
      ann_type: 'company', company: stockCode, keyword: '', dt_ht: '', dt_lt: '', cat: 'AR,ARCO', sub_type: '', mkt: '', sec: '', subsec: '', per_page: '5', page: '1', _: String(Date.now()),
    }).toString();
    const searchResponse = await fetch(searchUrl, { headers: { accept: 'application/json' } });
    if (!searchResponse.ok) return { values: {}, sourceLinks: [] };
    const listing = await searchResponse.json();
    const firstRow = listing.data?.[0] || [];
    const announcementId = String(firstRow.find((cell) => typeof cell === 'string' && /ann_id=\d+/i.test(cell)) || '').match(/ann_id=(\d+)/i)?.[1];
    if (!announcementId) return { values: {}, sourceLinks: [] };
    const detailUrl = `${BURSA_DISCLOSURE_URL}/FileAccess/viewHtml?e=${announcementId}`;
    const detailResponse = await fetch(detailUrl);
    if (!detailResponse.ok) return { values: {}, sourceLinks: [detailUrl] };
    const detailHtml = await detailResponse.text();
    const attachments = [...detailHtml.matchAll(/href=["']([^"']*\/FileAccess\/apbursaweb\/download[^"']*)["'][^>]*>([^<]*)</gi)]
      .map(([, href, label]) => ({ href: new URL(href, BURSA_DISCLOSURE_URL).href, label }));
    const annualPdf = attachments.find((attachment) => /annual|integrated/i.test(attachment.label) && !/corporate governance|cg report/i.test(attachment.label)) || attachments[0];
    if (!annualPdf) return { values: {}, sourceLinks: [detailUrl] };
    const pdfResponse = await fetch(annualPdf.href);
    if (!pdfResponse.ok) return { values: {}, sourceLinks: [detailUrl, annualPdf.href] };
    // Bursa's document-download URLs use query parameters rather than a .pdf
    // filename, so provide a stable filename for the document type check.
    const report = await extractFinancialBuffer({
      fileName: `${symbol}-annual-report.pdf`,
      buffer: Buffer.from(await pdfResponse.arrayBuffer()),
      maxBytes: 25 * 1024 * 1024
    });
    return { values: report.values, sourceLinks: [detailUrl, annualPdf.href] };
  } catch {
    return { values: {}, sourceLinks: [] };
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
  const [timeSeriesResponse, bursaReport, yahooEmployees, google] = await Promise.all([
    fetch(`${YAHOO_TIMESERIES_URL}/${encodeURIComponent(symbol)}?symbol=${encodeURIComponent(symbol)}&type=${metricList}&period1=${start}&period2=${now}`).catch(() => null),
    getBursaAnnualReport(symbol),
    getYahooEmployeeCount(symbol),
    tryGoogleAnnualReport(name || symbol),
  ]);
  const body = timeSeriesResponse?.ok ? await timeSeriesResponse.json() : {};
  const results = body.timeseries?.result || [];
  const revenue = average(timeSeriesValues(results, 'annualTotalRevenue'));
  const operatingExpense = average(timeSeriesValues(results, 'annualOperatingExpense')) || average(timeSeriesValues(results, 'annualSellingGeneralAndAdministration'));
  const cashBalance = average(timeSeriesValues(results, 'annualCashCashEquivalentsAndShortTermInvestments'));
  const currentLiabilities = average(timeSeriesValues(results, 'annualCurrentLiabilities'));
  const annualValues = {
    revenue: bursaReport.values.revenue || google.values.revenue || revenue,
    expenses: bursaReport.values.expenses || google.values.expenses || operatingExpense,
    payroll: bursaReport.values.payroll || google.values.payroll || null,
    employees: bursaReport.values.employees || google.values.employees || yahooEmployees || null,
    cashBalance: bursaReport.values.cashBalance || google.values.cashBalance || cashBalance,
    currentLiabilities: bursaReport.values.currentLiabilities || google.values.currentLiabilities || currentLiabilities,
  };
  const source = bursaReport.sourceLinks.length ? 'Bursa Malaysia annual report and public market data' : google.sources.length ? 'Google Custom Search and public market data' : 'Public market data';
  return { annualValues: Object.fromEntries(Object.entries(annualValues).filter(([, value]) => Number.isFinite(value) && value > 0)), source, sourceLinks: [...bursaReport.sourceLinks, ...google.sources.map((item) => item.url)].slice(0, 3) };
}
