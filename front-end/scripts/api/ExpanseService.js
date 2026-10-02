const BASE_URL = 'http://localhost:3000/transactions';

export async function getAllTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.tagId) params.set('tagId', filters.tagId);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);

  const query = params.toString();
  const res = await fetch(query ? `${BASE_URL}?${query}` : BASE_URL);
  if (!res.ok) throw new Error('Erro ao buscar transações');
  return res.json();
}

export async function createTransaction(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Erro ao criar transação');
  }
  return res.json();
}

export async function deleteTransaction(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Erro ao deletar transação');
  }
}
