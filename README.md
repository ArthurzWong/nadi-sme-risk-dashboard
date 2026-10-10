# Nadi SME Risk Dashboard

A React dashboard and Node API for Malaysian SME scenario analysis. The included risk model is a transparent demo implementation and is not a Budget 2027 policy forecast.

## Run locally

```sh

```

Vite serves the dashboard at `http://localhost:5173` and proxies `/api` requests to the Node server at `http://localhost:3001`. The `dev` command uses Node's built-in process launcher, so it does not need `concurrently`.

For a production-style local run:

```sh
npm run build
npm start
```

The Node server serves the built dashboard and API from port `3001`.

## Prediction API

`POST /api/predict` accepts monthly figures in ringgit and returns a risk level, category, priority score, illustrative monthly impact, explanation, key signals, and recommended actions.

```json
{
  "revenue": 128000,
  "expenses": 62000,
  "payroll": 49200,
  "employees": 12
}
```

Operating expenses should exclude payroll. The sample button uses the values above.

## Google AI Studio integration

Replace `predictRisk` in [`server/risk_model.js`](server/risk_model.js) with the supplied Google AI Studio model logic. Keep the result fields consumed by `src/App.jsx` (`riskLevel`, `riskCategory`, `priorityScore`, `financialImpactRM`, `explanation`, `recommendedAction`, `actionSteps`, `drivers`, and `metrics`) or update the API response and UI together. Add any required API key to an environment variable on the server; do not place secrets in the React app.

Until that code is supplied, the app uses deterministic demo rules to illustrate the end-to-end flow. Its risk score and impact are not tied to confirmed Budget 2027 measures.

## Vercel deployment

The Vercel deployment uses `api/predict.js` for `POST /api/predict` and `api/health.js` for `GET /api/health`. The local Express server remains available for `npm run dev`.
