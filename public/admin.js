const loginPanel = document.querySelector('#loginPanel');
const adminPanel = document.querySelector('#adminPanel');
const loginForm = document.querySelector('#loginForm');
const loginMessage = document.querySelector('#loginMessage');
const logoutButton = document.querySelector('#logoutButton');

const menuUnits = document.querySelector('#menuUnits');
const menuCapabilities = document.querySelector('#menuCapabilities');
const menuUsers = document.querySelector('#menuUsers');
const menuProtocols = document.querySelector('#menuProtocols');
const menuTracking = document.querySelector('#menuTracking');
const unitsSection = document.querySelector('#unitsSection');
const capabilitiesSection = document.querySelector('#capabilitiesSection');
const usersSection = document.querySelector('#usersSection');
const protocolsSection = document.querySelector('#protocolsSection');
const trackingSection = document.querySelector('#trackingSection');

const unitForm = document.querySelector('#unitForm');
const unitsTable = document.querySelector('#unitsTable');
const newUnitButton = document.querySelector('#newUnitButton');
const cancelUnitButton = document.querySelector('#cancelUnitButton');

const capabilityForm = document.querySelector('#capabilityForm');
const capabilitiesTable = document.querySelector('#capabilitiesTable');
const newCapabilityButton = document.querySelector('#newCapabilityButton');
const cancelCapabilityButton = document.querySelector('#cancelCapabilityButton');

const userForm = document.querySelector('#userForm');
const usersTable = document.querySelector('#usersTable');
const newUserButton = document.querySelector('#newUserButton');
const cancelUserButton = document.querySelector('#cancelUserButton');

const protocolForm = document.querySelector('#protocolForm');
const protocolsTable = document.querySelector('#protocolsTable');
const newProtocolButton = document.querySelector('#newProtocolButton');
const cancelProtocolButton = document.querySelector('#cancelProtocolButton');
const trackingForm = document.querySelector('#trackingForm');
const trackingResult = document.querySelector('#trackingResult');
const reloadTrackingButton = document.querySelector('#reloadTrackingButton');
const sendNearUnitButton = document.querySelector('#sendNearUnitButton');
const resetSimulationButton = document.querySelector('#resetSimulationButton');

let units = [];
let capabilities = [];
let users = [];
let protocols = [];
let trackedOccurrences = [];
let trackingMap;
let trackingMarker;
let trackingUnitMarker;
let trackingLine;
let token = localStorage.getItem('adminToken');
let adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');

function boot() {
  if (token && adminUser) {
    showAdmin();
    loadAll();
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
  await loadAll();
});

menuUnits.addEventListener('click', () => showSection('units'));
menuCapabilities.addEventListener('click', () => showSection('capabilities'));
menuUsers.addEventListener('click', () => showSection('users'));
menuProtocols.addEventListener('click', () => showSection('protocols'));
menuTracking.addEventListener('click', async () => {
  showSection('tracking');
  await loadTrackedOccurrences();
  setTimeout(() => trackingMap?.invalidateSize(), 100);
});

logoutButton.addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  token = null;
  adminUser = null;
  loginPanel.classList.remove('hidden');
  adminPanel.classList.add('hidden');
});

unitForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = unitForm.elements.id.value;
  const response = await fetch(id ? `/api/admin/units/${id}` : '/api/admin/units', {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(formToUnit())
  });
  if (!(await handleSaveResponse(response))) return;
  resetUnitForm();
  await loadUnits();
  await loadCapabilities();
});

capabilityForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = capabilityForm.elements.id.value;
  const response = await fetch(id ? `/api/admin/capabilities/${id}` : '/api/admin/capabilities', {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(formToCapability())
  });
  if (!(await handleSaveResponse(response))) return;
  resetCapabilityForm();
  await loadCapabilities();
});

userForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = userForm.elements.id.value;
  const response = await fetch(id ? `/api/admin/users/${id}` : '/api/admin/users', {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(formToUser())
  });
  if (!(await handleSaveResponse(response))) return;
  resetUserForm();
  await loadUsers();
});

protocolForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = protocolForm.elements.id.value;
  const response = await fetch(id ? `/api/admin/protocols/${id}` : '/api/admin/protocols', {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(formToProtocol())
  });
  if (!(await handleSaveResponse(response))) return;
  resetProtocolForm();
  await loadProtocols();
});

