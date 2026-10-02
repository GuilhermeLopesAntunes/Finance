import { getSummary, getTagsDistribution, getTimePatterns, getTimeline } from './api/AnalyticsService.js';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const centsToBRL = (c) => fmt.format(c / 100);

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function el(id) { return document.getElementById(id); }

function getFilters() {
  const start = el('an-start').value;
  const end = el('an-end').value;
  return {
    startDate: start ? new Date(start).toISOString() : undefined,
    endDate: end ? new Date(`${end}T23:59:59`).toISOString() : undefined,
    interval: el('an-interval').value,
    type: el('an-dist-type').value,
  };
}

function setStat(id, value, cls) {
  const node = el(id);
  node.textContent = value;
  if (cls) { node.className = `stat-value ${cls}`; }
}

async function renderSummary(filters) {
  const d = await getSummary(filters);
  setStat('an-incomes', centsToBRL(d.totalIncomesInCents), 'income');
  setStat('an-expenses', centsToBRL(d.totalExpensesInCents), 'expense');

  const balanceEl = el('an-balance');
  balanceEl.textContent = centsToBRL(d.netBalanceInCents);
  balanceEl.className = `stat-value ${d.netBalanceInCents >= 0 ? 'income' : 'expense'}`;

  const savingsEl = el('an-savings');
  savingsEl.textContent = `${d.savingsRatePercent.toFixed(1)}%`;
  savingsEl.className = `stat-value ${d.savingsRatePercent >= 0 ? 'income' : 'expense'}`;

  setStat('an-avg-expense', centsToBRL(d.averageExpenseInCents));
  setStat('an-avg-income', centsToBRL(d.averageIncomeInCents));
  setStat('an-count', d.transactionCount.total);
}

const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id] = null;
  }
}

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawBarChart(canvasId, labels, datasets, { yPrefix = '', showLegend = false } = {}) {
  const canvas = el(canvasId);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width;
  const H = rect.height;
  ctx.clearRect(0, 0, W, H);

  const PAD_LEFT = 60;
  const PAD_RIGHT = 16;
  const PAD_TOP = 16;
  const PAD_BOT = 48;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOT;

  const allValues = datasets.flatMap((ds) => ds.data);
  const maxVal = Math.max(...allValues, 0);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const groupCount = labels.length;
  const dsCount = datasets.length;
  const groupGap = 12;
  const barGap = 3;
  const groupW = (chartW - groupGap * (groupCount - 1)) / groupCount;
  const barW = (groupW - barGap * (dsCount - 1)) / dsCount;

  const toY = (v) => PAD_TOP + chartH - ((v - minVal) / range) * chartH;

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const v = minVal + (range / steps) * i;
    const y = toY(v);
    ctx.beginPath();
    ctx.moveTo(PAD_LEFT, y);
    ctx.lineTo(PAD_LEFT + chartW, y);
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    const label = Math.abs(v) >= 100 ? `${yPrefix}${(v / 100).toFixed(0)}` : `${yPrefix}${v.toFixed(0)}`;
    ctx.fillText(label, PAD_LEFT - 6, y + 4);
  }

  const zeroY = toY(0);
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD_LEFT, zeroY);
  ctx.lineTo(PAD_LEFT + chartW, zeroY);
  ctx.stroke();

  datasets.forEach((ds, di) => {
    ds.data.forEach((val, gi) => {
      const x = PAD_LEFT + gi * (groupW + groupGap) + di * (barW + barGap);
      const y = toY(Math.max(val, 0));
      const barH = Math.abs(toY(val) - zeroY);
      const topY = val >= 0 ? toY(val) : zeroY;
      ctx.fillStyle = ds.color;
      ctx.beginPath();
      ctx.roundRect(x, topY, barW, barH, [3, 3, 0, 0]);
      ctx.fill();
    });
  });

  ctx.fillStyle = '#6b7280';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  labels.forEach((lbl, gi) => {
    const centerX = PAD_LEFT + gi * (groupW + groupGap) + (groupW / 2);
    ctx.fillText(String(lbl).slice(0, 6), centerX, H - PAD_BOT + 16);
  });

  if (showLegend) {
    let lx = PAD_LEFT;
    const ly = H - 12;
    datasets.forEach((ds) => {
      ctx.fillStyle = ds.color;
      ctx.fillRect(lx, ly - 8, 12, 8);
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'left';
      ctx.fillText(ds.label, lx + 15, ly);
      lx += ctx.measureText(ds.label).width + 30;
    });
  }
}

