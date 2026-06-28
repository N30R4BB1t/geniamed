const loginPanel = document.querySelector('#loginPanel');
const adminPanel = document.querySelector('#adminPanel');
const loginForm = document.querySelector('#loginForm');
const loginMessage = document.querySelector('#loginMessage');
const logoutButton = document.querySelector('#logoutButton');
const voiceButton = document.querySelector('#voiceButton');

const menuUnits = document.querySelector('#menuUnits');
const menuCapabilities = document.querySelector('#menuCapabilities');
const menuUsers = document.querySelector('#menuUsers');
const menuProtocols = document.querySelector('#menuProtocols');
const menuCid10 = document.querySelector('#menuCid10');
const menuSymptoms = document.querySelector('#menuSymptoms');
const menuTracking = document.querySelector('#menuTracking');
const unitsSection = document.querySelector('#unitsSection');
const capabilitiesSection = document.querySelector('#capabilitiesSection');
const usersSection = document.querySelector('#usersSection');
const protocolsSection = document.querySelector('#protocolsSection');
const cid10Section = document.querySelector('#cid10Section');
const symptomsSection = document.querySelector('#symptomsSection');
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
const cidImportForm = document.querySelector('#cidImportForm');
const cidImportMessage = document.querySelector('#cidImportMessage');
const cidSearchForm = document.querySelector('#cidSearchForm');
const cidResultsTable = document.querySelector('#cidResultsTable');
const cidStats = document.querySelector('#cidStats');
const symptomGroupForm = document.querySelector('#symptomGroupForm');
const symptomGroupsTable = document.querySelector('#symptomGroupsTable');
const newSymptomGroupButton = document.querySelector('#newSymptomGroupButton');
const cancelSymptomGroupButton = document.querySelector('#cancelSymptomGroupButton');
const symptomForm = document.querySelector('#symptomForm');
const symptomsTable = document.querySelector('#symptomsTable');
const newSymptomButton = document.querySelector('#newSymptomButton');
const cancelSymptomButton = document.querySelector('#cancelSymptomButton');
const symptomCidLinkForm = document.querySelector('#symptomCidLinkForm');
const symptomCidLinksTable = document.querySelector('#symptomCidLinksTable');
const newSymptomCidLinkButton = document.querySelector('#newSymptomCidLinkButton');
const cancelSymptomCidLinkButton = document.querySelector('#cancelSymptomCidLinkButton');
const generateCandidatesButton = document.querySelector('#generateCandidatesButton');
const candidateMessage = document.querySelector('#candidateMessage');
const symptomCandidatesTable = document.querySelector('#symptomCandidatesTable');
const candidateFilterForm = document.querySelector('#candidateFilterForm');
const candidatePrevButton = document.querySelector('#candidatePrevButton');
const candidateNextButton = document.querySelector('#candidateNextButton');
const candidatePageInfo = document.querySelector('#candidatePageInfo');
const combinationRuleForm = document.querySelector('#combinationRuleForm');
const combinationRulesTable = document.querySelector('#combinationRulesTable');
const newCombinationRuleButton = document.querySelector('#newCombinationRuleButton');
const cancelCombinationRuleButton = document.querySelector('#cancelCombinationRuleButton');

let units = [];
let capabilities = [];
let users = [];
let protocols = [];
let symptomGroups = [];
let symptoms = [];
let symptomCidLinks = [];
let symptomCandidates = [];
let candidatePagination = { page: 1, pageSize: 10, total: 0, totalPages: 1 };
let combinationRules = [];
let trackedOccurrences = [];
let trackingMap;
let trackingMarker;
let trackingUnitMarker;
let trackingLine;
let adminUser = null;
const symptomDialogs = setupSymptomModals();

async function boot() {
  adminUser = await GeniamedAuth.start({ roles: ['ADMIN'] });
  if (!adminUser) return;
  GeniamedVoice.configure(voiceButton);
  GeniamedVoice.connectOperationalAlerts();
  showAdmin();
  await loadAll();
}

