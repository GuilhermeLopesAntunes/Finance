import { getAllTags, createTag, updateTag, deleteTag } from './api/TagService.js';
import { getAllTransactions, createTransaction, updateTransaction, deleteTransaction } from './api/ExpanseService.js';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function centsToBRL(cents) {
  return fmt.format(cents / 100);
}

function toISO(localDatetime) {
  return new Date(localDatetime).toISOString();
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

document.querySelectorAll('.modal-close').forEach((btn) => {
  btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});

document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('main > section').forEach((s) => s.classList.add('hidden'));
    document.getElementById(`section-${btn.dataset.section}`).classList.remove('hidden');
  });
});

let cachedTags = [];

async function loadTagsIntoSelects() {
  cachedTags = await getAllTags();

  const tagOptions = cachedTags.length
    ? cachedTags.map((t) => `<option value="${t.id}">${t.name}</option>`).join('')
    : '<option value="" disabled>Nenhuma tag cadastrada</option>';

  document.getElementById('tx-tag').innerHTML = tagOptions;
  document.getElementById('edit-tx-tag').innerHTML = tagOptions;

  const filterSelect = document.getElementById('filter-tag');
  filterSelect.innerHTML =
    '<option value="">Todas as tags</option>' +
    cachedTags.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
}

function renderTransactions(list) {
  const container = document.getElementById('transactions-list');
  if (!list.length) {
    container.innerHTML = '<p class="empty-state">Nenhuma transação encontrada.</p>';
    return;
  }
  container.innerHTML = list.map((tx) => {
    const isExpense = tx.type === 'EXPENSE';
    const tagColor = tx.tag?.colorHex ?? '#999';
    const tagName = tx.tag?.name ?? '-';
    return `
      <div class="card">
        <div class="card-info">
          <span class="card-title">${tx.description}</span>
          <div class="card-meta">
            <span class="tag-badge" style="background:${tagColor}">
              <span class="tag-dot" style="background:${tagColor}"></span>
              ${tagName}
            </span>
            <span>${formatDate(tx.transactedAt)}</span>
          </div>
        </div>
        <span class="amount ${isExpense ? 'expense' : 'income'}">
          ${isExpense ? '-' : '+'}${centsToBRL(tx.amountInCents)}
        </span>
        <button class="btn btn-secondary" data-edit-tx="${tx.id}" data-tx='${JSON.stringify({ description: tx.description, amountInCents: tx.amountInCents, type: tx.type, tagId: tx.tagId, transactedAt: tx.transactedAt })}'>Editar</button>
        <button class="btn btn-danger" data-delete-tx="${tx.id}">Excluir</button>
      </div>`;
  }).join('');

  container.querySelectorAll('[data-edit-tx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tx = JSON.parse(btn.dataset.tx);
      document.getElementById('edit-tx-id').value = btn.dataset.editTx;
      document.getElementById('edit-tx-description').value = tx.description;
      document.getElementById('edit-tx-amount').value = (tx.amountInCents / 100).toFixed(2);
      document.getElementById('edit-tx-type').value = tx.type;
      document.getElementById('edit-tx-tag').value = tx.tagId;
      const localDt = new Date(tx.transactedAt);
      localDt.setMinutes(localDt.getMinutes() - localDt.getTimezoneOffset());
      document.getElementById('edit-tx-date').value = localDt.toISOString().slice(0, 16);
      openModal('modal-edit-transaction');
    });
  });

  container.querySelectorAll('[data-delete-tx]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir esta transação?')) return;
      try {
        await deleteTransaction(btn.dataset.deleteTx);
        showToast('Transação excluída.');
        await loadTransactions();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  });
}