function drawDonutChart(canvasId, segments) {
  const canvas = el(canvasId);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width;
  const H = rect.height;
  ctx.clearRect(0, 0, W, H);

  if (!segments.length) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados', W / 2, H / 2);
    return;
  }

  const cx = W / 2;
  const cy = H / 2;
  const outerR = Math.min(W, H) / 2 - 12;
  const innerR = outerR * 0.58;
  const total = segments.reduce((s, sg) => s + sg.value, 0);

  let angle = -Math.PI / 2;
  segments.forEach((sg) => {
    const slice = (sg.value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = sg.color;
    ctx.fill();
    angle += slice;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.fillStyle = '#1a1a1a';
  ctx.font = `bold 13px system-ui`;
  ctx.textAlign = 'center';
  ctx.fillText(`${segments.length} tag${segments.length > 1 ? 's' : ''}`, cx, cy + 5);
}

function renderDonutLegend(segments) {
  const legend = el('donut-legend');
  if (!segments.length) { legend.innerHTML = ''; return; }
  legend.innerHTML = segments.map((sg) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${sg.color}"></span>
      <span class="legend-name">${sg.label}</span>
      <span class="legend-pct">${sg.percentage.toFixed(1)}%</span>
    </div>
  `).join('');
}

async function renderDistribution(filters) {
  const d = await getTagsDistribution({ type: filters.type, startDate: filters.startDate, endDate: filters.endDate });
  const segments = d.items.map((it) => ({
    label: it.tagName,
    value: it.totalInCents,
    color: it.colorHex,
    percentage: it.percentage,
  }));
  drawDonutChart('chart-donut', segments);
  renderDonutLegend(segments);
}

async function renderTimeline(filters) {
  const d = await getTimeline({ interval: filters.interval, startDate: filters.startDate, endDate: filters.endDate });
  const labels = d.points.map((p) => p.date);
  const datasets = [
    { label: 'Receitas', color: 'rgba(40,167,69,0.8)', data: d.points.map((p) => p.incomesInCents) },
    { label: 'Despesas', color: 'rgba(220,53,69,0.8)', data: d.points.map((p) => p.expensesInCents) },
  ];
  drawBarChart('chart-timeline', labels, datasets, { yPrefix: 'R$', showLegend: true });
}

async function renderHourPattern(filters) {
  const d = await getTimePatterns({ startDate: filters.startDate, endDate: filters.endDate });
  const hourMap = {};
  for (let h = 0; h < 24; h++) hourMap[h] = 0;
  d.byHour.forEach((r) => { hourMap[r.hour] = r.totalExpensesInCents; });
  const labels = Object.keys(hourMap).map((h) => `${h}h`);
  const data = Object.values(hourMap);
  drawBarChart('chart-hour', labels, [{ label: 'Despesas', color: 'rgba(255,87,51,0.75)', data }], { yPrefix: 'R$' });
}

async function renderWeekdayPattern(filters) {
  const d = await getTimePatterns({ startDate: filters.startDate, endDate: filters.endDate });
  const dayMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  d.byDayOfWeek.forEach((r) => { dayMap[r.dayOfWeek] = r.totalExpensesInCents; });
  const labels = Object.keys(dayMap).map((d) => DAYS_PT[parseInt(d) - 1]);
  const data = Object.values(dayMap);
  drawBarChart('chart-weekday', labels, [{ label: 'Despesas', color: 'rgba(69,123,157,0.8)', data }], { yPrefix: 'R$' });
}

async function loadAnalytics() {
  const filters = getFilters();
  try {
    await Promise.all([
      renderSummary(filters),
      renderDistribution(filters),
      renderTimeline(filters),
      renderHourPattern(filters),
      renderWeekdayPattern(filters),
    ]);
  } catch (e) {
    console.error(e);
  }
}

el('btn-an-filter').addEventListener('click', loadAnalytics);

el('btn-an-clear').addEventListener('click', () => {
  el('an-start').value = '';
  el('an-end').value = '';
  el('an-interval').value = 'month';
  el('an-dist-type').value = 'EXPENSE';
  loadAnalytics();
});

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.section === 'analytics') loadAnalytics();
  });
});

window.addEventListener('resize', () => {
  const section = el('section-analytics');
  if (!section.classList.contains('hidden')) loadAnalytics();
});
