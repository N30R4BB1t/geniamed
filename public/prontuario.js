const navButtons = document.querySelectorAll('.record-nav button');
const viewTitle = document.querySelector('#viewTitle');

const views = {
  overview: document.querySelector('#overviewView'),
  patients: document.querySelector('#patientsView'),
  triage: document.querySelector('#triageView'),
  triageForm: document.querySelector('#triageFormView'),
  anamnesis: document.querySelector('#anamnesisView'),
  anamnesisForm: document.querySelector('#anamnesisFormView'),
  consultations: document.querySelector('#consultationsView'),
  consultationForm: document.querySelector('#consultationFormView'),
  prescriptions: document.querySelector('#prescriptionsView'),
  prescriptionForm: document.querySelector('#prescriptionFormView'),
  timeline: document.querySelector('#timelineView'),
  evolutionForm: document.querySelector('#evolutionFormView'),
  attachments: document.querySelector('#attachmentsView'),
  attachmentForm: document.querySelector('#attachmentFormView'),
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

const triageList = document.querySelector('#triageList');
const triageForm = document.querySelector('#triageForm');
const anamnesisList = document.querySelector('#anamnesisList');
const anamnesisForm = document.querySelector('#anamnesisForm');
const consultationsList = document.querySelector('#consultationsList');
const consultationForm = document.querySelector('#consultationForm');
const prescriptionsList = document.querySelector('#prescriptionsList');
const prescriptionForm = document.querySelector('#prescriptionForm');
const prescriptionItems = document.querySelector('#prescriptionItems');
const prescriptionPatientName = document.querySelector('#prescriptionPatientName');
const evolutionsList = document.querySelector('#evolutionsList');
const evolutionForm = document.querySelector('#evolutionForm');
const attachmentsList = document.querySelector('#attachmentsList');
const attachmentForm = document.querySelector('#attachmentForm');

let patients = [];
let occurrences = [];
let triages = [];
let anamneses = [];
let consultations = [];
let prescriptions = [];
let evolutions = [];
let attachments = [];
let currentPrescriptionItems = [];

const viewLabels = {
  overview: 'Dashboard',
  patients: 'Pacientes',
  triage: 'Triagens',
  anamnesis: 'Anamneses',
  consultations: 'Consultas',
  prescriptions: 'Prescricoes',
  timeline: 'Evolucoes',
  attachments: 'Anexos'
};

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setView(button.dataset.view, button.textContent.replace('Em breve', '').trim());
  });
});

document.querySelector('#newPatientButton').addEventListener('click', () => newPatientDialog.showModal());
document.querySelector('#newPatientButton2').addEventListener('click', () => newPatientDialog.showModal());
document.querySelector('#newTriageButton').addEventListener('click', () => openForm('triageForm', 'Triagens'));
document.querySelector('#newAnamnesisButton').addEventListener('click', () => openForm('anamnesisForm', 'Anamneses'));
document.querySelector('#newConsultationButton').addEventListener('click', () => openForm('consultationForm', 'Consultas'));
document.querySelector('#newPrescriptionButton').addEventListener('click', () => openForm('prescriptionForm', 'Prescricoes'));
document.querySelector('#newEvolutionButton').addEventListener('click', () => openForm('evolutionForm', 'Evolucoes'));
document.querySelector('#newAttachmentButton').addEventListener('click', () => openForm('attachmentForm', 'Anexos'));

document.querySelector('#closeTriageForm').addEventListener('click', () => setView('triage', 'Triagens'));
document.querySelector('#cancelAnamnesisForm').addEventListener('click', () => setView('anamnesis', 'Anamneses'));
document.querySelector('#closeConsultationForm').addEventListener('click', () => setView('consultations', 'Consultas'));
document.querySelector('#cancelPrescriptionForm').addEventListener('click', () => setView('prescriptions', 'Prescricoes'));
document.querySelector('#closeEvolutionForm').addEventListener('click', () => setView('timeline', 'Evolucoes'));
document.querySelector('#closeAttachmentForm').addEventListener('click', () => setView('attachments', 'Anexos'));

closePatientDialog.addEventListener('click', () => newPatientDialog.close());
cancelPatientForm.addEventListener('click', () => newPatientDialog.close());

patientSearchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderPatientsList(patientSearch.value);
  setView('patients', 'Pacientes');
});

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