async function loadTransactions(filters = {}) {
  try {
    const list = await getAllTransactions(filters);
    renderTransactions(list);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function renderTags(list) {
  const container = document.getElementById('tags-list');
  if (!list.length) {
    container.innerHTML = '<p class="empty-state">Nenhuma tag cadastrada.</p>';
    return;
  }
  container.innerHTML = list.map((tag) => `
    <div class="card">
      <div class="tag-card-color" style="background:${tag.colorHex}"></div>
      <div class="card-info">
        <span class="card-title">${tag.name}</span>
        <span class="card-meta">${tag.colorHex}</span>
      </div>
      <button class="btn btn-secondary" data-edit-tag="${tag.id}" data-tag-name="${tag.name}" data-tag-color="${tag.colorHex}">Editar</button>
      <button class="btn btn-danger" data-delete-tag="${tag.id}">Excluir</button>
    </div>`).join('');

  container.querySelectorAll('[data-edit-tag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('edit-tag-id').value = btn.dataset.editTag;
      document.getElementById('edit-tag-name').value = btn.dataset.tagName;
      document.getElementById('edit-tag-color').value = btn.dataset.tagColor;
      openModal('modal-edit-tag');
    });
  });

  container.querySelectorAll('[data-delete-tag]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir esta tag?')) return;
      try {
        await deleteTag(btn.dataset.deleteTag);
        showToast('Tag excluída.');
        await loadTags();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  });
}

async function loadTags() {
  try {
    await loadTagsIntoSelects();
    renderTags(cachedTags);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

document.getElementById('btn-open-transaction-modal').addEventListener('click', () => {
  document.getElementById('form-transaction').reset();
  openModal('modal-transaction');
});

document.getElementById('btn-open-tag-modal').addEventListener('click', () => {
  document.getElementById('form-tag').reset();
  openModal('modal-tag');
});

document.getElementById('form-transaction').addEventListener('submit', async (e) => {
  e.preventDefault();
  const description = document.getElementById('tx-description').value.trim();
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const type = document.getElementById('tx-type').value;
  const tagId = document.getElementById('tx-tag').value;
  const date = document.getElementById('tx-date').value;

  try {
    await createTransaction({
      description,
      amountInCents: Math.round(amount * 100),
      type,
      tagId,
      transactedAt: toISO(date),
    });
    closeModal('modal-transaction');
    showToast('Transação registrada!');
    await loadTransactions();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

document.getElementById('form-tag').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('tag-name').value.trim();
  const colorHex = document.getElementById('tag-color').value;

  try {
    await createTag({ name, colorHex });
    closeModal('modal-tag');
    showToast('Tag criada!');
    await loadTags();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

document.getElementById('btn-filter').addEventListener('click', async () => {
  const type = document.getElementById('filter-type').value;
  const tagId = document.getElementById('filter-tag').value;
  const startRaw = document.getElementById('filter-start').value;
  const endRaw = document.getElementById('filter-end').value;

  await loadTransactions({
    type: type || undefined,
    tagId: tagId || undefined,
    startDate: startRaw ? toISO(startRaw) : undefined,
    endDate: endRaw ? new Date(`${endRaw}T23:59:59`).toISOString() : undefined,
  });
});

document.getElementById('btn-clear-filter').addEventListener('click', async () => {
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-tag').value = '';
  document.getElementById('filter-start').value = '';
  document.getElementById('filter-end').value = '';
  await loadTransactions();
});

document.getElementById('form-edit-tag').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-tag-id').value;
  const name = document.getElementById('edit-tag-name').value.trim();
  const colorHex = document.getElementById('edit-tag-color').value;

  try {
    await updateTag(id, { name, colorHex });
    closeModal('modal-edit-tag');
    showToast('Tag atualizada!');
    await loadTags();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

document.getElementById('form-edit-transaction').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-tx-id').value;
  const description = document.getElementById('edit-tx-description').value.trim();
  const amount = parseFloat(document.getElementById('edit-tx-amount').value);
  const type = document.getElementById('edit-tx-type').value;
  const tagId = document.getElementById('edit-tx-tag').value;
  const date = document.getElementById('edit-tx-date').value;

  try {
    await updateTransaction(id, {
      description,
      amountInCents: Math.round(amount * 100),
      type,
      tagId,
      transactedAt: toISO(date),
    });
    closeModal('modal-edit-transaction');
    showToast('Transação atualizada!');
    await loadTransactions();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

async function init() {
  await loadTags();
  await loadTransactions();
}

init();
