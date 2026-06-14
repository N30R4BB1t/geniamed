const navButtons = document.querySelectorAll('.record-nav button');
const viewTitle = document.querySelector('#viewTitle');
const views = {
  overview: document.querySelector('#overviewView'),
  patients: document.querySelector('#patientsView'),
  placeholder: document.querySelector('#placeholderView')
};

const patientsCount = document.querySelector('#patientsCount');
const triageCount = document.querySelector('#triageCount');
const consultCount = document.querySelector('#consultCount');
const activeCount = document.querySelector('#activeCount');
const recentPatients = document.querySelector('#recentPatients');
const recentActivity = document.querySelector('#recentActivity');
const patientsList = document.querySelector('#patientsList');
const patientRecord = document.querySelector('#patientRecord');
const patientSearchForm = document.querySelector('#patientSearchForm');
const patientSearch = document.querySelector('#patientSearch');
const placeholderTitle = document.querySelector('#placeholderTitle');

const newPatientDialog = document.querySelector('#newPatientDialog');
const newPatientForm = document.querySelector('#newPatientForm');
const closePatientDialog = document.querySelector('#closePatientDialog');
const cancelPatientForm = document.querySelector('#cancelPatientForm');
const newPatientButtons = [
  document.querySelector('#newPatientButton'),
  document.querySelector('#newPatientButton2')
];

let patients = [];
let occurrences = [];

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.view === 'timeline' || button.dataset.view === 'attachments') return;
    setView(button.dataset.view, button.textContent.replace('Em breve', '').trim());
  });
});

patientSearchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderPatientsList(patientSearch.value);
  setView('patients', 'Pacientes');
});

newPatientButtons.forEach((button) => {
  button.addEventListener('click', () => newPatientDialog.showModal());
});
closePatientDialog.addEventListener('click', () => newPatientDialog.close());
cancelPatientForm.addEventListener('click', () => newPatientDialog.close());

newPatientForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(newPatientForm).entries());

  const response = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Nao foi possivel cadastrar.' }));
    alert(error.error || 'Nao foi possivel cadastrar.');
    return;
  }

  newPatientForm.reset();
  newPatientDialog.close();
  await loadData();
  setView('patients', 'Pacientes');
});

async function loadData() {
  const [patientsResponse, occurrencesResponse] = await Promise.all([
    fetch('/api/patients'),
    fetch('/api/dashboard/occurrences')
  ]);

  const patientsData = await patientsResponse.json();
  const occurrencesData = await occurrencesResponse.json();

  patients = patientsData.patients || [];
  occurrences = occurrencesData.occurrences || [];

  renderOverview();
  renderPatientsList();
}

function renderOverview() {
  patientsCount.textContent = patients.length;
  triageCount.textContent = occurrences.filter((item) => item.need === 'EMERGENCIA').length;
  consultCount.textContent = occurrences.filter((item) => item.need === 'CONSULTA').length;
  activeCount.textContent = occurrences.length;

  if (patients.length === 0) {
    recentPatients.innerHTML = emptyState('Nenhum paciente cadastrado', 'Cadastre o primeiro paciente ficticio para iniciar o fluxo.');
  } else {
    recentPatients.classList.remove('empty-state');
    recentPatients.innerHTML = patients.slice(0, 5).map((patient) => patientListItem(patient)).join('');
  }

  if (occurrences.length === 0) {
    recentActivity.innerHTML = emptyState('Sem atividade registrada', 'As acoes realizadas aparecerao aqui.');
  } else {
    recentActivity.classList.remove('empty-state');
    recentActivity.innerHTML = occurrences.slice(0, 5).map((item) => `
      <button class="clinical-row" type="button">
        <span class="clinical-avatar">${priorityInitial(item.priority)}</span>
        <span>
          <strong>${escapeHtml(item.patient_name)}</strong>
          <small>${escapeHtml(item.need)} · ${escapeHtml(item.status)} · ${formatDateTime(item.created_at)}</small>
        </span>
      </button>
    `).join('');
  }
}