triageForm.addEventListener('input', () => {
  const weight = Number(triageForm.elements.weight.value);
  const height = Number(triageForm.elements.height.value);
  triageForm.elements.bmi.value = weight > 0 && height > 0 ? (weight / (height * height)).toFixed(1) : '';
});

triageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await postJson('/api/clinical/triages', formToTriage());
  if (!response) return;
  triageForm.reset();
  await loadData();
  setView('triage', 'Triagens');
});

anamnesisForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await postJson('/api/clinical/anamneses', formToAnamnesis());
  if (!response) return;
  anamnesisForm.reset();
  await loadData();
  setView('anamnesis', 'Anamneses');
});

consultationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await postJson('/api/clinical/consultations', formToConsultation());
  if (!response) return;
  consultationForm.reset();
  await loadData();
  setView('consultations', 'Consultas');
});

document.querySelector('#addPrescriptionItem').addEventListener('click', () => {
  const form = prescriptionForm.elements;
  if (!form.medication.value || !form.dose.value || !form.form.value || !form.route.value || !form.frequency.value || !form.duration.value) {
    alert('Preencha medicamento, dose, forma, via, frequencia e duracao.');
    return;
  }

  currentPrescriptionItems.push({
    medication: form.medication.value,
    dose: form.dose.value,
    form: form.form.value,
    route: form.route.value,
    frequency: form.frequency.value,
    duration: form.duration.value,
    instructions: form.instructions.value
  });

  form.medication.value = '';
  form.dose.value = '';
  form.form.value = '';
  form.route.value = '';
  form.frequency.value = '';
  form.duration.value = '';
  form.instructions.value = '';
  renderPrescriptionPreview();
});

prescriptionForm.addEventListener('change', () => {
  const patient = findPatient(prescriptionForm.elements.patientId.value);
  prescriptionPatientName.textContent = patient?.full_name || 'Selecione um paciente';
});

prescriptionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (currentPrescriptionItems.length === 0) {
    alert('Adicione ao menos um item na prescricao.');
    return;
  }

  const response = await postJson('/api/clinical/prescriptions', formToPrescription());
  if (!response) return;
  currentPrescriptionItems = [];
  prescriptionForm.reset();
  renderPrescriptionPreview();
  await loadData();
  setView('prescriptions', 'Prescricoes');
});

evolutionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await postJson('/api/clinical/evolutions', formToEvolution());
  if (!response) return;
  evolutionForm.reset();
  await loadData();
  setView('timeline', 'Evolucoes');
});

attachmentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await postJson('/api/clinical/attachments', formToAttachment());
  if (!response) return;
  attachmentForm.reset();
  await loadData();
  setView('attachments', 'Anexos');
});

async function loadData() {
  const [
    patientsResponse,
    occurrencesResponse,
    triagesResponse,
    anamnesesResponse,
    consultationsResponse,
    prescriptionsResponse,
    evolutionsResponse,
    attachmentsResponse
  ] = await Promise.all([
    fetch('/api/patients'),
    fetch('/api/dashboard/occurrences'),
    fetch('/api/clinical/triages'),
    fetch('/api/clinical/anamneses'),
    fetch('/api/clinical/consultations'),
    fetch('/api/clinical/prescriptions'),
    fetch('/api/clinical/evolutions'),
    fetch('/api/clinical/attachments')
  ]);

  const patientsData = await patientsResponse.json();
  const occurrencesData = await occurrencesResponse.json();
  const triagesData = await triagesResponse.json();
  const anamnesesData = await anamnesesResponse.json();
  const consultationsData = await consultationsResponse.json();
  const prescriptionsData = await prescriptionsResponse.json();
  const evolutionsData = await evolutionsResponse.json();
  const attachmentsData = await attachmentsResponse.json();

  patients = patientsData.patients || [];
  occurrences = occurrencesData.occurrences || [];
  triages = (triagesData.triages || []).map(mapTriage);
  anamneses = (anamnesesData.anamneses || []).map(mapAnamnesis);
  consultations = (consultationsData.consultations || []).map(mapConsultation);
  prescriptions = (prescriptionsData.prescriptions || []).map(mapPrescription);
  evolutions = (evolutionsData.evolutions || []).map(mapEvolution);
  attachments = (attachmentsData.attachments || []).map(mapAttachment);

  populatePatientSelects();
  renderPatientsList();
  renderAllLocal();
}

