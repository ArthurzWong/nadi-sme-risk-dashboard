import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeAlert,
  Banknote,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Coins,
  FileCheck2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from 'lucide-react';

const SAMPLE_DATA = {
  revenue: '128000',
  expenses: '62000',
  payroll: '49200',
  employees: '12',
  invoiceReadiness: 'in-progress',
};

const EMPTY_FORM = { revenue: '', expenses: '', payroll: '', employees: '', invoiceReadiness: 'not-ready' };

const DATE_LABEL = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}).format(new Date()).toUpperCase();

const formatRM = (value, options = {}) => new Intl.NumberFormat('en-MY', {
  maximumFractionDigits: 0,
  ...options,
}).format(value);

const parseAmount = (value) => Number(String(value).replaceAll(',', '').trim());

function validateForm(form) {
  const errors = {};
  const revenue = parseAmount(form.revenue);
  const expenses = parseAmount(form.expenses);
  const payroll = parseAmount(form.payroll);
  const employees = Number(form.employees);

  if (!form.revenue.trim() || !Number.isFinite(revenue) || revenue <= 0 || revenue > 1_000_000_000) errors.revenue = 'Enter monthly revenue above RM 0, up to RM 1 billion.';
  if (!form.expenses.trim() || !Number.isFinite(expenses) || expenses < 0 || expenses > 1_000_000_000) errors.expenses = 'Enter RM 0 to RM 1 billion (use 0 if none).';
  if (!form.payroll.trim() || !Number.isFinite(payroll) || payroll < 0 || payroll > 1_000_000_000) errors.payroll = 'Enter RM 0 to RM 1 billion (use 0 if none).';
  if (!Number.isInteger(employees) || employees < 1 || employees > 1_000_000) errors.employees = 'Enter a whole number from 1 to 1,000,000.';
  return errors;
}