voiceButton.addEventListener('click', () => GeniamedVoice.toggle());

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

  window.location.reload();
});

menuUnits.addEventListener('click', () => showSection('units'));
menuCapabilities.addEventListener('click', () => showSection('capabilities'));
menuUsers.addEventListener('click', () => showSection('users'));
menuProtocols.addEventListener('click', () => showSection('protocols'));
menuCid10.addEventListener('click', async () => {
  showSection('cid10');
  await loadCidStats();
});
menuSymptoms.addEventListener('click', async () => {
  showSection('symptoms');
  await loadSymptomAdminData();
});
menuTracking.addEventListener('click', async () => {
  showSection('tracking');
  await loadTrackedOccurrences();
  setTimeout(() => trackingMap?.invalidateSize(), 100);
});

logoutButton.addEventListener('click', () => {
  GeniamedAuth.logout();
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

symptomGroupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = symptomGroupForm.elements.id.value;
  const response = await fetch(id ? `/api/admin/symptom-groups/${id}` : '/api/admin/symptom-groups', {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(formToSymptomGroup())
  });
  if (!(await handleSaveResponse(response))) return;
  resetSymptomGroupForm();
  closeAdminDialog(symptomDialogs.group);
  await loadSymptomAdminData();
});

symptomForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = symptomForm.elements.id.value;
  const response = await fetch(id ? `/api/admin/symptoms/${id}` : '/api/admin/symptoms', {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(formToSymptom())
  });
  if (!(await handleSaveResponse(response))) return;
  resetSymptomForm();
  closeAdminDialog(symptomDialogs.symptom);
  await loadSymptomAdminData();
});

symptomCidLinkForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = symptomCidLinkForm.elements.id.value;
  const response = await fetch(id ? `/api/admin/symptom-cid-links/${id}` : '/api/admin/symptom-cid-links', {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(formToSymptomCidLink())
  });
  if (!(await handleSaveResponse(response))) return;
  resetSymptomCidLinkForm();
  closeAdminDialog(symptomDialogs.link);
  await loadSymptomCidLinks();
});

combinationRuleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = combinationRuleForm.elements.id.value;
  const response = await fetch(id ? `/api/admin/symptom-combination-rules/${id}` : '/api/admin/symptom-combination-rules', {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(formToCombinationRule())
  });
  if (!(await handleSaveResponse(response))) return;
  resetCombinationRuleForm();
  closeAdminDialog(symptomDialogs.rule);
  await loadCombinationRules();
});

newUnitButton.addEventListener('click', resetUnitForm);
cancelUnitButton.addEventListener('click', resetUnitForm);
newCapabilityButton.addEventListener('click', resetCapabilityForm);
cancelCapabilityButton.addEventListener('click', resetCapabilityForm);
newUserButton.addEventListener('click', resetUserForm);
cancelUserButton.addEventListener('click', resetUserForm);
newProtocolButton.addEventListener('click', resetProtocolForm);
cancelProtocolButton.addEventListener('click', resetProtocolForm);
newSymptomGroupButton.addEventListener('click', () => {
  resetSymptomGroupForm();
  openAdminDialog(symptomDialogs.group);
});
cancelSymptomGroupButton.addEventListener('click', () => {
  resetSymptomGroupForm();
  closeAdminDialog(symptomDialogs.group);
});
newSymptomButton.addEventListener('click', () => {
  resetSymptomForm();
  openAdminDialog(symptomDialogs.symptom);
});
cancelSymptomButton.addEventListener('click', () => {
  resetSymptomForm();
  closeAdminDialog(symptomDialogs.symptom);
});
newSymptomCidLinkButton.addEventListener('click', () => {
  resetSymptomCidLinkForm();
  openAdminDialog(symptomDialogs.link);
});
cancelSymptomCidLinkButton.addEventListener('click', () => {
  resetSymptomCidLinkForm();
  closeAdminDialog(symptomDialogs.link);
});
newCombinationRuleButton.addEventListener('click', () => {
  resetCombinationRuleForm();
  openAdminDialog(symptomDialogs.rule);
});
cancelCombinationRuleButton.addEventListener('click', () => {
  resetCombinationRuleForm();
  closeAdminDialog(symptomDialogs.rule);
});
reloadTrackingButton.addEventListener('click', loadTrackedOccurrences);

