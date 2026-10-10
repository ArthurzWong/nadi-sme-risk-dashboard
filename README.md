# Nadi SME Risk Dashboard

A React dashboard and Node API for Malaysian SME scenario analysis. The included model is transparent and illustrative; it is not an official Budget 2027 policy forecast.

## Run locally

```sh
npm install
npm run dev

```

Vite serves the dashboard at `http://localhost:5173` and proxies `/api` requests to the Node server at `http://localhost:3001`. The `dev` command uses Node's built-in process launcher, so it does not need `concurrently`.

For a production-style local run:

```sh
npm run build
npm start
```

The Node server serves the built dashboard and API from port `3001`.

## Prediction API

`POST /api/predict` accepts monthly figures in ringgit and returns a risk level, category, priority score, illustrative monthly impact, explanation, key signals, recommended actions, and a Budget 2027 policy lens.

```json
{
  "revenue": 128000,
  "expenses": 62000,
  "payroll": 49200,
  "employees": 12,
  "invoiceReadiness": "in-progress"
}
```

Operating expenses should exclude payroll. The sample button uses the values above.

## Statement upload

`POST /api/extract-financials` accepts a base64-encoded PDF, CSV, XLSX, XLS, or text file up to 3 MB. It extracts common statement lines such as revenue, operating expenses, payroll, cash and bank balances, current liabilities, and employee count. The dashboard uses an annual/monthly selector to convert annual P&L figures into monthly scenario inputs. Uploaded content is processed for the response and is not stored by the app.

Cash and current liabilities are optional inputs that improve the cash-runway and short-term-obligation signals. The six-month plan is derived from the resulting risk level; it is an illustrative planning guide.

## Bursa Malaysia company lookup

The company selector searches current `.KL` equity results as the user types, then retrieves public annual financial data and averages the latest available annual observations. It first checks Bursa Malaysia annual-report filings for staff/employee-benefit expense and employee-count disclosures, then uses public market data as a fallback for headcount. Revenue, operating expenses and payroll are converted to monthly scenario inputs; cash and current liabilities remain balance-sheet figures. Existing values are preserved only if a company does not disclose a particular line.

For Google discovery of annual-report PDFs, configure these server-side Vercel environment variables:

```sh
GOOGLE_SEARCH_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...
```

Without these variables, the lookup still uses public market-data financials. Review every fetched value before running the model: data may be delayed, reported in different accounting formats, or unavailable for a particular issuer.

## Google AI Studio integration

Replace `predictRisk` in [`server/risk_model.js`](server/risk_model.js) with the supplied Google AI Studio model logic. Keep the result fields consumed by `src/App.jsx` (`riskLevel`, `riskCategory`, `priorityScore`, `financialImpactRM`, `explanation`, `recommendedAction`, `actionSteps`, `drivers`, and `metrics`) or update the API response and UI together. Add any required API key to an environment variable on the server; do not place secrets in the React app.

Until that code is supplied, the app uses deterministic rules to illustrate the end-to-end flow. The policy lens combines e-Invoice readiness with a 2027 CPI cost sensitivity of 1.8%–2.8% from the supplied economic benchmark guide. It also surfaces the MOF outlook's MSME financing and digitalisation pathways. These are planning scenarios, not official charges, support approvals or business-specific forecasts.

## Budget 2027 sources used

- *MOF Economic Outlook 2027*, pp. 6 and 31–32: e-Invoice implementation; MSME financing; SME Corp and MDEC digitalisation support; AI adoption.
- *Demystifying National Benchmarks: A Beginner’s Guide to Malaysia’s 2027 Economic Outlook*, pp. 1–3: real GDP benchmark of 4.2%–5.2% and CPI benchmark of 1.8%–2.8%.

## Vercel deployment

The Vercel deployment uses `api/predict.js` for `POST /api/predict` and `api/health.js` for `GET /api/health`. The local Express server remains available for `npm run dev`.