function renderPatientsList(filter = '') {
  const normalized = filter.trim().toLowerCase();
  const filtered = patients.filter((patient) => {
    const haystack = `${patient.id} ${patient.full_name} ${patient.cpf || ''}`.toLowerCase();
    return haystack.includes(normalized);
  });

  if (filtered.length === 0) {
    patientsList.innerHTML = emptyState('Nenhum paciente encontrado', 'Revise o termo de busca ou cadastre um novo paciente.');
    return;
  }

  patientsList.innerHTML = filtered.map((patient) => patientListItem(patient)).join('');
}

function patientListItem(patient) {
  return `
    <button class="clinical-row" type="button" onclick="selectPatient('${patient.id}')">
      <span class="clinical-avatar">${initials(patient.full_name)}</span>
      <span>
        <strong>${escapeHtml(patient.full_name)}</strong>
        <small>${escapeHtml(patient.cpf || 'CPF nao informado')} · ${formatDate(patient.birth_date)}</small>
      </span>
    </button>
  `;
}

async function selectPatient(id) {
  setView('patients', 'Pacientes');

  const [patientResponse, historyResponse] = await Promise.all([
    fetch(`/api/patients/${id}`),
    fetch(`/api/patients/${id}/history`)
  ]);

  if (!patientResponse.ok) {
    patientRecord.innerHTML = emptyState('Paciente nao encontrado', 'O registro solicitado nao esta disponivel.');
    return;
  }

  const patientData = await patientResponse.json();
  const historyData = await historyResponse.json();
  renderRecord(patientData.patient, historyData.history);
}

function renderRecord(patient, history) {
  const age = calculateAge(patient.birth_date);
  patientRecord.classList.remove('empty-state');
  patientRecord.innerHTML = `
    <div class="patient-record-head">
      <span class="clinical-avatar large">${initials(patient.full_name)}</span>
      <div>
        <h1>${escapeHtml(patient.full_name)}</h1>
        <p>${age} anos · ${escapeHtml(patient.sex)} · ${escapeHtml(patient.cpf || 'CPF nao informado')}</p>
      </div>
    </div>

    <div class="record-grid">
      <div class="info-box"><strong>Nascimento</strong><p>${formatDate(patient.birth_date)}</p></div>
      <div class="info-box"><strong>Telefone</strong><p>${escapeHtml(patient.phone || 'Nao informado')}</p></div>
      <div class="info-box"><strong>E-mail</strong><p>${escapeHtml(patient.email || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Tipo sanguineo</strong><p>${escapeHtml(history?.blood_type || 'Nao informado')}</p></div>
      <div class="info-box alert-box"><strong>Alergias</strong><p>${escapeHtml(history?.allergies || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Condicoes cronicas</strong><p>${escapeHtml(history?.chronic_conditions || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Medicamentos em uso</strong><p>${escapeHtml(history?.current_medications || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Ultima atualizacao</strong><p>${formatDateTime(history?.updated_at)}</p></div>
      <div class="info-box full"><strong>Observacoes</strong><p>${escapeHtml(history?.notes || 'Nao informado')}</p></div>
    </div>
  `;
}

function setView(view, title) {
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });

  views.overview.classList.toggle('hidden', view !== 'overview');
  views.patients.classList.toggle('hidden', view !== 'patients');
  views.placeholder.classList.toggle('hidden', ['overview', 'patients'].includes(view));
  viewTitle.textContent = title;

  if (!['overview', 'patients'].includes(view)) {
    placeholderTitle.textContent = title;
  }
}

function emptyState(title, subtitle) {
  return `
    <div class="empty-state-box">
      <div class="empty-icon">+</div>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(subtitle)}</p>
    </div>
  `;
}

function initials(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function priorityInitial(priority) {
  if (priority === 'CRITICA') return 'C';
  if (priority === 'ALTA') return 'A';
  if (priority === 'MEDIA') return 'M';
  return 'B';
}

function calculateAge(value) {
  if (!value) return '-';
  const birth = new Date(value);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function formatDate(value) {
  if (!value) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

loadData().catch(() => {
  recentPatients.innerHTML = emptyState('Erro ao carregar dados', 'Verifique se o webservice esta ativo.');
});
