const occurrencesEl = document.querySelector('#occurrences');
const countBadge = document.querySelector('#countBadge');
const mapSummary = document.querySelector('#mapSummary');
const mapEl = document.querySelector('#map');
const refreshButton = document.querySelector('#refreshButton');
const voiceButton = document.querySelector('#voiceButton');
const dialog = document.querySelector('#detailsDialog');
const dialogTitle = document.querySelector('#dialogTitle');
const dialogBody = document.querySelector('#dialogBody');
const closeDialog = document.querySelector('#closeDialog');
const toast = document.querySelector('#dashboardToast');
const logoutButton = document.querySelector('#logoutButton');

let occurrences = [];
let map;
let mapLayer;
let busyOccurrenceId = null;
let voiceEnabled = localStorage.getItem('geniamed.voice.enabled') === 'true';
let selectedVoice = null;

const averageUrbanSpeedKmH = 28;

const statusLabels = {
  ABERTA: 'Aberta',
  ALERTA_ENVIADO: 'Alerta recebido',
  EM_PREPARO: 'Em preparo',
  AGUARDANDO: 'Aguardando chegada',
  EM_ATENDIMENTO: 'Em atendimento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada'
};

configureVoice();

async function loadOccurrences() {
  const response = await fetch('/api/dashboard/occurrences');
  const data = await response.json();
  occurrences = data.occurrences || [];
  renderOccurrences();
  renderMap();
}

function renderOccurrences() {
  countBadge.textContent = occurrences.length;

  if (occurrences.length === 0) {
    occurrencesEl.innerHTML = '<p class="meta">Nenhuma ocorrencia aberta.</p>';
    return;
  }

  occurrencesEl.innerHTML = occurrences.map((item) => `
    <article class="occurrence-card ${busyOccurrenceId === item.id ? 'is-busy' : ''}">
      <div class="occurrence-head">
        <div>
          <strong>${escapeHtml(item.patient_name)}</strong>
          <div class="meta">${escapeHtml(item.unit_name || 'Unidade nao definida')} · Fila ${item.queue_position || '-'}</div>
        </div>
        <span class="priority ${item.priority}">${item.priority}</span>
      </div>
      <div class="status-line">
        <span class="status-badge ${item.status}">${escapeHtml(statusLabels[item.status] || item.status)}</span>
        <small>${escapeHtml(statusTimeText(item))}</small>
      </div>
      <div>
        <strong>${escapeHtml(item.need)}</strong>
        <div class="meta">${escapeHtml(item.category || '-')} / ${escapeHtml(item.subcategory || '-')}</div>
        <div class="meta">${escapeHtml(arrivalText(item))}</div>
        <div class="meta">${escapeHtml(trackingText(item))}</div>
      </div>
      <div class="actions">
        <button class="secondary" onclick="showDetails('${item.id}')">Detalhes</button>
        ${renderOperationalAction(item)}
        ${item.consultation_id ? `<button class="secondary" onclick="openMedicalRecord('${item.patient_id}')">Abrir prontuario</button>` : ''}
      </div>
    </article>
  `).join('');
}

function renderOperationalAction(item) {
  const disabled = busyOccurrenceId === item.id ? 'disabled' : '';
  const loading = busyOccurrenceId === item.id ? 'Processando...' : null;

  if (item.status === 'ABERTA' || item.status === 'ALERTA_ENVIADO') {
    return `<button ${disabled} onclick="advanceStatus('${item.id}', 'EM_PREPARO')">${loading || 'Preparar'}</button>`;
  }
  if (item.status === 'EM_PREPARO') {
    return `
      <button class="secondary" disabled>Em preparo</button>
      <button ${disabled} onclick="advanceStatus('${item.id}', 'AGUARDANDO')">${loading || 'Aguardar chegada'}</button>
    `;
  }
  if (item.status === 'AGUARDANDO') {
    return `
      <button class="secondary" disabled>Aguardando chegada</button>
      <button ${disabled} onclick="advanceStatus('${item.id}', 'EM_ATENDIMENTO')">${loading || 'Atender'}</button>
    `;
  }
  if (item.status === 'EM_ATENDIMENTO') {
    return `
      <button class="secondary" disabled>Em atendimento</button>
      <button ${disabled} onclick="advanceStatus('${item.id}', 'FINALIZADA')">${loading || 'Finalizar'}</button>
    `;
  }
  return '';
}