symptomCidLinkForm.elements.cidSearch.addEventListener('input', debounce(searchCidForLink, 300));
combinationRuleForm.elements.cidSearch.addEventListener('input', debounce(searchCidForCombinationRule, 300));
generateCandidatesButton.addEventListener('click', generateSymptomCandidates);
candidateFilterForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  candidatePagination.page = 1;
  await loadSymptomCandidates();
});
candidateFilterForm.elements.search.addEventListener('input', debounce(async () => {
  candidatePagination.page = 1;
  await loadSymptomCandidates();
}, 350));
candidateFilterForm.elements.sort.addEventListener('change', async () => {
  candidatePagination.page = 1;
  await loadSymptomCandidates();
});
candidateFilterForm.elements.pageSize.addEventListener('change', async () => {
  candidatePagination.page = 1;
  candidatePagination.pageSize = Number(candidateFilterForm.elements.pageSize.value || 10);
  await loadSymptomCandidates();
});
candidatePrevButton.addEventListener('click', async () => {
  if (candidatePagination.page <= 1) return;
  candidatePagination.page -= 1;
  await loadSymptomCandidates();
});
candidateNextButton.addEventListener('click', async () => {
  if (candidatePagination.page >= candidatePagination.totalPages) return;
  candidatePagination.page += 1;
  await loadSymptomCandidates();
});

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

cidImportForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = cidImportForm.elements.file.files[0];
  if (!file) return;
  cidImportMessage.textContent = 'Lendo arquivo...';
  const csv = await readCsvFile(file);
  cidImportMessage.textContent = 'Importando CID-10...';
  const response = await fetch('/api/admin/cid10/import', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      kind: cidImportForm.elements.kind.value,
      csv
    })
  });
  if (!(await handleSaveResponse(response))) {
    cidImportMessage.textContent = 'Nao foi possivel importar o arquivo.';
    return;
  }
  const data = await response.json().catch(() => ({ imported: 0 }));
  cidImportMessage.textContent = `${data.imported || 0} registros importados/atualizados.`;
  cidImportForm.reset();
  await loadCidStats();
});

cidSearchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await searchCid10();
});

async function loadAll() {
  await loadUnits();
  await loadCapabilities();
  await loadUsers();
  await loadProtocols();
  await loadSymptomAdminData();
  await loadTrackedOccurrences();
  await loadCidStats();
}

function setupSymptomModals() {
  return {
    group: createAdminFormDialog(
      symptomGroupForm,
      'Grupo de sintomas',
      'Use grupos para organizar sintomas por sistema ou contexto clinico. Exemplos: Cardiovascular, Respiratorio, Digestivo.'
    ),
    symptom: createAdminFormDialog(
      symptomForm,
      'Sintoma',
      'Cadastre o nome que o profissional vera na anamnese. As palavras-chave devem incluir sinonimos e termos que aparecam na CID-10.'
    ),
    link: createAdminFormDialog(
      symptomCidLinkForm,
      'Vinculo sintoma-CID',
      'Use quando a relacao sintoma-CID ja foi revisada. Pontuacoes maiores fazem o CID subir no ranking quando o sintoma for escolhido.'
    ),
    rule: createAdminFormDialog(
      combinationRuleForm,
      'Regra de combinacao',
      'Use regras quando um conjunto de sintomas, e nao apenas um sintoma isolado, deve aumentar a pontuacao de um CID.'
    )
  };
}

