const occurrencesEl = document.querySelector('#occurrences');
const countBadge = document.querySelector('#countBadge');
const mapSummary = document.querySelector('#mapSummary');
const mapEl = document.querySelector('#map');
const refreshButton = document.querySelector('#refreshButton');
const dialog = document.querySelector('#detailsDialog');
const dialogTitle = document.querySelector('#dialogTitle');
const dialogBody = document.querySelector('#dialogBody');
const closeDialog = document.querySelector('#closeDialog');

let occurrences = [];
let map;
let mapLayer;

const averageUrbanSpeedKmH = 28;

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
    <article class="occurrence-card">
      <div class="occurrence-head">
        <div>
          <strong>${escapeHtml(item.patient_name)}</strong>
          <div class="meta">${escapeHtml(item.unit_name || 'Unidade nao definida')} · Fila ${item.queue_position || '-'}</div>
        </div>
        <span class="priority ${item.priority}">${item.priority}</span>
      </div>
      <div>
        <strong>${escapeHtml(item.need)}</strong>
        <div class="meta">${escapeHtml(item.category || '-')} / ${escapeHtml(item.subcategory || '-')}</div>
        <div class="meta">${escapeHtml(arrivalText(item))}</div>
      </div>
      <div class="actions">
        <button class="secondary" onclick="showDetails('${item.id}')">Detalhes</button>
        <button onclick="updateStatus('${item.id}', 'EM_PREPARO')">Preparar</button>
        <button onclick="updateStatus('${item.id}', 'EM_ATENDIMENTO')">Atender</button>
      </div>
    </article>
  `).join('');
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
        title: `Paciente: ${item.patient_name}`
      }).bindPopup(`
        <strong>Paciente</strong><br>
        ${escapeHtml(item.patient_name)}<br>
        ${escapeHtml(item.need)} · ${escapeHtml(item.priority)}
      `).addTo(mapLayer);
      visiblePoints.push(patientPoint);
    }

    if (unitPoint) {
      L.marker(unitPoint, {
        title: `Unidade: ${item.unit_name}`
      }).bindPopup(`
        <strong>Unidade escolhida</strong><br>
        ${escapeHtml(item.unit_name || 'Unidade')}<br>
        ${escapeHtml(item.unit_address || '')}
      `).addTo(mapLayer);
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
      <div class="info-box"><strong>Status</strong><p>${escapeHtml(item.status)} · ${escapeHtml(item.priority)}</p></div>
      <div class="info-box"><strong>Unidade escolhida</strong><p>${escapeHtml(item.unit_name || 'Nao definida')}</p></div>
      <div class="info-box"><strong>Previsao de chegada</strong><p>${escapeHtml(arrivalText(item))}</p></div>
      <div class="info-box"><strong>Alergias</strong><p>${escapeHtml(item.allergies || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Condicoes cronicas</strong><p>${escapeHtml(item.chronic_conditions || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Medicamentos</strong><p>${escapeHtml(item.current_medications || 'Nao informado')}</p></div>
      <div class="info-box"><strong>Tipo sanguineo</strong><p>${escapeHtml(item.blood_type || 'Nao informado')}</p></div>
    </div>
  `;
  dialog.showModal();
}

async function updateStatus(id, status) {
  await fetch(`/api/occurrences/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  await loadOccurrences();
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

  const distance = distanceKm(
    patientPoint[0],
    patientPoint[1],
    unitPoint[0],
    unitPoint[1]
  );
  const minutes = Math.max(3, Math.round((distance / averageUrbanSpeedKmH) * 60));

  return { distanceKm: distance, minutes };
}

function arrivalText(item) {
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
  if (priority === 'ALTA') return '#b54708';
  if (priority === 'MEDIA') return '#026aa2';
  return '#0f766e';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

refreshButton.addEventListener('click', loadOccurrences);
closeDialog.addEventListener('click', () => dialog.close());

const events = new EventSource('/api/dashboard/events');
events.addEventListener('occurrence-created', loadOccurrences);
events.addEventListener('occurrence-updated', loadOccurrences);

loadOccurrences();