async function advanceStatus(id, status) {
  const item = occurrences.find((occurrence) => occurrence.id === id);
  if (!item || busyOccurrenceId) return;

  const messages = {
    EM_PREPARO: 'Iniciar a preparacao da equipe para este paciente?',
    AGUARDANDO: 'Confirmar que a unidade esta preparada e aguardando a chegada?',
    EM_ATENDIMENTO: 'Confirmar a chegada do paciente e iniciar o atendimento?',
    FINALIZADA: 'Finalizar o atendimento e retirar a ocorrencia da fila ativa?'
  };

  if (!confirm(messages[status])) return;

  busyOccurrenceId = id;
  renderOccurrences();

  try {
    const response = await fetch(`/api/occurrences/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Nao foi possivel atualizar a ocorrencia.');

    showToast(successMessage(status), 'success');
    await loadOccurrences();

    if (status === 'EM_ATENDIMENTO' && data.consultationId) {
      showToast('Atendimento iniciado e consulta clinica criada automaticamente.', 'success');
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    busyOccurrenceId = null;
    renderOccurrences();
  }
}

function successMessage(status) {
  if (status === 'EM_PREPARO') return 'Preparacao iniciada.';
  if (status === 'AGUARDANDO') return 'Unidade preparada e aguardando o paciente.';
  if (status === 'EM_ATENDIMENTO') return 'Atendimento iniciado.';
  if (status === 'FINALIZADA') return 'Atendimento finalizado.';
  return 'Status atualizado.';
}

function renderMap() {
  if (!ensureMap()) return;
  mapLayer.clearLayers();

  const visiblePoints = [];
  let mappedOccurrences = 0;

  for (const item of occurrences) {
    const patientPoint = getPatientPoint(item);
    const unitPoint = getUnitPoint(item);
    if (!patientPoint && !unitPoint) continue;
    mappedOccurrences += 1;

    if (patientPoint) {
      L.marker(patientPoint, {
        title: `Paciente: ${item.patient_name}`,
        icon: patientMarkerIcon(item.priority)
      })
        .bindPopup(`<strong>Paciente</strong><br>${escapeHtml(item.patient_name)}<br>${escapeHtml(item.need)} · ${escapeHtml(item.priority)}`)
        .addTo(mapLayer);
      visiblePoints.push(patientPoint);
    }

    if (unitPoint) {
      L.marker(unitPoint, {
        title: `Unidade: ${item.unit_name}`,
        icon: unitMarkerIcon()
      })
        .bindPopup(`<strong>Unidade escolhida</strong><br>${escapeHtml(item.unit_name || 'Unidade')}<br>${escapeHtml(item.unit_address || '')}`)
        .addTo(mapLayer);
      visiblePoints.push(unitPoint);
    }

    if (patientPoint && unitPoint) {
      L.polyline([patientPoint, unitPoint], {
        color: priorityColor(item.priority),
        weight: 4,
        opacity: 0.78
      }).bindPopup(escapeHtml(arrivalText(item))).addTo(mapLayer);
    }
  }

  if (visiblePoints.length > 0) {
    map.fitBounds(L.latLngBounds(visiblePoints), { padding: [32, 32], maxZoom: 15 });
  } else {
    map.setView([-23.5505, -46.6333], 11);
  }

  setTimeout(() => map.invalidateSize(), 100);
  const withEta = occurrences.filter((item) => estimateArrival(item)).length;
  mapSummary.textContent = mappedOccurrences === 0
    ? 'Aguardando ocorrencias com localizacao.'
    : `${mappedOccurrences} ocorrencia(s) no mapa · ${withEta} com previsao de chegada.`;
}

function showDetails(id) {
  const item = occurrences.find((occurrence) => occurrence.id === id);
  if (!item) return;

  dialogTitle.textContent = item.patient_name;
  dialogBody.innerHTML = `
    <div class="record-grid">
      <div class="info-box"><strong>Ocorrencia</strong><p>${escapeHtml(item.need)} · ${escapeHtml(item.category || '-')} · ${escapeHtml(item.subcategory || '-')}</p></div>
      <div class="info-box"><strong>Status atual</strong><p>${escapeHtml(statusLabels[item.status] || item.status)} · ${escapeHtml(item.priority)}</p></div>
      <div class="info-box"><strong>Unidade escolhida</strong><p>${escapeHtml(item.unit_name || 'Nao definida')}</p></div>
      <div class="info-box"><strong>Previsao de chegada</strong><p>${escapeHtml(arrivalText(item))}</p></div>
      <div class="info-box"><strong>Alergias</strong><p>${escapeHtml(item.allergies || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Condicoes cronicas</strong><p>${escapeHtml(item.chronic_conditions || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Medicamentos</strong><p>${escapeHtml(item.current_medications || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Tipo sanguineo</strong><p>${escapeHtml(item.blood_type || 'Nao informado')}</p></div>
    </div>
    <div class="status-history">
      <h3>Historico operacional</h3>
      ${renderStatusHistory(item.status_history)}
    </div>
  `;
  dialog.showModal();
}

function renderStatusHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return '<p class="meta">Nenhuma transicao registrada.</p>';
  }

  return history.map((entry) => `
    <div class="history-row">
      <span></span>
      <div>
        <strong>${escapeHtml(statusLabels[entry.toStatus] || entry.toStatus)}</strong>
        <p>${formatDateTime(entry.createdAt)} · ${escapeHtml(entry.actor || 'Sistema')}</p>
        ${entry.notes ? `<small>${escapeHtml(entry.notes)}</small>` : ''}
      </div>
    </div>
  `).join('');
}

function statusTimeText(item) {
  const value = item.attended_at || item.awaiting_arrival_at || item.prepared_at || item.created_at;
  return `Atualizado em ${formatDateTime(value)}`;
}

function trackingText(item) {
  if (!item.last_location_at) return 'Aguardando primeira atualizacao de localizacao.';
  const ageSeconds = Math.round((Date.now() - new Date(item.last_location_at).getTime()) / 1000);
  if (ageSeconds > 90) return `Atencao: localizacao desatualizada ha ${ageSeconds} segundos.`;
  return `Localizacao atualizada ha ${Math.max(0, ageSeconds)} segundos.`;
}

function openMedicalRecord(patientId) {
  window.location.href = `/prontuario.html?view=patients&patientId=${encodeURIComponent(patientId)}`;
}

function showToast(message, type) {
  toast.textContent = message;
  toast.className = `dashboard-toast ${type}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 4000);
}

function configureVoice() {
  updateVoiceButton();
  if (!('speechSynthesis' in window)) {
    voiceButton.disabled = true;
    voiceButton.textContent = 'Voz indisponivel';
    return;
  }

  selectPortugueseVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', selectPortugueseVoice);
}

function selectPortugueseVoice() {
  const voices = window.speechSynthesis.getVoices();
  selectedVoice = voices.find((voice) => voice.lang === 'pt-BR')
    || voices.find((voice) => voice.lang.startsWith('pt'))
    || null;
}

function toggleVoice() {
  if (!('speechSynthesis' in window)) return;
  voiceEnabled = !voiceEnabled;
  localStorage.setItem('geniamed.voice.enabled', String(voiceEnabled));
  updateVoiceButton();

  if (voiceEnabled) {
    speakAlert('Avisos por voz ativados.');
    showToast('Avisos por voz ativados.', 'success');
  } else {
    window.speechSynthesis.cancel();
    showToast('Avisos por voz desativados.', 'success');
  }
}

function updateVoiceButton() {
  voiceButton.textContent = voiceEnabled ? 'Voz ativada' : 'Ativar voz';
  voiceButton.classList.toggle('voice-active', voiceEnabled);
}

function speakAlert(message, interrupt = false) {
  if (!voiceEnabled || !('speechSynthesis' in window)) return;
  if (interrupt) window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;
  if (selectedVoice) utterance.voice = selectedVoice;
  window.speechSynthesis.speak(utterance);
}

function spokenProblem(data) {
  const value = data.problem || [data.category, data.subcategory, data.details].filter(Boolean).join(' ');
  if (!value) return 'demanda nao detalhada';
  return String(value).replaceAll('_', ' ').toLowerCase();
}

function ensureMap() {
  if (map) return true;
  if (!window.L) {
    mapSummary.textContent = 'Nao foi possivel carregar o servico de mapa.';
    mapEl.innerHTML = '<div class="map-error">Leaflet nao carregou. Verifique a conexao com a internet ou bloqueio ao CDN unpkg.com.</div>';
    return false;
  }

  map = L.map('map').setView([-23.5505, -46.6333], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  mapLayer = L.layerGroup().addTo(map);
  setTimeout(() => map.invalidateSize(), 100);
  return true;
}

function getPatientPoint(item) {
  if (!item.patient_latitude || !item.patient_longitude) return null;
  return [Number(item.patient_latitude), Number(item.patient_longitude)];
}

function getUnitPoint(item) {
  if (!item.unit_latitude || !item.unit_longitude) return null;
  return [Number(item.unit_latitude), Number(item.unit_longitude)];
}

function estimateArrival(item) {
  const patientPoint = getPatientPoint(item);
  const unitPoint = getUnitPoint(item);
  if (!patientPoint || !unitPoint) return null;
  const distance = distanceKm(patientPoint[0], patientPoint[1], unitPoint[0], unitPoint[1]);
  const minutes = Math.max(3, Math.round((distance / averageUrbanSpeedKmH) * 60));
  return { distanceKm: distance, minutes };
}

function arrivalText(item) {
  if (item.eta_minutes !== null && item.eta_minutes !== undefined) {
    return `${Number(item.distance_to_unit_km || 0).toFixed(1)} km · chegada estimada em ${item.eta_minutes} min`;
  }
  const eta = estimateArrival(item);
  if (!eta) return 'Previsao indisponivel: faltam coordenadas.';
  return `${eta.distanceKm.toFixed(1)} km · chegada estimada em ${eta.minutes} min`;
}

function distanceKm(originLat, originLng, targetLat, targetLng) {
  const earthRadiusKm = 6371;
  const latDelta = toRad(targetLat - originLat);
  const lngDelta = toRad(targetLng - originLng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRad(originLat)) * Math.cos(toRad(targetLat)) *
    Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value) {
  return value * Math.PI / 180;
}

function priorityColor(priority) {
  if (priority === 'CRITICA') return '#b42318';
  if (priority === 'ALTA') return '#dc2626';
  if (priority === 'MEDIA') return '#eab308';
  return '#16a34a';
}

function patientMarkerIcon(priority) {
  const level = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'].includes(priority) ? priority : 'BAIXA';
  return L.divIcon({
    className: 'map-div-icon',
    html: `<span class="patient-map-marker priority-${level}" aria-hidden="true"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16]
  });
}

function unitMarkerIcon() {
  return L.divIcon({
    className: 'map-div-icon',
    html: '<span class="unit-map-marker" aria-hidden="true">+</span>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18]
  });
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

refreshButton.addEventListener('click', loadOccurrences);
voiceButton.addEventListener('click', toggleVoice);
closeDialog.addEventListener('click', () => dialog.close());

function connectEvents() {
  const events = new EventSource('/api/dashboard/events');
  events.addEventListener('occurrence-created', (event) => {
    const data = JSON.parse(event.data);
    speakAlert(
      `Nova ocorrencia. Paciente ${data.patient_name}. Problema informado: ${spokenProblem(data)}. Unidade escolhida: ${data.unit_name || 'nao definida'}.`,
      true
    );
    loadOccurrences();
  });
  events.addEventListener('occurrence-updated', loadOccurrences);
  events.addEventListener('patient-location-updated', loadOccurrences);
  events.addEventListener('unit-change-responded', loadOccurrences);
  events.addEventListener('patient-eta-alert', (event) => {
    const data = JSON.parse(event.data);
    speakAlert(`Previsao atualizada. Paciente ${data.patientName}, chegada em aproximadamente ${data.etaMinutes} minutos na unidade ${data.unitName}.`);
  });
  events.addEventListener('patient-proximity-alert', (event) => {
    const data = JSON.parse(event.data);
    showToast(`${data.patientName} esta a aproximadamente ${data.etaMinutes} min de ${data.unitName}.`, 'success');
    speakAlert(`Atencao. O paciente ${data.patientName} esta a aproximadamente ${data.etaMinutes} minutos da unidade ${data.unitName}.`, true);
  });
  events.addEventListener('patient-arrival-alert', (event) => {
    const data = JSON.parse(event.data);
    showToast(`${data.patientName} chegou a ${data.unitName}.`, 'success');
    speakAlert(`Atencao. O paciente ${data.patientName} chegou a unidade ${data.unitName}. Problema informado: ${spokenProblem(data)}.`, true);
  });
  events.addEventListener('unit-change-suggested', (event) => {
    const data = JSON.parse(event.data);
    if (!data.suggestion) return;
    showToast(`${data.patientName}: sugestao de redirecionamento para ${data.suggestion.suggestedUnitName}.`, 'success');
    speakAlert(`Alerta de trajeto. O paciente ${data.patientName} pode estar se direcionando para outra unidade. Sugestao: ${data.suggestion.suggestedUnitName}.`);
  });
}

logoutButton.addEventListener('click', () => GeniamedAuth.logout());
GeniamedAuth.start().then((user) => {
  if (!user) return;
  loadOccurrences();
  connectEvents();
});
