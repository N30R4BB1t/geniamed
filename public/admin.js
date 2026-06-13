const loginPanel = document.querySelector('#loginPanel');
const adminPanel = document.querySelector('#adminPanel');
const loginForm = document.querySelector('#loginForm');
const loginMessage = document.querySelector('#loginMessage');
const unitForm = document.querySelector('#unitForm');
const unitsTable = document.querySelector('#unitsTable');
const newUnitButton = document.querySelector('#newUnitButton');
const cancelEditButton = document.querySelector('#cancelEditButton');
const logoutButton = document.querySelector('#logoutButton');

let units = [];
let token = localStorage.getItem('adminToken');
let adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');

function boot() {
  if (token && adminUser) {
    showAdmin();
    loadUnits();
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';

  const form = new FormData(loginForm);
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: form.get('username'),
      password: form.get('password')
    })
  });

  const data = await response.json();
  if (!response.ok) {
    loginMessage.textContent = data.error || 'Nao foi possivel entrar.';
    return;
  }

  token = data.token;
  adminUser = data.user;
  localStorage.setItem('adminToken', token);
  localStorage.setItem('adminUser', JSON.stringify(adminUser));
  showAdmin();
  await loadUnits();
});

unitForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formToUnit();
  const id = unitForm.elements.id.value;
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/admin/units/${id}` : '/api/admin/units';

  const response = await fetch(url, {
    method,
    headers: authHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    alert(error.error || 'Nao foi possivel salvar a unidade.');
    return;
  }

  resetForm();
  await loadUnits();
});

newUnitButton.addEventListener('click', resetForm);
cancelEditButton.addEventListener('click', resetForm);
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  token = null;
  adminUser = null;
  loginPanel.classList.remove('hidden');
  adminPanel.classList.add('hidden');
});

async function loadUnits() {
  const response = await fetch('/api/admin/units', {
    headers: authHeaders(false)
  });

  if (response.status === 401) {
    logoutButton.click();
    loginMessage.textContent = 'Sessao expirada. Entre novamente.';
    return;
  }

  const data = await response.json();
  units = data.units || [];
  renderUnits();
}

function renderUnits() {
  if (units.length === 0) {
    unitsTable.innerHTML = '<tr><td colspan="5">Nenhuma unidade cadastrada.</td></tr>';
    return;
  }

  unitsTable.innerHTML = units.map((unit) => `
    <tr>
      <td>
        <strong>${escapeHtml(unit.name)}</strong>
        <div class="meta">${escapeHtml(unit.address)}</div>
      </td>
      <td>${escapeHtml(unit.city)} / ${escapeHtml(unit.state)}</td>
      <td>${Number(unit.latitude).toFixed(5)}, ${Number(unit.longitude).toFixed(5)}</td>
      <td><span class="badge">${unit.active ? 'Ativa' : 'Inativa'}</span></td>
      <td class="table-actions">
        <button class="secondary" type="button" onclick="editUnit('${unit.id}')">Editar</button>
        <button class="secondary" type="button" onclick="toggleUnit('${unit.id}')">${unit.active ? 'Desativar' : 'Ativar'}</button>
        <button type="button" onclick="deleteUnit('${unit.id}')">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function editUnit(id) {
  const unit = units.find((item) => item.id === id);
  if (!unit) return;

  unitForm.elements.id.value = unit.id;
  unitForm.elements.name.value = unit.name;
  unitForm.elements.address.value = unit.address;
  unitForm.elements.city.value = unit.city;
  unitForm.elements.state.value = unit.state;
  unitForm.elements.phone.value = unit.phone || '';
  unitForm.elements.latitude.value = unit.latitude;
  unitForm.elements.longitude.value = unit.longitude;
  unitForm.elements.active.checked = unit.active;
}

async function toggleUnit(id) {
  const unit = units.find((item) => item.id === id);
  if (!unit) return;

  const response = await fetch(`/api/admin/units/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      name: unit.name,
      address: unit.address,
      city: unit.city,
      state: unit.state,
      phone: unit.phone,
      latitude: Number(unit.latitude),
      longitude: Number(unit.longitude),
      active: !unit.active
    })
  });

  if (!response.ok) {
    const error = await response.json();
    alert(error.error || 'Nao foi possivel alterar o status.');
    return;
  }

  await loadUnits();
}

async function deleteUnit(id) {
  if (!confirm('Deseja excluir esta unidade? Se houver vinculos, use Desativar.')) return;

  const response = await fetch(`/api/admin/units/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false)
  });

  if (!response.ok) {
    const error = await response.json();
    alert(error.error || 'Nao foi possivel excluir.');
    return;
  }

  await loadUnits();
}

function formToUnit() {
  return {
    name: unitForm.elements.name.value.trim(),
    address: unitForm.elements.address.value.trim(),
    city: unitForm.elements.city.value.trim(),
    state: unitForm.elements.state.value.trim().toUpperCase(),
    phone: unitForm.elements.phone.value.trim() || null,
    latitude: Number(unitForm.elements.latitude.value),
    longitude: Number(unitForm.elements.longitude.value),
    active: unitForm.elements.active.checked
  };
}

function resetForm() {
  unitForm.reset();
  unitForm.elements.id.value = '';
  unitForm.elements.active.checked = true;
}

function showAdmin() {
  loginPanel.classList.add('hidden');
  adminPanel.classList.remove('hidden');
}

function authHeaders(withJson = true) {
  const headers = {
    Authorization: `Bearer ${token}`
  };
  if (withJson) headers['Content-Type'] = 'application/json';
  return headers;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

boot();