newUnitButton.addEventListener('click', resetUnitForm);
cancelUnitButton.addEventListener('click', resetUnitForm);
newCapabilityButton.addEventListener('click', resetCapabilityForm);
cancelCapabilityButton.addEventListener('click', resetCapabilityForm);
newUserButton.addEventListener('click', resetUserForm);
cancelUserButton.addEventListener('click', resetUserForm);
newProtocolButton.addEventListener('click', resetProtocolForm);
cancelProtocolButton.addEventListener('click', resetProtocolForm);
reloadTrackingButton.addEventListener('click', loadTrackedOccurrences);

trackingForm.elements.occurrenceId.addEventListener('change', selectTrackedOccurrence);
trackingForm.elements.progress.addEventListener('input', updatePositionFromProgress);
trackingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await sendSimulatedLocation();
});
sendNearUnitButton.addEventListener('click', () => {
  trackingForm.elements.progress.value = '98';
  updatePositionFromProgress();
  sendSimulatedLocation();
});
resetSimulationButton.addEventListener('click', resetTrackingSimulation);

async function loadAll() {
  await loadUnits();
  await loadCapabilities();
  await loadUsers();
  await loadProtocols();
  await loadTrackedOccurrences();
}

async function loadUnits() {
  const response = await fetch('/api/admin/units', { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  units = data.units || [];
  renderUnits();
  renderUnitSelect();
}

async function loadCapabilities() {
  const response = await fetch('/api/admin/capabilities', { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  capabilities = data.capabilities || [];
  renderCapabilities();
}

async function loadUsers() {
  const response = await fetch('/api/admin/users', { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  users = data.users || [];
  renderUsers();
}

async function loadProtocols() {
  const response = await fetch('/api/admin/protocols', { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  protocols = data.protocols || [];
  renderProtocols();
}

async function loadTrackedOccurrences() {
  const response = await fetch('/api/admin/tracking/active', { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  trackedOccurrences = data.occurrences || [];
  const select = trackingForm.elements.occurrenceId;
  select.innerHTML = trackedOccurrences.length
    ? trackedOccurrences.map((item) => (
      `<option value="${item.id}">${escapeHtml(item.patient_name)} - ${escapeHtml(item.unit_name)} (${escapeHtml(item.status)})</option>`
    )).join('')
    : '<option value="">Nenhuma ocorrencia ativa</option>';
  selectTrackedOccurrence();
}

function renderUnits() {
  if (units.length === 0) {
    unitsTable.innerHTML = '<tr><td colspan="5">Nenhuma unidade cadastrada.</td></tr>';
    return;
  }

  unitsTable.innerHTML = units.map((unit) => `
    <tr>
      <td><strong>${escapeHtml(unit.name)}</strong><div class="meta">${escapeHtml(unit.address)}</div></td>
      <td>${escapeHtml(unit.city)} / ${escapeHtml(unit.state)}</td>
      <td>${Number(unit.latitude).toFixed(5)}, ${Number(unit.longitude).toFixed(5)}</td>
      <td><span class="badge">${unit.active ? 'Ativa' : 'Inativa'}</span></td>
      <td class="table-actions">
        <button class="secondary" type="button" onclick="editUnit('${unit.id}')">Editar</button>
        <button class="secondary" type="button" onclick="toggleUnit('${unit.id}')">${unit.active ? 'Desativar' : 'Ativar'}</button>
        <button type="button" onclick="deleteRecord('/api/admin/units/${unit.id}', loadUnits)">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function renderCapabilities() {
  if (capabilities.length === 0) {
    capabilitiesTable.innerHTML = '<tr><td colspan="5">Nenhuma capacidade cadastrada.</td></tr>';
    return;
  }

  capabilitiesTable.innerHTML = capabilities.map((item) => `
    <tr>
      <td>${escapeHtml(item.unit_name)}</td>
      <td>${escapeHtml(item.need)}</td>
      <td>${escapeHtml(item.category || '-')} / ${escapeHtml(item.subcategory || '-')}</td>
      <td><span class="badge">${escapeHtml(item.min_priority)}</span></td>
      <td class="table-actions">
        <button class="secondary" type="button" onclick="editCapability('${item.id}')">Editar</button>
        <button type="button" onclick="deleteRecord('/api/admin/capabilities/${item.id}', loadCapabilities)">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function renderUsers() {
  if (users.length === 0) {
    usersTable.innerHTML = '<tr><td colspan="5">Nenhum usuario cadastrado.</td></tr>';
    return;
  }

  usersTable.innerHTML = users.map((user) => `
    <tr>
      <td><strong>${escapeHtml(user.username)}</strong></td>
      <td>${escapeHtml(user.full_name)}</td>
      <td>${escapeHtml(user.role)}</td>
      <td><span class="badge">${user.active ? 'Ativo' : 'Inativo'}</span></td>
      <td class="table-actions">
        <button class="secondary" type="button" onclick="editUser('${user.id}')">Editar</button>
        <button class="secondary" type="button" onclick="toggleUser('${user.id}')">${user.active ? 'Desativar' : 'Ativar'}</button>
        <button type="button" onclick="deleteRecord('/api/admin/users/${user.id}', loadUsers)">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function renderProtocols() {
  if (protocols.length === 0) {
    protocolsTable.innerHTML = '<tr><td colspan="6">Nenhum protocolo cadastrado.</td></tr>';
    return;
  }

  protocolsTable.innerHTML = protocols.map((item) => `
    <tr>
      <td><strong>${escapeHtml(item.need_label)}</strong><div class="meta">${escapeHtml(item.need)}</div></td>
      <td>${escapeHtml(item.category_label || '-')}<div class="meta">${escapeHtml(item.category_code || '')}</div></td>
      <td>${escapeHtml(item.subcategory_label || '-')}<div class="meta">${escapeHtml(item.subcategory_code || '')}</div></td>
      <td><span class="badge">${escapeHtml(item.priority)}</span></td>
      <td><span class="badge">${item.active ? 'Ativo' : 'Inativo'}</span></td>
      <td class="table-actions">
        <button class="secondary" type="button" onclick="editProtocol('${item.id}')">Editar</button>
        <button class="secondary" type="button" onclick="toggleProtocol('${item.id}')">${item.active ? 'Desativar' : 'Ativar'}</button>
        <button type="button" onclick="deleteRecord('/api/admin/protocols/${item.id}', loadProtocols)">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function renderUnitSelect() {
  const select = capabilityForm.elements.unitId;
  select.innerHTML = units
    .map((unit) => `<option value="${unit.id}">${escapeHtml(unit.name)}</option>`)
    .join('');
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

function editCapability(id) {
  const item = capabilities.find((capability) => capability.id === id);
  if (!item) return;
  capabilityForm.elements.id.value = item.id;
  capabilityForm.elements.unitId.value = item.unit_id;
  capabilityForm.elements.need.value = item.need;
  capabilityForm.elements.category.value = item.category || '';
  capabilityForm.elements.subcategory.value = item.subcategory || '';
  capabilityForm.elements.minPriority.value = item.min_priority;
  capabilityForm.elements.notes.value = item.notes || '';
}

function editUser(id) {
  const user = users.find((item) => item.id === id);
  if (!user) return;
  userForm.elements.id.value = user.id;
  userForm.elements.username.value = user.username;
  userForm.elements.fullName.value = user.full_name;
  userForm.elements.role.value = user.role;
  userForm.elements.password.value = '';
  userForm.elements.password.placeholder = 'Deixe em branco para manter';
  userForm.elements.active.checked = user.active;
}

function editProtocol(id) {
  const item = protocols.find((protocol) => protocol.id === id);
  if (!item) return;
  protocolForm.elements.id.value = item.id;
  protocolForm.elements.need.value = item.need;
  protocolForm.elements.needLabel.value = item.need_label;
  protocolForm.elements.categoryCode.value = item.category_code || '';
  protocolForm.elements.categoryLabel.value = item.category_label || '';
  protocolForm.elements.subcategoryCode.value = item.subcategory_code || '';
  protocolForm.elements.subcategoryLabel.value = item.subcategory_label || '';
  protocolForm.elements.priority.value = item.priority;
  protocolForm.elements.sortOrder.value = item.sort_order || 0;
  protocolForm.elements.instructions.value = item.instructions || '';
  protocolForm.elements.active.checked = item.active;
}

async function toggleUnit(id) {
  const unit = units.find((item) => item.id === id);
  if (!unit) return;
  const response = await fetch(`/api/admin/units/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ ...unit, latitude: Number(unit.latitude), longitude: Number(unit.longitude), active: !unit.active })
  });
  if (await handleSaveResponse(response)) await loadUnits();
}

async function toggleUser(id) {
  const user = users.find((item) => item.id === id);
  if (!user) return;
  const response = await fetch(`/api/admin/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      active: !user.active
    })
  });
  if (await handleSaveResponse(response)) await loadUsers();
}

async function toggleProtocol(id) {
  const item = protocols.find((protocol) => protocol.id === id);
  if (!item) return;
  const response = await fetch(`/api/admin/protocols/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      need: item.need,
      needLabel: item.need_label,
      categoryCode: item.category_code,
      categoryLabel: item.category_label,
      subcategoryCode: item.subcategory_code,
      subcategoryLabel: item.subcategory_label,
      priority: item.priority,
      instructions: item.instructions,
      sortOrder: item.sort_order,
      active: !item.active
    })
  });
  if (await handleSaveResponse(response)) await loadProtocols();
}

async function deleteRecord(url, reload) {
  if (!confirm('Deseja excluir este registro?')) return;
  const response = await fetch(url, { method: 'DELETE', headers: authHeaders(false) });
  if (!(await handleSaveResponse(response))) return;
  await reload();
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

function formToCapability() {
  return {
    unitId: capabilityForm.elements.unitId.value,
    need: capabilityForm.elements.need.value,
    category: capabilityForm.elements.category.value.trim() || null,
    subcategory: capabilityForm.elements.subcategory.value.trim() || null,
    minPriority: capabilityForm.elements.minPriority.value,
    notes: capabilityForm.elements.notes.value.trim() || null
  };
}

function formToUser() {
  const payload = {
    username: userForm.elements.username.value.trim(),
    fullName: userForm.elements.fullName.value.trim(),
    role: userForm.elements.role.value,
    active: userForm.elements.active.checked
  };

  const password = userForm.elements.password.value;
  if (password) payload.password = password;
  return payload;
}

function formToProtocol() {
  return {
    need: protocolForm.elements.need.value,
    needLabel: protocolForm.elements.needLabel.value.trim(),
    categoryCode: protocolForm.elements.categoryCode.value.trim() || null,
    categoryLabel: protocolForm.elements.categoryLabel.value.trim() || null,
    subcategoryCode: protocolForm.elements.subcategoryCode.value.trim() || null,
    subcategoryLabel: protocolForm.elements.subcategoryLabel.value.trim() || null,
    priority: protocolForm.elements.priority.value,
    instructions: protocolForm.elements.instructions.value.trim() || null,
    sortOrder: Number(protocolForm.elements.sortOrder.value || 0),
    active: protocolForm.elements.active.checked
  };
}

function resetUnitForm() {
  unitForm.reset();
  unitForm.elements.id.value = '';
  unitForm.elements.active.checked = true;
}

function resetCapabilityForm() {
  capabilityForm.reset();
  capabilityForm.elements.id.value = '';
  renderUnitSelect();
}

function resetUserForm() {
  userForm.reset();
  userForm.elements.id.value = '';
  userForm.elements.password.placeholder = 'Obrigatoria no cadastro';
  userForm.elements.active.checked = true;
}

function resetProtocolForm() {
  protocolForm.reset();
  protocolForm.elements.id.value = '';
  protocolForm.elements.needLabel.value = 'Emergencia';
  protocolForm.elements.sortOrder.value = '0';
  protocolForm.elements.active.checked = true;
}

function showSection(section) {
  const sections = {
    units: unitsSection,
    capabilities: capabilitiesSection,
    users: usersSection,
    protocols: protocolsSection,
    tracking: trackingSection
  };
  const menus = {
    units: menuUnits,
    capabilities: menuCapabilities,
    users: menuUsers,
    protocols: menuProtocols,
    tracking: menuTracking
  };

  Object.entries(sections).forEach(([key, element]) => {
    element.classList.toggle('hidden', key !== section);
  });

  Object.entries(menus).forEach(([key, element]) => {
    element.classList.toggle('active-menu', key === section);
    element.classList.toggle('secondary', key !== section);
  });
}

function selectTrackedOccurrence() {
  const item = currentTrackedOccurrence();
  if (!item) {
    trackingResult.textContent = 'Crie uma ocorrencia no app para iniciar a simulacao.';
    return;
  }

  const latitude = Number(item.patient_latitude || item.unit_latitude);
  const longitude = Number(item.patient_longitude || item.unit_longitude);
  trackingForm.elements.latitude.value = latitude;
  trackingForm.elements.longitude.value = longitude;
  trackingForm.elements.progress.value = '0';
  ensureTrackingMap();
  updateTrackingMap(latitude, longitude, Number(item.unit_latitude), Number(item.unit_longitude));
  trackingResult.textContent = item.eta_minutes
    ? `Ultimo ETA: ${item.eta_minutes} min; distancia: ${item.distance_to_unit_km || '-'} km.`
    : 'Clique no mapa, use o controle de progresso ou informe coordenadas.';
}

function updatePositionFromProgress() {
  const item = currentTrackedOccurrence();
  if (!item) return;

  const startLat = Number(item.patient_latitude || item.unit_latitude);
  const startLng = Number(item.patient_longitude || item.unit_longitude);
  const targetLat = Number(item.unit_latitude);
  const targetLng = Number(item.unit_longitude);
  const ratio = Number(trackingForm.elements.progress.value) / 100;
  const latitude = startLat + (targetLat - startLat) * ratio;
  const longitude = startLng + (targetLng - startLng) * ratio;

  trackingForm.elements.latitude.value = latitude.toFixed(7);
  trackingForm.elements.longitude.value = longitude.toFixed(7);
  updateTrackingMap(latitude, longitude, targetLat, targetLng);
}

async function sendSimulatedLocation() {
  const item = currentTrackedOccurrence();
  if (!item) return;

  const response = await fetch(`/api/admin/tracking/${item.id}/location`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      latitude: Number(trackingForm.elements.latitude.value),
      longitude: Number(trackingForm.elements.longitude.value),
      speedMps: Number(trackingForm.elements.speedKmh.value || 0) / 3.6,
      accuracyMeters: 5
    })
  });

  const data = await response.json();
  if (!response.ok) {
    alert(data.error || 'Nao foi possivel simular a posicao.');
    return;
  }

  let resultMessage = `${data.patientName}: ${data.distanceKm} km, ETA ${data.etaMinutes} min${data.proximityAlert ? ' - ALERTA DE PROXIMIDADE' : ''}.`;
  if (data.suggestion) {
    resultMessage += ` Sugestao: ${data.suggestion.suggestedUnitName}.`;
  }
  await loadTrackedOccurrences();
  trackingResult.textContent = resultMessage;
}

async function resetTrackingSimulation() {
  const item = currentTrackedOccurrence();
  if (!item) return;
  const response = await fetch(`/api/admin/tracking/${item.id}/reset`, {
    method: 'POST',
    headers: authHeaders(false)
  });
  if (await handleSaveResponse(response)) {
    trackingResult.textContent = 'Alertas e sugestoes pendentes foram reiniciados.';
  }
}

function currentTrackedOccurrence() {
  return trackedOccurrences.find((item) => item.id === trackingForm.elements.occurrenceId.value);
}

function ensureTrackingMap() {
  if (trackingMap || !window.L) return;
  trackingMap = L.map('trackingMap').setView([-23.5505, -46.6333], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(trackingMap);
  trackingMap.on('click', (event) => {
    trackingForm.elements.latitude.value = event.latlng.lat.toFixed(7);
    trackingForm.elements.longitude.value = event.latlng.lng.toFixed(7);
    const item = currentTrackedOccurrence();
    if (item) {
      updateTrackingMap(event.latlng.lat, event.latlng.lng, Number(item.unit_latitude), Number(item.unit_longitude));
    }
  });
}

function updateTrackingMap(patientLat, patientLng, unitLat, unitLng) {
  if (!trackingMap) return;
  trackingMarker?.remove();
  trackingUnitMarker?.remove();
  trackingLine?.remove();
  trackingMarker = L.marker([patientLat, patientLng]).addTo(trackingMap).bindPopup('Paciente simulado');
  trackingUnitMarker = L.marker([unitLat, unitLng]).addTo(trackingMap).bindPopup('Unidade atual');
  trackingLine = L.polyline([[patientLat, patientLng], [unitLat, unitLng]], { color: '#0f766e' }).addTo(trackingMap);
  trackingMap.fitBounds([[patientLat, patientLng], [unitLat, unitLng]], { padding: [30, 30], maxZoom: 15 });
}

function showAdmin() {
  loginPanel.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  showSection('units');
}

async function handleSaveResponse(response) {
  if (response.ok) return true;
  if (response.status === 401) {
    logoutButton.click();
    loginMessage.textContent = 'Sessao expirada. Entre novamente.';
    return false;
  }
  const error = await response.json().catch(() => ({ error: 'Operacao nao concluida.' }));
  alert(error.error || 'Operacao nao concluida.');
  return false;
}

async function ensureAuthorized(response) {
  if (response.status !== 401) return true;
  logoutButton.click();
  loginMessage.textContent = 'Sessao expirada. Entre novamente.';
  return false;
}

function authHeaders(withJson = true) {
  const headers = { Authorization: `Bearer ${token}` };
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
