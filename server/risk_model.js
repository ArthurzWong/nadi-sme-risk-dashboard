/**
 * Demo risk model for the Nadi SME dashboard.
 *
 * Replace `predictRisk` with the Google AI Studio model integration when it is
 * available. Keep its return shape stable so the API and dashboard continue
 * to work without changes. This rule-based version is an illustrative
 * operating-resilience proxy. Its Budget 2027 lens uses transparent policy and
 * macroeconomic scenario inputs defined separately in budget_2027_policy.js.
 */

import { buildBudget2027Scenario } from './budget_2027_policy.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundCurrency = (value) => Math.round(value * 100) / 100;
const percent = (value) => `${(value * 100).toFixed(1)}%`;

export function predictRisk({
  revenue,
  expenses,
  payroll,
  employees,
  cashBalance = 0,
  currentLiabilities = 0,
  invoiceReadiness = 'not-ready',
  includeBudget2027 = false,
}) {
  const totalCosts = expenses + payroll;
  const monthlySurplus = revenue - totalCosts;
  const payrollRatio = payroll / revenue;
  const operatingMargin = monthlySurplus / revenue;

  let score = 14;
  if (payrollRatio > 0.5) score += 28;
  else if (payrollRatio > 0.4) score += 20;
  else if (payrollRatio > 0.32) score += 12;
  else if (payrollRatio > 0.25) score += 6;

  if (operatingMargin < 0) score += 48;
  else if (operatingMargin < 0.08) score += 30;
  else if (operatingMargin < 0.15) score += 20;
  else if (operatingMargin < 0.25) score += 10;

  if (employees >= 50 && payrollRatio > 0.35) score += 8;
  if (totalCosts / revenue > 0.95) score += 15;
  const cashRunwayMonths = cashBalance > 0 && totalCosts > 0 ? cashBalance / totalCosts : null;
  const liabilitiesRatio = currentLiabilities > 0 ? currentLiabilities / revenue : 0;
  if (cashRunwayMonths !== null && cashRunwayMonths < 1) score += 16;
  else if (cashRunwayMonths !== null && cashRunwayMonths < 2) score += 8;
  if (liabilitiesRatio > 1) score += 12;
  else if (liabilitiesRatio > 0.65) score += 6;
  if (includeBudget2027 && invoiceReadiness === 'not-ready') score += 7;
  else if (includeBudget2027 && invoiceReadiness === 'in-progress') score += 3;
  score = clamp(Math.round(score), 1, 100);

  const riskLevel = score >= 65 ? 'High' : score >= 30 ? 'Elevated' : 'Low';
  let riskCategory;
  if (operatingMargin < 0 || totalCosts / revenue > 0.95) {
    riskCategory = 'Cash flow pressure';
  } else if (payrollRatio > 0.4) {
    riskCategory = 'Payroll concentration';
  } else if (operatingMargin < 0.15) {
    riskCategory = 'Thin operating buffer';
  } else {
    riskCategory = 'Cost resilience';
  }

  // Scenario proxy: a share of monthly turnover scaled by the model score.
  // The UI labels this estimate as illustrative rather than a forecast.
  const financialImpactRM = roundCurrency(revenue * (0.012 + score / 1000));
  const cashflowGapRM = roundCurrency(Math.max(0, -monthlySurplus));
  const actions = riskLevel === 'High'
    ? [
        'Build a 13-week cash forecast and review it every Friday.',
        'Update prices on products that leave too little after costs, and pause non-essential spending.',
        'Discuss payment terms with your three largest suppliers.',
      ]
      : riskLevel === 'Elevated'
      ? [
          'Set a monthly limit for payroll as a share of sales, and check it with your bookkeeper.',
          'Identify two operating costs you can renegotiate before your next renewal.',
          'Keep a rolling 90-day cash forecast for upcoming commitments.',
        ]
      : [
          'Keep a 90-day cash buffer target and check it monthly.',
          'Review payroll and operating costs whenever revenue shifts by 10%.',
          'Re-run this scenario when you receive confirmed policy details.',
        ];

  const pressureText = operatingMargin < 0
    ? `Monthly costs exceed sales by ${percent(Math.abs(operatingMargin))} of revenue.`
    : `After expenses and payroll, the business keeps an estimated ${percent(operatingMargin)} of monthly sales.`;
  const payrollText = `Payroll uses ${percent(payrollRatio)} of monthly sales across ${employees} employees.`;
  const readinessText = !includeBudget2027
    ? 'Budget 2027 policy impact is not included in this run.'
    : invoiceReadiness === 'ready'
    ? 'e-Invoice readiness is marked prepared.'
    : invoiceReadiness === 'in-progress'
      ? 'e-Invoice setup is still in progress.'
      : 'e-Invoice readiness has not started, adding a compliance planning signal.';
  const budget2027 = includeBudget2027 ? buildBudget2027Scenario({ expenses, invoiceReadiness }) : null;
  const explanation = `${pressureText} ${payrollText} ${readinessText}`;
  const sixMonthPlan = riskLevel === 'High'
    ? [
        { timing: 'Weeks 1–2', action: 'Protect cash', detail: 'Prepare a 13-week cash forecast, pause non-essential spend and call overdue customers.' },
        { timing: 'Month 1', action: 'Close the immediate gap', detail: 'Renegotiate supplier terms and set a weekly collections target.' },
        { timing: 'Months 2–3', action: 'Repair margin', detail: 'Reprice low-margin work and set a payroll-to-sales ceiling.' },
        { timing: 'Months 4–6', action: 'Build resilience', detail: 'Hold two months of core costs in cash and review financing options.' },
      ]
    : riskLevel === 'Elevated'
      ? [
          { timing: 'Month 1', action: 'Measure cash weekly', detail: 'Set a 13-week forecast and track actual cash against it.' },
          { timing: 'Months 2–3', action: 'Strengthen margin', detail: 'Renegotiate two large costs and adjust pricing where needed.' },
          { timing: 'Months 4–6', action: 'Create a reserve', detail: 'Transfer part of monthly surplus into a dedicated cash buffer.' },
        ]
      : [
          { timing: 'Month 1', action: 'Set guardrails', detail: 'Confirm a cash-buffer target and payroll ceiling.' },
          { timing: 'Months 2–3', action: 'Review growth quality', detail: 'Prioritise customers and products with stable cash conversion.' },
          { timing: 'Months 4–6', action: 'Prepare for change', detail: 'Refresh this scenario with actual statements and policy updates.' },
        ];

  return {
    riskLevel,
    riskCategory,
    priorityScore: score,
    financialImpactRM,
    impactPeriod: 'monthly scenario estimate',
    explanation,
    recommendedAction: actions[0],
    actionSteps: actions,
    drivers: [
      { label: 'Monthly buffer', value: percent(operatingMargin), tone: operatingMargin < 0.08 ? 'critical' : operatingMargin < 0.15 ? 'watch' : 'healthy' },
      { label: 'Payroll share', value: percent(payrollRatio), tone: payrollRatio > 0.5 ? 'critical' : payrollRatio > 0.4 ? 'watch' : 'healthy' },
      { label: 'Left after costs', value: `RM ${Math.round(monthlySurplus).toLocaleString('en-MY')}`, tone: monthlySurplus < 0 ? 'critical' : monthlySurplus < revenue * 0.08 ? 'watch' : 'healthy' },
      { label: 'Cash runway', value: cashRunwayMonths === null ? 'Not provided' : `${cashRunwayMonths.toFixed(1)} months`, tone: cashRunwayMonths === null ? 'watch' : cashRunwayMonths < 1 ? 'critical' : cashRunwayMonths < 2 ? 'watch' : 'healthy' },
    ],
    metrics: {
      monthlySurplusRM: roundCurrency(monthlySurplus),
      payrollRatio,
      operatingMargin,
      cashRunwayMonths,
      currentLiabilitiesRatio: liabilitiesRatio,
      cashflowGapRM,
    },
    budget2027,
    sixMonthPlan,
    modelSource: 'rules-budget-2027-v1',
  };
}