function renderAllLocal() {
  renderOverview();
  renderModuleList(triageList, triages, 'Nenhuma triagem registrada', 'Os registros realizados aparecerao nesta lista.', 'Triagem');
  renderModuleList(anamnesisList, anamneses, 'Nenhuma anamnese', 'Inicie o principal registro clinico do prototipo.', 'Anamnese');
  renderModuleList(consultationsList, consultations, 'Nenhuma consulta registrada', 'Os registros realizados aparecerao nesta lista.', 'Consulta');
  renderModuleList(prescriptionsList, prescriptions, 'Nenhuma prescricao', 'Crie um rascunho academico a partir de uma consulta.', 'Prescricao');
  renderModuleList(evolutionsList, evolutions, 'Nenhuma evolucao registrada', 'Registre a primeira evolucao da linha do tempo clinica.', 'Evolucao');
  renderModuleList(attachmentsList, attachments, 'Nenhum anexo registrado', 'Catalogue documentos e exames vinculados ao paciente.', 'Anexo');
  populateLinkedSelects();
}

function renderOverview() {
  patientsCount.textContent = patients.length;
  triageCount.textContent = triages.length;
  consultCount.textContent = consultations.length;
  activeCount.textContent = triages.length + anamneses.length + consultations.length;

  recentPatients.innerHTML = patients.length
    ? patients.slice(0, 5).map((patient) => patientListItem(patient)).join('')
    : emptyState('Nenhum paciente cadastrado', 'Cadastre o primeiro paciente ficticio para iniciar o fluxo.');

  const activity = [
    ...triages,
    ...anamneses,
    ...consultations,
    ...prescriptions,
    ...evolutions,
    ...attachments,
    ...occurrences.map((item) => ({ ...item, type: 'Ocorrencia', patientId: null, patientName: item.patient_name }))
  ].sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

  recentActivity.innerHTML = activity.length
    ? activity.slice(0, 5).map(activityItem).join('')
    : emptyState('Sem atividade registrada', 'As acoes realizadas aparecerao aqui.');
}

function renderPatientsList(filter = '') {
  const normalized = filter.trim().toLowerCase();
  const filtered = patients.filter((patient) => `${patient.id} ${patient.full_name} ${patient.cpf || ''}`.toLowerCase().includes(normalized));
  patientsList.innerHTML = filtered.length
    ? filtered.map((patient) => patientListItem(patient)).join('')
    : emptyState('Nenhum paciente encontrado', 'Revise o termo de busca ou cadastre um novo paciente.');
}

function renderModuleList(target, records, emptyTitle, emptySubtitle, type) {
  if (records.length === 0) {
    target.innerHTML = emptyState(emptyTitle, emptySubtitle);
    return;
  }

  target.innerHTML = `<div class="clinical-list">${records.map((record) => `
    <article class="module-row">
      <span class="clinical-avatar">${initials(type)}</span>
      <div>
        <strong>${escapeHtml(record.patientName || 'Paciente nao informado')}</strong>
        <small>${escapeHtml(type)} · ${formatDateTime(record.createdAt)}</small>
        <p>${escapeHtml(summaryFor(record, type))}</p>
      </div>
    </article>
  `).join('')}</div>`;
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

function openForm(view, title) {
  populatePatientSelects();
  populateLinkedSelects();
  if (view === 'prescriptionForm') {
    currentPrescriptionItems = [];
    renderPrescriptionPreview();
  }
  setView(view, title);
}

function setView(view, title) {
  navButtons.forEach((button) => {
    const activeView = button.dataset.view;
    const normalized = menuViewFor(view);
    button.classList.toggle('active', activeView === normalized);
  });

  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle('hidden', key !== view);
  });

  viewTitle.textContent = title;

  if (view === 'placeholder') placeholderTitle.textContent = title;
}

function menuViewFor(view) {
  if (view === 'triageForm') return 'triage';
  if (view === 'anamnesisForm') return 'anamnesis';
  if (view === 'consultationForm') return 'consultations';
  if (view === 'prescriptionForm') return 'prescriptions';
  if (view === 'evolutionForm') return 'timeline';
  if (view === 'attachmentForm') return 'attachments';
  return view;
}

function populatePatientSelects() {
  document.querySelectorAll('select[name="patientId"]').forEach((select) => {
    const current = select.value;
    select.innerHTML = patients.map((patient) => {
      const age = calculateAge(patient.birth_date);
      return `<option value="${patient.id}">${escapeHtml(patient.full_name)} · ${age} anos</option>`;
    }).join('');
    if (current) select.value = current;
  });
}

