const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const welcomeText = document.getElementById('welcome-text');
const patientsList = document.getElementById('patients-list');
const patientDetails = document.getElementById('patient-details');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const searchButton = document.getElementById('search-button');
const loadAllButton = document.getElementById('load-all-button');
const patientSearch = document.getElementById('patient-search');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const API_BASE = '';

function getToken() {
  return localStorage.getItem('prontuario-token');
}

function getUserName() {
  return localStorage.getItem('prontuario-user-name');
}

function setSession(token, userName) {
  localStorage.setItem('prontuario-token', token);
  localStorage.setItem('prontuario-user-name', userName);
}

function clearSession() {
  localStorage.removeItem('prontuario-token');
  localStorage.removeItem('prontuario-user-name');
}

function showLogin() {
  dashboardSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
}

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  welcomeText.textContent = `Bem-vindo, ${getUserName() || 'usuário'}`;
}

function createErrorMessage(message) {
  return `<div class="message">${message}</div>`;
}

function renderPatients(patients) {
  if (!patients.length) {
    patientsList.innerHTML = '<p class="empty-state">Nenhum paciente encontrado.</p>';
    return;
  }

  patientsList.innerHTML = patients
    .map((patient) => {
      return `
        <div class="patient-row">
          <div>
            <p class="patient-name">${patient.full_name}</p>
            <p class="patient-meta">CPF: ${patient.cpf || 'N/A'} • ${patient.email || 'sem email'}</p>
          </div>
          <button data-id="${patient.id}">Ver</button>
        </div>
      `;
    })
    .join('');

  patientsList.querySelectorAll('button[data-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      loadPatientDetails(id);
    });
  });
}

function renderPatientDetails(patient) {
  if (!patient) {
    patientDetails.innerHTML = '<p class="empty-state">Selecione um paciente para ver os detalhes.</p>';
    return;
  }

  patientDetails.innerHTML = `
    <p><strong>Nome:</strong> ${patient.full_name}</p>
    <p><strong>Social:</strong> ${patient.social_name || 'N/A'}</p>
    <p><strong>CPF:</strong> ${patient.cpf || 'N/A'}</p>
    <p><strong>Telefone:</strong> ${patient.phone || 'N/A'}</p>
    <p><strong>Email:</strong> ${patient.email || 'N/A'}</p>
    <p><strong>Endereço:</strong> ${patient.address_street || '-'}, ${patient.address_number || '-'} ${patient.address_district || ''} - ${patient.address_city || ''}/${patient.address_state || ''}</p>
    <p><strong>Data de nascimento:</strong> ${patient.birth_date || 'N/A'}</p>
    <p><strong>Tipo sanguíneo:</strong> ${patient.blood_type || 'N/A'}</p>
    <p><strong>Alergias:</strong> ${patient.allergies || 'Nenhuma registrada'}</p>
  `;
}

async function fetchApi(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error || 'Erro ao conectar ao servidor';
    throw new Error(message);
  }

  return response.json();
}

async function loadPatients() {
  const term = patientSearch.value.trim();
  const path = term ? `/patients/search?name=${encodeURIComponent(term)}&limit=50` : '/patients';

  try {
    patientsList.innerHTML = '<p class="empty-state">Carregando pacientes...</p>';
    const result = await fetchApi(path);
    const patients = Array.isArray(result) ? result : result.data || [];
    renderPatients(patients);
    patientDetails.innerHTML = '<p class="empty-state">Selecione um paciente para ver os detalhes.</p>';
  } catch (error) {
    patientsList.innerHTML = createErrorMessage(error.message);
  }
}

async function loadPatientDetails(id) {
  try {
    patientDetails.innerHTML = '<p class="empty-state">Carregando...</p>';
    const patient = await fetchApi(`/patients/${id}`);
    renderPatientDetails(patient);
  } catch (error) {
    patientDetails.innerHTML = createErrorMessage(error.message);
  }
}

async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert('Informe email e senha.');
    return;
  }

  try {
    const result = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setSession(result.token, result.user.full_name || result.user.email);
    showDashboard();
    await loadPatients();
  } catch (error) {
    alert(error.message);
  }
}

function logout() {
  clearSession();
  showLogin();
  patientsList.innerHTML = '<p class="empty-state">Nenhum paciente carregado ainda.</p>';
  patientDetails.innerHTML = '<p class="empty-state">Selecione um paciente para ver os detalhes.</p>';
}

loginButton.addEventListener('click', login);
logoutButton.addEventListener('click', logout);
searchButton.addEventListener('click', loadPatients);
loadAllButton.addEventListener('click', () => {
  patientSearch.value = '';
  loadPatients();
});

window.addEventListener('DOMContentLoaded', () => {
  if (getToken()) {
    showDashboard();
    loadPatients();
  } else {
    showLogin();
  }
});
