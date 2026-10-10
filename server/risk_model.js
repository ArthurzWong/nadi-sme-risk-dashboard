/**
 * Demo risk model for the Nadi SME dashboard.
 *
 * Replace `predictRisk` with the Google AI Studio model integration when it is
 * available. Keep its return shape stable so the API and dashboard continue
 * to work without changes. This rule-based version is an illustrative
 * operating-resilience proxy; it does not encode confirmed Budget 2027 policy.
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundCurrency = (value) => Math.round(value * 100) / 100;
const percent = (value) => `${(value * 100).toFixed(1)}%`;

export function predictRisk({ revenue, expenses, payroll, employees }) {
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
  const explanation = `${pressureText} ${payrollText} This demo score does not include specific Budget 2027 measures.`;

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
    ],
    metrics: {
      monthlySurplusRM: roundCurrency(monthlySurplus),
      payrollRatio,
      operatingMargin,
    },
    modelSource: 'demo-rules',
  };
}
