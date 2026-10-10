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

## Google AI Studio integration

Replace `predictRisk` in [`server/risk_model.js`](server/risk_model.js) with the supplied Google AI Studio model logic. Keep the result fields consumed by `src/App.jsx` (`riskLevel`, `riskCategory`, `priorityScore`, `financialImpactRM`, `explanation`, `recommendedAction`, `actionSteps`, `drivers`, and `metrics`) or update the API response and UI together. Add any required API key to an environment variable on the server; do not place secrets in the React app.

Until that code is supplied, the app uses deterministic rules to illustrate the end-to-end flow. The policy lens combines e-Invoice readiness with a 2027 CPI cost sensitivity of 1.8%–2.8% from the supplied economic benchmark guide. It also surfaces the MOF outlook's MSME financing and digitalisation pathways. These are planning scenarios, not official charges, support approvals or business-specific forecasts.

## Budget 2027 sources used

- *MOF Economic Outlook 2027*, pp. 6 and 31–32: e-Invoice implementation; MSME financing; SME Corp and MDEC digitalisation support; AI adoption.
- *Demystifying National Benchmarks: A Beginner’s Guide to Malaysia’s 2027 Economic Outlook*, pp. 1–3: real GDP benchmark of 4.2%–5.2% and CPI benchmark of 1.8%–2.8%.

## Vercel deployment

The Vercel deployment uses `api/predict.js` for `POST /api/predict` and `api/health.js` for `GET /api/health`. The local Express server remains available for `npm run dev`.