function MoneyField({ id, label, value, onChange, hint, error, inputRef }) {
  return (
    <div className="field-wrap">
      <label className="field-label" htmlFor={id}>{label}<span className="required-mark" aria-hidden="true">*</span></label>
      <div className={`field-control ${error ? 'field-control-error' : ''}`}>
        <span className="currency-prefix" aria-hidden="true">RM</span>
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="text"
          required
          inputMode="decimal"
          autoComplete="off"
          spellCheck="false"
          placeholder="0.00"
          value={value}
          onChange={onChange}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
        />
        {value && !error ? <Check className="field-check" size={15} aria-hidden="true" /> : null}
      </div>
      {error ? <p className="field-error" id={`${id}-error`}>{error}</p> : <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}

function EmployeeField({ value, onChange, error, inputRef }) {
  return (
    <div className="field-wrap">
      <label className="field-label" htmlFor="employees">Number of employees<span className="required-mark" aria-hidden="true">*</span></label>
      <div className={`field-control ${error ? 'field-control-error' : ''}`}>
        <UsersRound className="input-icon" size={17} aria-hidden="true" />
        <input
          ref={inputRef}
          id="employees"
          name="employees"
          type="text"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g. 12"
          value={value}
          onChange={onChange}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'employees-error' : 'employees-hint'}
        />
        <span className="field-unit">people</span>
      </div>
      {error ? <p className="field-error" id="employees-error">{error}</p> : <p className="field-hint" id="employees-hint">Full-time and part-time staff</p>}
    </div>
  );
}

function PolicyReadinessField({ value, onChange }) {
  return (
    <div className="policy-field">
      <label className="field-label" htmlFor="invoiceReadiness">e-Invoice readiness</label>
      <select id="invoiceReadiness" name="invoiceReadiness" value={value} onChange={onChange}>
        <option value="not-ready">Not started</option>
        <option value="in-progress">In progress</option>
        <option value="ready">Ready</option>
      </select>
      <p className="field-hint">Used for the Budget 2027 policy lens</p>
    </div>
  );
}

function EmptyResult({ onSample }) {
  return (
    <div className="empty-result" aria-live="polite">
      <div className="empty-illustration" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="empty-core"><Sparkles size={21} /></div>
        <span className="orbit-dot dot-one" />
        <span className="orbit-dot dot-two" />
        <span className="orbit-dot dot-three" />
      </div>
      <div className="empty-copy">
        <span className="eyebrow">YOUR NEXT MOVE, WITH MORE CLARITY</span>
        <h3>Your risk view starts here.</h3>
        <p>Enter your monthly figures to see where your business may feel pressure and what to do next.</p>
      </div>
      <button className="text-button" type="button" onClick={onSample}>
        Try a sample scenario <ArrowRight size={15} aria-hidden="true" />
      </button>
      <div className="empty-factors" aria-label="Risk signals assessed">
        <span><span className="factor-dot factor-green" />Cash flow</span>
        <span><span className="factor-dot factor-amber" />Payroll</span>
        <span><span className="factor-dot factor-muted" />Margins</span>
      </div>
    </div>
  );
}

function LoadingResult() {
  return (
    <div className="loading-result" role="status" aria-live="polite" aria-label="Calculating your risk scenario">
      <div className="loading-top"><span className="skeleton skeleton-pill" /><span className="skeleton skeleton-circle" /></div>
      <span className="skeleton skeleton-title" />
      <span className="skeleton skeleton-line" />
      <span className="skeleton skeleton-line skeleton-short" />
      <div className="loading-stats"><span className="skeleton skeleton-stat" /><span className="skeleton skeleton-stat" /></div>
      <span className="loading-caption"><LoaderCircle size={14} className="spin" aria-hidden="true" /> Checking your monthly scenario…</span>
    </div>
  );
}

function RiskResult({ prediction, actionOpen, onToggleAction }) {
  const tone = prediction.riskLevel.toLowerCase();
  const scoreStyle = { '--score': `${prediction.priorityScore * 3.6}deg` };
  const monthlyImpact = formatRM(prediction.financialImpactRM);

  return (
    <div className={`result-content risk-${tone}`} aria-live="polite">
      <div className="result-header">
        <div>
          <div className="result-overline"><span className="status-pulse" /> DETECTED RISK</div>
          <h3 className="risk-title">{prediction.riskLevel === 'Low' ? 'Resilience looks steady' : prediction.riskLevel === 'High' ? 'Pressure points detected' : 'A few pressure points to watch'}</h3>
        </div>
        <div className="score-ring" style={scoreStyle} aria-label={`Priority score ${prediction.priorityScore} out of 100`} role="img">
          <div className="score-ring-center"><strong>{prediction.priorityScore}</strong><span> / 100</span></div>
        </div>
      </div>

      <div className="result-meta-row">
        <span className="risk-badge"><span className="badge-dot" />{prediction.riskLevel} risk</span>
        <span className="category-badge">{prediction.riskCategory}</span>
        <span className="score-label">Priority score</span>
      </div>

      <div className="impact-panel">
        <div className="impact-topline">
          <div className="impact-icon"><Banknote size={17} aria-hidden="true" /></div>
          <span>ESTIMATED MONTHLY IMPACT</span>
          <CircleHelp size={15} aria-label="Illustrative scenario estimate, not an official policy projection" title="Illustrative scenario estimate, not an official policy projection" />
        </div>
        <div className="impact-number"><span className="impact-rm">RM</span>{monthlyImpact}</div>
        <div className="impact-footnote"><span>Illustrative exposure proxy</span><span className="impact-period"><Clock3 size={13} aria-hidden="true" /> Monthly</span></div>
      </div>

      <div className="explanation-block">
        <div className="section-kicker"><span className="section-marker" /> WHAT THIS MEANS</div>
        <p>{prediction.explanation}</p>
      </div>

      <div className="signals-block">
        <div className="section-kicker"><span className="section-marker" /> KEY SIGNALS</div>
        <div className="signal-grid">
          {prediction.drivers.map((driver) => (
            <div className="signal-card" key={driver.label}>
              <div className="signal-label"><span className={`signal-dot signal-${driver.tone}`} />{driver.label}</div>
              <strong>{driver.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <section className="budget-lens" aria-labelledby="budget-lens-title">
        <div className="budget-lens-heading">
          <div>
            <div className="section-kicker"><span className="section-marker" /> BUDGET 2027 POLICY LENS</div>
            <h4 id="budget-lens-title">Potential impact to plan for</h4>
          </div>
          <span className="policy-source-label">SUPPLIED SOURCES</span>
        </div>
        <div className="policy-metrics">
          <div className="policy-metric-card">
            <span>2027 cost sensitivity</span>
            <strong>RM {formatRM(prediction.budget2027.costSensitivity.low)}–{formatRM(prediction.budget2027.costSensitivity.high)}</strong>
            <small>Per month after a full year</small>
          </div>
          <div className="policy-metric-card">
            <span>{prediction.budget2027.macroBenchmark.label}</span>
            <strong>{prediction.budget2027.macroBenchmark.value}</strong>
            <small>Market context, not sales forecast</small>
          </div>
        </div>
        <p className="policy-explainer">{prediction.budget2027.costSensitivity.description}</p>
        <div className="policy-signal-list">
          {prediction.budget2027.policySignals.map((signal) => (
            <article className={`policy-signal policy-signal-${signal.tone}`} key={signal.title}>
              <div className="policy-signal-topline"><span className="policy-signal-dot" /><span>{signal.label}</span></div>
              <strong>{signal.title}</strong>
              <p>{signal.description}</p>
            </article>
          ))}
        </div>
        <p className="policy-source-note">{prediction.budget2027.sourceLabel}. Values are illustrative planning scenarios, not official policy costs or eligibility decisions.</p>
      </section>

      <div className="action-wrap">
        <button className="action-button" type="button" onClick={onToggleAction} aria-expanded={actionOpen} aria-controls="action-plan">
          <span className="action-button-icon"><FileCheck2 size={16} aria-hidden="true" /></span>
          <span className="action-button-copy"><strong>Recommended action</strong><small>{prediction.recommendedAction}</small></span>
          <ChevronDown size={17} className={`action-chevron ${actionOpen ? 'is-open' : ''}`} aria-hidden="true" />
        </button>
        <div className="action-plan" id="action-plan" hidden={!actionOpen}>
            <div className="plan-heading"><ShieldCheck size={16} aria-hidden="true" />A practical next step</div>
            <ol>
              {prediction.actionSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [prediction, setPrediction] = useState(null);
  const [requestError, setRequestError] = useState('');
  const [actionOpen, setActionOpen] = useState(false);
  const [isSample, setIsSample] = useState(false);
  const refs = useRef({});

  const filledCount = useMemo(() => ['revenue', 'expenses', 'payroll', 'employees'].filter((name) => form[name] !== '').length, [form]);

  const updateField = (name) => (event) => {
    const nextValue = event.target.value.replace(/[^\d.,]/g, '');
    setForm((current) => ({ ...current, [name]: nextValue }));
    if (fieldErrors[name]) setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setRequestError('');
    setIsSample(false);
    setPrediction(null);
    setStatus('idle');
    setActionOpen(false);
  };

  const updateSelect = (name) => (event) => {
    setForm((current) => ({ ...current, [name]: event.target.value }));
    setRequestError('');
    setIsSample(false);
    setPrediction(null);
    setStatus('idle');
    setActionOpen(false);
  };

  const prefillSample = () => {
    setForm(SAMPLE_DATA);
    setFieldErrors({});
    setRequestError('');
    setPrediction(null);
    setStatus('idle');
    setActionOpen(false);
    setIsSample(true);
    document.getElementById('revenue')?.focus();
  };

  const runPrediction = async (event) => {
    event.preventDefault();
    const errors = validateForm(form);
    setFieldErrors(errors);
    setRequestError('');
    if (Object.keys(errors).length > 0) {
      const firstInvalid = Object.keys(errors)[0];
      refs.current[firstInvalid]?.focus();
      return;
    }

    setStatus('loading');
    setPrediction(null);
    setActionOpen(false);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revenue: parseAmount(form.revenue),
          expenses: parseAmount(form.expenses),
          payroll: parseAmount(form.payroll),
          employees: Number(form.employees),
          invoiceReadiness: form.invoiceReadiness,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.fields) setFieldErrors(data.fields);
        throw new Error(data.error || 'We could not calculate this scenario. Please try again.');
      }
      setPrediction(data.prediction);
      setStatus('success');
    } catch (error) {
      setRequestError(error.message || 'We could not reach the risk service. Check your connection and try again.');
      setStatus('error');
    }
  };

  const retryPrediction = () => {
    const formElement = document.getElementById('scenario-form');
    formElement?.requestSubmit();
  };

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setPrediction(null);
    setStatus('idle');
    setFieldErrors({});
    setRequestError('');
    setIsSample(false);
    setActionOpen(false);
    document.getElementById('revenue')?.focus();
  };

  return (
    <div className="app-shell" id="overview">
      <header className="topbar">
        <a className="brand-lockup" href="#overview" aria-label="Nadi home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-name">nadi</span>
          <span className="brand-divider" />
          <span className="brand-descriptor">SME INTELLIGENCE</span>
        </a>
        <nav className="primary-nav" aria-label="Main navigation">
          <a className="nav-link nav-active" href="#overview" aria-current="page">Overview</a>
          <a className="nav-link" href="#scenario">Scenario inputs</a>
          <a className="nav-link" href="#insights">Insights</a>
        </nav>
        <div className="topbar-right">
          <span className="country-chip"><span className="country-marker" aria-hidden="true">MY</span>Malaysia · MYR</span>
          <span className="topbar-divider" />
          <span className="date-label">{DATE_LABEL}</span>
          <span className="profile-mark" aria-hidden="true">D</span>
        </div>
      </header>

      <main className="main-content">
        <section className="page-heading" aria-labelledby="page-title">
          <div className="heading-copy">
            <div className="eyebrow-line"><span className="eyebrow-rule" /> MALAYSIA SME RISK INTELLIGENCE <span className="heading-separator">/</span> <span className="heading-month">BUDGET 2027 SCENARIO</span></div>
            <h1 id="page-title">See the pressure.<br /><span>Plan the next move.</span></h1>
            <p className="heading-description">A clearer view of how policy scenarios could meet your monthly numbers.</p>
          </div>
          <div className="heading-aside">
            <div className="scenario-status"><span className="status-live" /> Scenario workspace <span className="beta-pill">BETA</span></div>
            <p>Built for Malaysian businesses, in ringgit and plain language.</p>
            <div className="aside-meta"><span className="aside-meta-icon"><ShieldCheck size={14} /></span> Private to this session <span className="meta-divider" /> No bank connection</div>
          </div>
        </section>

        <section className="dashboard-grid" aria-label="Risk dashboard">
          <section className="panel input-panel" id="scenario" aria-labelledby="scenario-title">
            <div className="panel-heading">
              <div className="panel-title-wrap">
                <div className="panel-icon panel-icon-green"><WalletCards size={18} aria-hidden="true" /></div>
                <div>
                  <div className="panel-kicker">STEP 01 <span className="kicker-line" /></div>
                  <h2 id="scenario-title">Your monthly picture</h2>
                </div>
              </div>
              <span className="required-note"><span>*</span> Required</span>
            </div>

            <div className="panel-intro">
              <p>Use a typical month. Rounded figures are fine.</p>
              <div className="field-progress" role="progressbar" aria-label="Financial inputs completed" aria-valuemin={0} aria-valuemax={4} aria-valuenow={filledCount}>
                <span className="progress-track"><span style={{ width: `${filledCount * 25}%` }} /></span>
                <span>{filledCount}/4</span>
              </div>
            </div>

            <form id="scenario-form" onSubmit={runPrediction} noValidate>
              <fieldset className="form-fieldset">
                <legend className="visually-hidden">Monthly SME financial inputs</legend>
                <MoneyField
                  id="revenue"
                  label="Monthly revenue"
                  value={form.revenue}
                  onChange={updateField('revenue')}
                  hint="Before tax, across all sales"
                  error={fieldErrors.revenue}
                  inputRef={(node) => { refs.current.revenue = node; }}
                />
                <MoneyField
                  id="expenses"
                  label="Operating expenses"
                  value={form.expenses}
                  onChange={updateField('expenses')}
                  hint="Rent, stock, utilities, excluding payroll"
                  error={fieldErrors.expenses}
                  inputRef={(node) => { refs.current.expenses = node; }}
                />
                <MoneyField
                  id="payroll"
                  label="Monthly payroll"
                  value={form.payroll}
                  onChange={updateField('payroll')}
                  hint="Gross wages and employer costs"
                  error={fieldErrors.payroll}
                  inputRef={(node) => { refs.current.payroll = node; }}
                />
                <EmployeeField
                  value={form.employees}
                  onChange={updateField('employees')}
                  error={fieldErrors.employees}
                  inputRef={(node) => { refs.current.employees = node; }}
                />
              </fieldset>

              <PolicyReadinessField value={form.invoiceReadiness} onChange={updateSelect('invoiceReadiness')} />

              {requestError ? (
                <div className="request-error" role="alert">
                  <BadgeAlert size={17} aria-hidden="true" />
                  <span>{requestError}</span>
                  <button className="retry-button" type="button" onClick={retryPrediction}><RefreshCw size={13} aria-hidden="true" /> Retry</button>
                </div>
              ) : null}

              <div className="form-actions">
                <button className="submit-button" type="submit" disabled={status === 'loading'} aria-busy={status === 'loading'}>
                  {status === 'loading' ? <LoaderCircle className="spin" size={17} aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
                  <span>{status === 'loading' ? 'Reading your numbers…' : 'Run prediction'}</span>
                  {status !== 'loading' ? <ArrowRight size={16} aria-hidden="true" /> : null}
                </button>
                <button className="sample-button" type="button" onClick={prefillSample} disabled={status === 'loading'}>
                  <RefreshCw size={14} aria-hidden="true" /> Prefill sample
                </button>
              </div>
              {isSample ? <p className="sample-note"><span className="sample-note-dot" /> Sample SME figures loaded. Edit any value before you run.</p> : null}
              {prediction ? <button className="reset-link" type="button" onClick={clearForm}>Clear figures <ArrowDownRight size={13} aria-hidden="true" /></button> : null}
            </form>

            <div className="input-footer"><CircleHelp size={15} aria-hidden="true" /><span>Expenses exclude payroll so your cost picture stays clear.</span></div>
          </section>

          <section className="panel result-panel" id="insights" aria-labelledby="results-title">
            <div className="panel-heading results-panel-heading">
              <div className="panel-title-wrap">
                <div className="panel-icon panel-icon-amber"><Coins size={18} aria-hidden="true" /></div>
                <div>
                  <div className="panel-kicker">STEP 02 <span className="kicker-line" /></div>
                  <h2 id="results-title">Risk outlook</h2>
                </div>
              </div>
              {prediction ? <span className="result-freshness"><span className="freshness-dot" /> Just now</span> : <span className="result-idle-label">AWAITING INPUT</span>}
            </div>

            {status === 'loading' ? <LoadingResult /> : null}
            {status === 'error' ? <EmptyResult onSample={prefillSample} /> : null}
            {status === 'idle' ? <EmptyResult onSample={prefillSample} /> : null}
            {status === 'success' && prediction ? (
              <RiskResult prediction={prediction} actionOpen={actionOpen} onToggleAction={() => setActionOpen((open) => !open)} />
            ) : null}
          </section>
        </section>

        <section className="assurance-bar" aria-label="Scenario model information">
          <div className="assurance-brand"><span className="assurance-mark"><ShieldCheck size={15} aria-hidden="true" /></span><span>Built for <strong>Malaysian SMEs</strong></span></div>
          <span className="assurance-divider" />
          <p>Includes a transparent Budget 2027 policy lens: e-Invoice readiness, MSME support pathways and a supplied macro cost range.</p>
          <a className="method-link" href="#model-note">How it works <ArrowUpRight size={13} aria-hidden="true" /></a>
        </section>

        <section className="below-fold" id="model-note" aria-label="Model notes">
          <div className="model-note-icon"><CircleHelp size={16} aria-hidden="true" /></div>
          <div><strong>About this scenario</strong><p>Risk scores use the figures entered plus an e-Invoice readiness signal. The policy lens uses the supplied Budget 2027 documents; it is an illustrative scenario, not an official policy cost, eligibility decision or financial advice.</p></div>
        </section>

        <footer className="page-footer"><span>© {new Date().getFullYear()} Nadi SME Intelligence</span><span><span className="footer-dot" />Scenario engine online</span><span>Made for Malaysia <span className="footer-heart">·</span> RM-first</span></footer>
      </main>
    </div>
  );
}

export default App;