function populateLinkedSelects() {
  fillSelect(consultationForm.elements.triageId, triages, 'Selecionar');
  fillSelect(consultationForm.elements.anamnesisId, anamneses, 'Selecionar');
  fillSelect(prescriptionForm.elements.consultationId, consultations, 'Selecionar');
  fillSelect(evolutionForm.elements.consultationId, consultations, 'Selecionar');
  fillSelect(attachmentForm.elements.consultationId, consultations, 'Selecionar');
}

function fillSelect(select, records, placeholder) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>` + records.map((record) => (
    `<option value="${record.id}">${escapeHtml(record.patientName)} · ${formatDateTime(record.createdAt)}</option>`
  )).join('');
  if (current) select.value = current;
}

function renderPrescriptionPreview() {
  if (currentPrescriptionItems.length === 0) {
    prescriptionItems.innerHTML = emptyState('Nenhum item', 'Adicione medicamentos para compor o rascunho.');
    return;
  }

  prescriptionItems.innerHTML = currentPrescriptionItems.map((item, index) => `
    <article class="module-row compact">
      <span class="clinical-avatar">${index + 1}</span>
      <div>
        <strong>${escapeHtml(item.medication)}</strong>
        <small>${escapeHtml(item.dose)} · ${escapeHtml(item.form)} · ${escapeHtml(item.route)}</small>
        <p>${escapeHtml(item.frequency)} por ${escapeHtml(item.duration)}</p>
      </div>
    </article>
  `).join('');
}

function activityItem(item) {
  const type = item.type || item.need || 'Registro';
  return `
    <button class="clinical-row" type="button">
      <span class="clinical-avatar">${initials(type)}</span>
      <span>
        <strong>${escapeHtml(item.patientName || item.patient_name || 'Paciente')}</strong>
        <small>${escapeHtml(type)} · ${formatDateTime(item.createdAt || item.created_at)}</small>
      </span>
    </button>
  `;
}

function summaryFor(record, type) {
  if (type === 'Triagem') return record.data.complaint || 'Sinais vitais registrados.';
  if (type === 'Anamnese') return record.data.complaint || record.data.currentHistory || 'Rascunho de anamnese.';
  if (type === 'Consulta') return record.data.cid || record.data.status || 'Registro de consulta.';
  if (type === 'Prescricao') return `${record.items?.length || 0} item(ns) no rascunho.`;
  if (type === 'Evolucao') return record.data.assessment || record.data.notes || record.data.plan || 'Registro de evolucao.';
  if (type === 'Anexo') return record.data.title || record.data.fileName || 'Documento anexado.';
  return 'Registro academico.';
}

function formToTriage() {
  const data = Object.fromEntries(new FormData(triageForm).entries());
  return {
    patientId: data.patientId,
    complaint: data.complaint,
    systolic: numberOrNull(data.systolic),
    diastolic: numberOrNull(data.diastolic),
    heartRate: numberOrNull(data.heartRate),
    respRate: numberOrNull(data.respRate),
    temperature: numberOrNull(data.temperature),
    saturation: numberOrNull(data.saturation),
    weight: numberOrNull(data.weight),
    height: numberOrNull(data.height),
    bmi: numberOrNull(data.bmi),
    painScale: numberOrNull(data.painScale)
  };
}

function formToAnamnesis() {
  const data = Object.fromEntries(new FormData(anamnesisForm).entries());
  return {
    patientId: data.patientId,
    complaint: data.complaint,
    currentHistory: data.currentHistory,
    personalHistory: data.personalHistory || null,
    surgicalHistory: data.surgicalHistory || null,
    allergies: data.allergies || null,
    medications: data.medications || null,
    gynecoHistory: data.gynecoHistory || null,
    familyHistory: data.familyHistory || null,
    habits: data.habits || null,
    systemsReview: data.systemsReview || null,
    physicalExam: data.physicalExam || null
  };
}

function formToConsultation() {
  const data = Object.fromEntries(new FormData(consultationForm).entries());
  return {
    patientId: data.patientId,
    triageId: data.triageId || null,
    anamnesisId: data.anamnesisId || null,
    status: data.status,
    cid: data.cid || null,
    conduct: data.conduct || null,
    returnGuidance: data.returnGuidance || null
  };
}

function formToPrescription() {
  const data = Object.fromEntries(new FormData(prescriptionForm).entries());
  return {
    patientId: data.patientId,
    consultationId: data.consultationId || null,
    items: currentPrescriptionItems.map((item) => ({
      medication: item.medication,
      dose: item.dose,
      pharmaceuticalForm: item.form,
      route: item.route,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions || null
    }))
  };
}

function formToEvolution() {
  const data = Object.fromEntries(new FormData(evolutionForm).entries());
  return {
    patientId: data.patientId,
    consultationId: data.consultationId || null,
    evolutionType: data.evolutionType,
    subjective: data.subjective || null,
    objective: data.objective || null,
    assessment: data.assessment || null,
    plan: data.plan || null,
    notes: data.notes || null
  };
}

function formToAttachment() {
  const data = Object.fromEntries(new FormData(attachmentForm).entries());
  return {
    patientId: data.patientId,
    consultationId: data.consultationId || null,
    title: data.title,
    documentType: data.documentType,
    fileName: data.fileName || null,
    fileUrl: data.fileUrl || null,
    description: data.description || null
  };
}

function mapTriage(row) {
  return {
    id: row.id,
    type: 'Triagem',
    patientId: row.patient_id,
    patientName: row.patient_name,
    createdAt: row.created_at,
    data: {
      complaint: row.complaint,
      systolic: row.systolic,
      diastolic: row.diastolic,
      heartRate: row.heart_rate,
      respRate: row.resp_rate,
      temperature: row.temperature,
      saturation: row.saturation,
      weight: row.weight,
      height: row.height,
      bmi: row.bmi,
      painScale: row.pain_scale
    }
  };
}

function mapAnamnesis(row) {
  return {
    id: row.id,
    type: 'Anamnese',
    patientId: row.patient_id,
    patientName: row.patient_name,
    createdAt: row.created_at,
    data: {
      complaint: row.complaint,
      currentHistory: row.current_history,
      personalHistory: row.personal_history,
      surgicalHistory: row.surgical_history,
      allergies: row.allergies,
      medications: row.medications,
      gynecoHistory: row.gyneco_history,
      familyHistory: row.family_history,
      habits: row.habits,
      systemsReview: row.systems_review,
      physicalExam: row.physical_exam
    }
  };
}

function mapConsultation(row) {
  return {
    id: row.id,
    type: 'Consulta',
    patientId: row.patient_id,
    patientName: row.patient_name,
    createdAt: row.created_at,
    data: {
      triageId: row.triage_id,
      anamnesisId: row.anamnesis_id,
      status: row.status,
      cid: row.cid,
      conduct: row.conduct,
      returnGuidance: row.return_guidance
    }
  };
}

function mapPrescription(row) {
  return {
    id: row.id,
    type: 'Prescricao',
    patientId: row.patient_id,
    patientName: row.patient_name,
    createdAt: row.created_at,
    data: {
      consultationId: row.consultation_id
    },
    items: row.items || []
  };
}

function mapEvolution(row) {
  return {
    id: row.id,
    type: 'Evolucao',
    patientId: row.patient_id,
    patientName: row.patient_name,
    createdAt: row.created_at,
    data: {
      consultationId: row.consultation_id,
      evolutionType: row.evolution_type,
      subjective: row.subjective,
      objective: row.objective,
      assessment: row.assessment,
      plan: row.plan,
      notes: row.notes
    }
  };
}

function mapAttachment(row) {
  return {
    id: row.id,
    type: 'Anexo',
    patientId: row.patient_id,
    patientName: row.patient_name,
    createdAt: row.created_at,
    data: {
      consultationId: row.consultation_id,
      title: row.title,
      documentType: row.document_type,
      fileName: row.file_name,
      fileUrl: row.file_url,
      description: row.description
    }
  };
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) return response.json();

  const error = await response.json().catch(() => ({ error: 'Nao foi possivel salvar o registro.' }));
  alert(error.error || 'Nao foi possivel salvar o registro.');
  return null;
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
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

function findPatient(id) {
  return patients.find((patient) => patient.id === id);
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

document.querySelector('#logoutButton').addEventListener('click', () => GeniamedAuth.logout());

GeniamedAuth.start({ roles: ['ADMIN', 'MEDICO', 'ENFERMAGEM'] })
  .then((user) => {
    if (!user) return null;
    return loadData();
  })
  .then(async () => {
    if (!GeniamedAuth.user) return;
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('patientId');
    const view = params.get('view');

    if (view === 'patients' && patientId) {
      await selectPatient(patientId);
    }
  })
  .catch(() => {
    recentPatients.innerHTML = emptyState('Erro ao carregar dados', 'Verifique se o webservice esta ativo.');
  });
