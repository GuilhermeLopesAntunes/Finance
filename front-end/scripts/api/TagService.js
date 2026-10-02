const BASE_URL = 'http://localhost:3000/tags';

export async function getAllTags() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error('Erro ao buscar tags');
  return res.json();
}

export async function createTag(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Erro ao criar tag');
  }
  return res.json();
}

export async function updateTag(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Erro ao atualizar tag');
  }
  return res.json();
}

export async function deleteTag(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Erro ao deletar tag');
  }
}
