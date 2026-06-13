const form = document.querySelector('#patientForm');
const record = document.querySelector('#record');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const patientId = new FormData(form).get('patientId');

  try {
    const [patientResponse, historyResponse] = await Promise.all([
      fetch(`/api/patients/${patientId}`),
      fetch(`/api/patients/${patientId}/history`)
    ]);

    if (!patientResponse.ok) {
      record.className = 'panel record-panel empty';
      record.innerHTML = '<h2>Paciente nao encontrado</h2>';
      return;
    }

    const patientData = await patientResponse.json();
    const historyData = await historyResponse.json();
    renderRecord(patientData.patient, historyData.history);
  } catch (error) {
    record.innerHTML = '<h2>Erro ao buscar paciente</h2>';
  }
});

function renderRecord(patient, history) {
  record.className = 'panel record-panel';
  record.innerHTML = `
    <h1>${escapeHtml(patient.full_name)}</h1>
    <div class="record-grid">
      <div class="info-box"><strong>CPF</strong><p>${escapeHtml(patient.cpf || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Nascimento</strong><p>${formatDate(patient.birth_date)}</p></div>
      <div class="info-box"><strong>Sexo</strong><p>${escapeHtml(patient.sex)}</p></div>
      <div class="info-box"><strong>Telefone</strong><p>${escapeHtml(patient.phone || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Alergias</strong><p>${escapeHtml(history?.allergies || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Condicoes cronicas</strong><p>${escapeHtml(history?.chronic_conditions || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Medicamentos em uso</strong><p>${escapeHtml(history?.current_medications || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Tipo sanguineo</strong><p>${escapeHtml(history?.blood_type || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Observacoes</strong><p>${escapeHtml(history?.notes || 'Nao informado')}</p></div>
    </div>
  `;
}

function formatDate(value) {
  if (!value) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
