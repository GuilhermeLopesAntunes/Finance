const BASE_URL = 'http://localhost:3000/analytics';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function getSummary({ startDate, endDate } = {}) {
  const res = await fetch(`${BASE_URL}/summary${buildQuery({ startDate, endDate })}`);
  if (!res.ok) throw new Error('Erro ao buscar resumo');
  return res.json();
}

export async function getTagsDistribution({ type = 'EXPENSE', startDate, endDate } = {}) {
  const res = await fetch(`${BASE_URL}/tags-distribution${buildQuery({ type, startDate, endDate })}`);
  if (!res.ok) throw new Error('Erro ao buscar distribuição por tags');
  return res.json();
}

export async function getTimePatterns({ startDate, endDate } = {}) {
  const res = await fetch(`${BASE_URL}/time-patterns${buildQuery({ startDate, endDate })}`);
  if (!res.ok) throw new Error('Erro ao buscar padrões temporais');
  return res.json();
}

export async function getTimeline({ interval = 'day', startDate, endDate } = {}) {
  const res = await fetch(`${BASE_URL}/timeline${buildQuery({ interval, startDate, endDate })}`);
  if (!res.ok) throw new Error('Erro ao buscar timeline');
  return res.json();
}
