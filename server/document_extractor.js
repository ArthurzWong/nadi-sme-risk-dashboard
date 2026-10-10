import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';

const SUPPORTED_EXTENSIONS = new Set(['pdf', 'csv', 'xlsx', 'xls', 'txt']);

const cleanAmount = (value) => {
  const normalised = String(value).replace(/[RM$\s]/gi, '').replaceAll(',', '').trim();
  const negative = /^\(.*\)$/.test(normalised);
  const parsed = Number(normalised.replace(/[()]/g, ''));
  return Number.isFinite(parsed) ? (negative ? -parsed : parsed) : null;
};

const amountPattern = /(?:RM|MYR)?\s*\(?\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|(?:RM|MYR)\s*\(?\d+(?:\.\d{1,2})?\)?/gi;

function firstAmount(line) {
  const match = line.match(amountPattern);
  if (!match) return null;
  const values = match.map(cleanAmount).filter((value) => value !== null && Math.abs(value) >= 1);
  return values.length ? values.reduce((largest, value) => Math.abs(value) > Math.abs(largest) ? value : largest) : null;
}

function findFinancialValue(lines, patterns) {
  for (const line of lines) {
    if (patterns.some((pattern) => pattern.test(line))) {
      const value = firstAmount(line);
      if (value !== null) return Math.abs(value);
    }
  }
  return null;
}

export function extractFinancialValues(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const values = {
    revenue: findFinancialValue(lines, [/\brevenue\b/i, /\bturnover\b/i, /\btotal sales\b/i, /^sales\b/i]),
    expenses: findFinancialValue(lines, [/\boperating expenses?\b/i, /\badministrative expenses?\b/i, /\bother operating expenses?\b/i, /\btotal expenses?\b/i]),
    payroll: findFinancialValue(lines, [/\bstaff costs?\b/i, /\bemployee benefits?\b/i, /\bpersonnel expenses?\b/i, /\bsalar(?:y|ies) and wages?\b/i, /\bwages? and salaries?\b/i]),
    cashBalance: findFinancialValue(lines, [/\bcash and bank balances?\b/i, /\bcash and cash equivalents?\b/i, /^cash at bank\b/i]),
    currentLiabilities: findFinancialValue(lines, [/\btotal current liabilities\b/i, /^current liabilities\b/i]),
    employees: findFinancialValue(lines, [/\bnumber of employees\b/i, /\btotal employees\b/i, /\bemployees\b/i]),
  };

  if (values.employees !== null) values.employees = Math.round(values.employees);
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null));
}

export async function extractDocument({ fileName, contentBase64 }) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error('Upload a PDF, CSV, Excel, or text financial statement.');
  }
  const buffer = Buffer.from(contentBase64, 'base64');
  if (!buffer.length || buffer.length > 3 * 1024 * 1024) {
    throw new Error('Use a file up to 3 MB.');
  }

  let text = '';
  if (extension === 'pdf') {
    const parsed = await pdf(buffer);
    text = parsed.text;
  } else if (extension === 'xlsx' || extension === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    text = workbook.SheetNames
      .map((name) => XLSX.utils.sheet_to_csv(workbook.Sheets[name]))
      .join('\n');
  } else {
    text = buffer.toString('utf8');
  }

  const values = extractFinancialValues(text);
  if (!Object.keys(values).length) {
    throw new Error('No standard financial lines were found. Try a text-based statement or enter figures manually.');
  }
  return { values, detectedLines: Object.keys(values), source: extension.toUpperCase() };
}