function createAdminFormDialog(form, title, helpText) {
  const dialog = document.createElement('dialog');
  dialog.className = 'admin-form-dialog';

  const header = document.createElement('div');
  header.className = 'dialog-header';
  const heading = document.createElement('h2');
  heading.textContent = title;
  const helpButton = document.createElement('button');
  helpButton.className = 'help-icon';
  helpButton.type = 'button';
  helpButton.textContent = '?';
  helpButton.title = 'Mostrar ajuda';
  header.append(heading, helpButton);

  const help = document.createElement('p');
  help.className = 'modal-help hidden';
  help.textContent = helpText;
  helpButton.addEventListener('click', () => help.classList.toggle('hidden'));

  dialog.append(header, help, form);
  document.body.appendChild(dialog);
  return dialog;
}

function openAdminDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}

function closeAdminDialog(dialog) {
  if (dialog.open) dialog.close();
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

async function loadSymptomAdminData() {
  await loadSymptomGroups();
  await loadSymptoms();
  await loadSymptomCidLinks();
  await loadSymptomCandidates();
  await loadCombinationRules();
  renderSymptomSelects();
}

async function loadSymptomGroups() {
  const response = await fetch('/api/admin/symptom-groups', { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  symptomGroups = data.groups || [];
  renderSymptomGroupsTable();
}

async function loadSymptoms() {
  const response = await fetch('/api/admin/symptoms', { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  symptoms = data.symptoms || [];
  renderSymptomsTable();
}

async function loadSymptomCidLinks() {
  const response = await fetch('/api/admin/symptom-cid-links', { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  symptomCidLinks = data.links || [];
  renderSymptomCidLinksTable();
}

async function loadSymptomCandidates() {
  const params = new URLSearchParams({
    status: 'PENDENTE',
    page: String(candidatePagination.page),
    pageSize: String(candidatePagination.pageSize),
    search: candidateFilterForm?.elements.search.value.trim() || '',
    sort: candidateFilterForm?.elements.sort.value || 'created_desc'
  });
  const response = await fetch(`/api/admin/symptom-cid-candidates?${params}`, { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  symptomCandidates = data.candidates || [];
  candidatePagination = {
    page: data.page || 1,
    pageSize: data.pageSize || candidatePagination.pageSize,
    total: data.total || 0,
    totalPages: data.totalPages || 1
  };
  renderSymptomCandidatesTable();
  renderCandidatePagination();
}

async function loadCombinationRules() {
  const response = await fetch('/api/admin/symptom-combination-rules', { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  combinationRules = data.rules || [];
  renderCombinationRulesTable();
}

async function loadCidStats() {
  const response = await fetch('/api/admin/cid10/stats', { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  cidStats.innerHTML = `
    <strong>Total:</strong> ${Number(data.total || 0)}<br>
    <strong>Capitulos:</strong> ${Number(data.chapters || 0)}<br>
    <strong>Grupos CID:</strong> ${Number(data.cid_groups || 0)}<br>
    <strong>Categorias:</strong> ${Number(data.categories || 0)}<br>
    <strong>Subcategorias:</strong> ${Number(data.subcategories || 0)}<br>
    <strong>Grupos de sintomas:</strong> ${Number(data.groups || 0)}
  `;
}

async function readCsvFile(file) {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  if (!utf8.includes('\uFFFD')) return utf8;
  return new TextDecoder('windows-1252').decode(buffer);
}

async function searchCid10() {
  const query = cidSearchForm.elements.query.value.trim();
  if (query.length < 2) {
    cidResultsTable.innerHTML = '<tr><td colspan="4">Digite ao menos 2 caracteres.</td></tr>';
    return;
  }
  const response = await fetch(`/api/clinical/cid10/search?q=${encodeURIComponent(query)}`, { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  const results = data.results || [];
  cidResultsTable.innerHTML = results.length
    ? results.map((item) => `
      <tr>
        <td><strong>${escapeHtml(item.code)}</strong></td>
        <td>${escapeHtml(item.description)}</td>
        <td>${escapeHtml(item.short_description || '-')}</td>
        <td>${escapeHtml(item.kind)}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="4">Nenhum CID encontrado.</td></tr>';
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

function renderSymptomGroupsTable() {
  if (symptomGroups.length === 0) {
    symptomGroupsTable.innerHTML = '<tr><td>Nenhum grupo cadastrado.</td></tr>';
    return;
  }
  symptomGroupsTable.innerHTML = symptomGroups.map((group) => `
    <tr>
      <td><strong>${escapeHtml(group.name)}</strong><div class="meta">${escapeHtml(group.code)} - ordem ${Number(group.sort_order || 0)}</div></td>
      <td><span class="badge">${group.active ? 'Ativo' : 'Inativo'}</span></td>
      <td class="table-actions">
        <button class="secondary" type="button" onclick="editSymptomGroup('${group.id}')">Editar</button>
        <button type="button" onclick="deleteRecord('/api/admin/symptom-groups/${group.id}', loadSymptomAdminData)">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function renderSymptomsTable() {
  if (symptoms.length === 0) {
    symptomsTable.innerHTML = '<tr><td>Nenhum sintoma cadastrado.</td></tr>';
    return;
  }
  symptomsTable.innerHTML = symptoms.map((symptom) => `
    <tr>
      <td><strong>${escapeHtml(symptom.name)}</strong><div class="meta">${escapeHtml(symptom.group_name)} - ${escapeHtml(symptom.code)}</div></td>
      <td>${escapeHtml((symptom.keywords || []).join(', '))}</td>
      <td><span class="badge">${symptom.active ? 'Ativo' : 'Inativo'}</span></td>
      <td class="table-actions">
        <button class="secondary" type="button" onclick="editSymptom('${symptom.id}')">Editar</button>
        <button type="button" onclick="deleteRecord('/api/admin/symptoms/${symptom.id}', loadSymptomAdminData)">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function renderSymptomCidLinksTable() {
  if (symptomCidLinks.length === 0) {
    symptomCidLinksTable.innerHTML = '<tr><td colspan="5">Nenhum vinculo sintoma-CID cadastrado.</td></tr>';
    return;
  }
  symptomCidLinksTable.innerHTML = symptomCidLinks.map((link) => `
    <tr>
      <td>${escapeHtml(link.symptom_name)}</td>
      <td><strong>${escapeHtml(link.cid_code)}</strong><div class="meta">${escapeHtml(link.cid_description)}</div></td>
      <td><span class="badge">Peso ${Number(link.score || 0)}</span></td>
      <td>${escapeHtml(link.notes || '-')}</td>
      <td class="table-actions">
        <button class="secondary" type="button" onclick="editSymptomCidLink('${link.id}')">Editar</button>
        <button type="button" onclick="deleteRecord('/api/admin/symptom-cid-links/${link.id}', loadSymptomCidLinks)">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function renderSymptomCandidatesTable() {
  if (symptomCandidates.length === 0) {
    symptomCandidatesTable.innerHTML = '<tr><td colspan="5">Nenhum candidato pendente. Gere candidatos ou ajuste palavras-chave.</td></tr>';
    return;
  }
  symptomCandidatesTable.innerHTML = symptomCandidates.map((item) => `
    <tr>
      <td>${escapeHtml(item.symptom_name)}</td>
      <td><strong>${escapeHtml(item.cid_code)}</strong><div class="meta">${escapeHtml(item.cid_description)}</div></td>
      <td>${escapeHtml((item.matched_keywords || []).join(', '))}</td>
      <td><input class="score-input" id="candidateScore-${item.id}" type="number" min="1" max="100" value="${Number(item.suggested_score || 2)}"></td>
      <td class="table-actions">
        <button class="secondary" type="button" onclick="reviewCandidate('${item.id}', true)">Aprovar</button>
        <button type="button" onclick="reviewCandidate('${item.id}', false)">Rejeitar</button>
      </td>
    </tr>
  `).join('');
}

function renderCandidatePagination() {
  candidatePageInfo.textContent = `Pagina ${candidatePagination.page} de ${candidatePagination.totalPages} - ${candidatePagination.total} candidato(s)`;
  candidatePrevButton.disabled = candidatePagination.page <= 1;
  candidateNextButton.disabled = candidatePagination.page >= candidatePagination.totalPages;
}

function renderCombinationRulesTable() {
  if (combinationRules.length === 0) {
    combinationRulesTable.innerHTML = '<tr><td colspan="5">Nenhuma regra cadastrada.</td></tr>';
    return;
  }
  combinationRulesTable.innerHTML = combinationRules.map((rule) => `
    <tr>
      <td><strong>${escapeHtml(rule.name)}</strong><div class="meta">${rule.active ? 'Ativa' : 'Inativa'}</div></td>
      <td>${escapeHtml((rule.symptoms || []).map((symptom) => symptom.name).join(', '))}</td>
      <td><strong>${escapeHtml(rule.cid_code)}</strong><div class="meta">${escapeHtml(rule.cid_description)}</div></td>
      <td><span class="badge">+${Number(rule.score_bonus || 0)}</span></td>
      <td class="table-actions">
        <button class="secondary" type="button" onclick="editCombinationRule('${rule.id}')">Editar</button>
        <button type="button" onclick="deleteRecord('/api/admin/symptom-combination-rules/${rule.id}', loadCombinationRules)">Excluir</button>
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

function renderSymptomSelects() {
  const groupSelect = symptomForm.elements.groupId;
  groupSelect.innerHTML = symptomGroups
    .map((group) => `<option value="${group.id}">${escapeHtml(group.name)}</option>`)
    .join('');

  const symptomSelect = symptomCidLinkForm.elements.symptomId;
  symptomSelect.innerHTML = symptoms
    .map((symptom) => `<option value="${symptom.id}">${escapeHtml(symptom.name)} - ${escapeHtml(symptom.group_name)}</option>`)
    .join('');

  const ruleSymptomSelect = combinationRuleForm.elements.symptomIds;
  ruleSymptomSelect.innerHTML = symptoms
    .map((symptom) => `<option value="${symptom.id}">${escapeHtml(symptom.name)} - ${escapeHtml(symptom.group_name)}</option>`)
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

function editSymptomGroup(id) {
  const group = symptomGroups.find((item) => item.id === id);
  if (!group) return;
  symptomGroupForm.elements.id.value = group.id;
  symptomGroupForm.elements.code.value = group.code;
  symptomGroupForm.elements.name.value = group.name;
  symptomGroupForm.elements.description.value = group.description || '';
  symptomGroupForm.elements.sortOrder.value = group.sort_order || 0;
  symptomGroupForm.elements.active.checked = group.active;
  openAdminDialog(symptomDialogs.group);
}

function editSymptom(id) {
  const symptom = symptoms.find((item) => item.id === id);
  if (!symptom) return;
  symptomForm.elements.id.value = symptom.id;
  symptomForm.elements.groupId.value = symptom.group_id;
  symptomForm.elements.code.value = symptom.code;
  symptomForm.elements.name.value = symptom.name;
  symptomForm.elements.keywords.value = (symptom.keywords || []).join(', ');
  symptomForm.elements.sortOrder.value = symptom.sort_order || 0;
  symptomForm.elements.active.checked = symptom.active;
  openAdminDialog(symptomDialogs.symptom);
}

function editSymptomCidLink(id) {
  const link = symptomCidLinks.find((item) => item.id === id);
  if (!link) return;
  symptomCidLinkForm.elements.id.value = link.id;
  symptomCidLinkForm.elements.symptomId.value = link.symptom_id;
  symptomCidLinkForm.elements.score.value = link.score;
  symptomCidLinkForm.elements.notes.value = link.notes || '';
  symptomCidLinkForm.elements.cidSearch.value = `${link.cid_code} ${link.cid_description}`;
  symptomCidLinkForm.elements.cid10Id.innerHTML = `<option value="${link.cid10_id}">${escapeHtml(link.cid_code)} - ${escapeHtml(link.cid_description)}</option>`;
  symptomCidLinkForm.elements.cid10Id.value = link.cid10_id;
  openAdminDialog(symptomDialogs.link);
}

function editCombinationRule(id) {
  const rule = combinationRules.find((item) => item.id === id);
  if (!rule) return;
  combinationRuleForm.elements.id.value = rule.id;
  combinationRuleForm.elements.name.value = rule.name;
  Array.from(combinationRuleForm.elements.symptomIds.options).forEach((option) => {
    option.selected = (rule.symptom_ids || []).includes(option.value);
  });
  combinationRuleForm.elements.scoreBonus.value = rule.score_bonus;
  combinationRuleForm.elements.notes.value = rule.notes || '';
  combinationRuleForm.elements.active.checked = rule.active;
  combinationRuleForm.elements.cidSearch.value = `${rule.cid_code} ${rule.cid_description}`;
  combinationRuleForm.elements.cid10Id.innerHTML = `<option value="${rule.cid10_id}">${escapeHtml(rule.cid_code)} - ${escapeHtml(rule.cid_description)}</option>`;
  combinationRuleForm.elements.cid10Id.value = rule.cid10_id;
  openAdminDialog(symptomDialogs.rule);
}

async function generateSymptomCandidates() {
  candidateMessage.textContent = 'Gerando candidatos...';
  const response = await fetch('/api/admin/symptom-cid-candidates/generate', {
    method: 'POST',
    headers: authHeaders()
  });
  if (!(await handleSaveResponse(response))) {
    candidateMessage.textContent = 'Nao foi possivel gerar candidatos.';
    return;
  }
  const data = await response.json().catch(() => ({ generated: 0 }));
  candidateMessage.textContent = `${data.generated || 0} candidatos gerados ou atualizados.`;
  candidatePagination.page = 1;
  await loadSymptomCandidates();
}

async function reviewCandidate(id, approve) {
  const score = Number(document.querySelector(`#candidateScore-${id}`)?.value || 2);
  const response = await fetch(`/api/admin/symptom-cid-candidates/${id}/review`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ approve, score })
  });
  if (!(await handleSaveResponse(response))) return;
  await loadSymptomCandidates();
  await loadSymptomCidLinks();
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

function formToSymptomGroup() {
  return {
    code: symptomGroupForm.elements.code.value.trim(),
    name: symptomGroupForm.elements.name.value.trim(),
    description: symptomGroupForm.elements.description.value.trim() || null,
    sortOrder: Number(symptomGroupForm.elements.sortOrder.value || 0),
    active: symptomGroupForm.elements.active.checked
  };
}

function formToSymptom() {
  return {
    groupId: symptomForm.elements.groupId.value,
    code: symptomForm.elements.code.value.trim(),
    name: symptomForm.elements.name.value.trim(),
    keywords: splitKeywords(symptomForm.elements.keywords.value),
    sortOrder: Number(symptomForm.elements.sortOrder.value || 0),
    active: symptomForm.elements.active.checked
  };
}

function formToSymptomCidLink() {
  return {
    symptomId: symptomCidLinkForm.elements.symptomId.value,
    cid10Id: symptomCidLinkForm.elements.cid10Id.value,
    score: Number(symptomCidLinkForm.elements.score.value || 10),
    notes: symptomCidLinkForm.elements.notes.value.trim() || null
  };
}

function formToCombinationRule() {
  return {
    name: combinationRuleForm.elements.name.value.trim(),
    symptomIds: Array.from(combinationRuleForm.elements.symptomIds.selectedOptions).map((option) => option.value),
    cid10Id: combinationRuleForm.elements.cid10Id.value,
    scoreBonus: Number(combinationRuleForm.elements.scoreBonus.value || 10),
    notes: combinationRuleForm.elements.notes.value.trim() || null,
    active: combinationRuleForm.elements.active.checked
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

function resetSymptomGroupForm() {
  symptomGroupForm.reset();
  symptomGroupForm.elements.id.value = '';
  symptomGroupForm.elements.sortOrder.value = '0';
  symptomGroupForm.elements.active.checked = true;
}

function resetSymptomForm() {
  symptomForm.reset();
  symptomForm.elements.id.value = '';
  symptomForm.elements.sortOrder.value = '0';
  symptomForm.elements.active.checked = true;
  renderSymptomSelects();
}

function resetSymptomCidLinkForm() {
  symptomCidLinkForm.reset();
  symptomCidLinkForm.elements.id.value = '';
  symptomCidLinkForm.elements.score.value = '10';
  symptomCidLinkForm.elements.cid10Id.innerHTML = '<option value="">Busque um CID para selecionar</option>';
  renderSymptomSelects();
}

function resetCombinationRuleForm() {
  combinationRuleForm.reset();
  combinationRuleForm.elements.id.value = '';
  combinationRuleForm.elements.scoreBonus.value = '10';
  combinationRuleForm.elements.active.checked = true;
  combinationRuleForm.elements.cid10Id.innerHTML = '<option value="">Busque um CID para selecionar</option>';
  renderSymptomSelects();
}

function showSection(section) {
  const sections = {
    units: unitsSection,
    capabilities: capabilitiesSection,
    users: usersSection,
    protocols: protocolsSection,
    cid10: cid10Section,
    symptoms: symptomsSection,
    tracking: trackingSection
  };
  const menus = {
    units: menuUnits,
    capabilities: menuCapabilities,
    users: menuUsers,
    protocols: menuProtocols,
    cid10: menuCid10,
    symptoms: menuSymptoms,
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

async function searchCidForLink() {
  const query = symptomCidLinkForm.elements.cidSearch.value.trim();
  if (query.length < 2) {
    symptomCidLinkForm.elements.cid10Id.innerHTML = '<option value="">Digite ao menos 2 caracteres</option>';
    return;
  }

  const response = await fetch(`/api/clinical/cid10/search?q=${encodeURIComponent(query)}`, { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  const results = (data.results || []).filter((item) => ['CATEGORIA', 'SUBCATEGORIA'].includes(item.kind));
  symptomCidLinkForm.elements.cid10Id.innerHTML = results.length
    ? results.map((item) => `<option value="${item.id}">${escapeHtml(item.code)} - ${escapeHtml(item.description)}</option>`).join('')
    : '<option value="">Nenhum CID encontrado</option>';
}

async function searchCidForCombinationRule() {
  const query = combinationRuleForm.elements.cidSearch.value.trim();
  if (query.length < 2) {
    combinationRuleForm.elements.cid10Id.innerHTML = '<option value="">Digite ao menos 2 caracteres</option>';
    return;
  }

  const response = await fetch(`/api/clinical/cid10/search?q=${encodeURIComponent(query)}`, { headers: authHeaders(false) });
  if (!(await ensureAuthorized(response))) return;
  const data = await response.json();
  const results = (data.results || []).filter((item) => ['CATEGORIA', 'SUBCATEGORIA'].includes(item.kind));
  combinationRuleForm.elements.cid10Id.innerHTML = results.length
    ? results.map((item) => `<option value="${item.id}">${escapeHtml(item.code)} - ${escapeHtml(item.description)}</option>`).join('')
    : '<option value="">Nenhum CID encontrado</option>';
}

function splitKeywords(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function debounce(callback, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), wait);
  };
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
  trackingMarker = L.marker([patientLat, patientLng], {
    icon: L.divIcon({
      className: 'map-div-icon',
      html: '<span class="patient-map-marker priority-MEDIA" aria-hidden="true"></span>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -16]
    })
  }).addTo(trackingMap).bindPopup('Paciente simulado');
  trackingUnitMarker = L.marker([unitLat, unitLng], {
    icon: L.divIcon({
      className: 'map-div-icon',
      html: '<span class="unit-map-marker" aria-hidden="true">+</span>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -18]
    })
  }).addTo(trackingMap).bindPopup('Unidade atual');
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
  const headers = {};
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
