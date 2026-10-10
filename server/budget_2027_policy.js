/**
 * Budget 2027 evidence used by the scenario model.
 *
 * Sources supplied with this project:
 * - MOF Economic Outlook 2027, pp. 6 and 31–32: e-Invoice implementation,
 *   MSME financing, SME Corp/MDEC digitalisation support and AI adoption.
 * - Demystifying National Benchmarks: Malaysia's 2027 Economic Outlook, pp. 1–3:
 *   2027 real GDP benchmark of 4.2%–5.2% and CPI benchmark of 1.8%–2.8%.
 *
 * These values are scenario inputs. They are not a fee schedule, entitlement,
 * or a guarantee that an individual business receives support.
 */

export const BUDGET_2027_BENCHMARKS = {
  realGdpGrowth: { low: 0.042, high: 0.052 },
  cpi: { low: 0.018, high: 0.028 },
};

const roundCurrency = (value) => Math.round(value * 100) / 100;

export function buildBudget2027Scenario({ expenses, invoiceReadiness }) {
  const { cpi, realGdpGrowth } = BUDGET_2027_BENCHMARKS;
  const costLow = roundCurrency(expenses * cpi.low);
  const costHigh = roundCurrency(expenses * cpi.high);

  const invoiceSignal = invoiceReadiness === 'ready'
    ? {
        tone: 'healthy',
        label: 'Prepared',
        title: 'e-Invoice readiness recorded',
        description: 'Your readiness response reduces implementation risk. Keep invoice records and systems current as tax digitalisation continues.',
      }
    : invoiceReadiness === 'in-progress'
      ? {
          tone: 'watch',
          label: 'In progress',
          title: 'e-Invoice setup needs a completion date',
          description: 'Set an owner, test the workflow and reserve time before the next compliance deadline that applies to your business.',
        }
      : {
          tone: 'critical',
          label: 'Not started',
          title: 'e-Invoice readiness is a policy exposure',
          description: 'The outlook identifies e-Invoices as a key part of tax digitalisation. Confirm your applicable timeline and plan the implementation work.',
        };

  return {
    costSensitivity: {
      low: costLow,
      high: costHigh,
      label: 'Monthly operating-cost sensitivity after a full year',
      description: `If operating expenses rise in line with the supplied 2027 CPI range of 1.8%–2.8%, this month’s expense base is RM ${Math.round(costLow).toLocaleString('en-MY')} to RM ${Math.round(costHigh).toLocaleString('en-MY')} higher.`
    },
    macroBenchmark: {
      label: '2027 real GDP benchmark',
      value: `${(realGdpGrowth.low * 100).toFixed(1)}%–${(realGdpGrowth.high * 100).toFixed(1)}%`,
      description: 'Use this as a market context, not as a sales forecast for your business.',
    },
    policySignals: [
      {
        tone: 'watch',
        label: 'Cost sensitivity',
        title: 'Inflation remains a margin check',
        description: `The supplied outlook places 2027 CPI at 1.8%–2.8%. Recheck supplier pricing and gross margin before locking annual contracts.`,
      },
      invoiceSignal,
      {
        tone: 'healthy',
        label: 'Opportunity',
        title: 'Digitalisation and finance support are signposted',
        description: 'Budget 2027 describes continued MSME financing for export-oriented and high-growth activities, plus SME Corp and MDEC digitalisation support. Check eligibility before budgeting for support.',
      },
    ],
    sourceLabel: 'Budget 2027 policy lens · supplied MOF outlook + 2027 benchmark guide',
  };
}
