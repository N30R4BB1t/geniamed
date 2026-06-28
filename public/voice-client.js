window.GeniamedVoice = (() => {
  const storageKey = 'geniamed.voice.enabled';
  let enabled = localStorage.getItem(storageKey) === 'true';
  let selectedVoice = null;
  let button = null;
  let connected = false;

  function configure(targetButton) {
    button = targetButton || button;
    updateButton();

    if (!('speechSynthesis' in window)) {
      if (button) {
        button.disabled = true;
        button.textContent = 'Voz indisponivel';
      }
      return;
    }

    selectVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged', selectVoice);
  }

  function selectVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    selectedVoice = voices.find((voice) => voice.lang === 'pt-BR')
      || voices.find((voice) => voice.lang.startsWith('pt'))
      || null;
  }

  function toggle() {
    if (!('speechSynthesis' in window)) return;
    enabled = !enabled;
    localStorage.setItem(storageKey, String(enabled));
    updateButton();

    if (enabled) {
      speak('Avisos por voz ativados.');
    } else {
      window.speechSynthesis.cancel();
    }
  }

  function updateButton() {
    if (!button) return;
    button.textContent = enabled ? 'Voz ativada' : 'Ativar voz';
    button.classList.toggle('voice-active', enabled);
  }

  function speak(message, interrupt = false) {
    if (!enabled || !('speechSynthesis' in window)) return;
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

  function connectOperationalAlerts(options = {}) {
    if (connected) return;
    connected = true;

    const events = new EventSource('/api/dashboard/events');
    const refresh = () => options.onRefresh?.();
    const toast = (message, type = 'success') => options.onToast?.(message, type);

    events.addEventListener('occurrence-created', (event) => {
      const data = JSON.parse(event.data);
      speak(
        `Nova ocorrencia. Paciente ${data.patient_name}. Problema informado: ${spokenProblem(data)}. Unidade escolhida: ${data.unit_name || 'nao definida'}.`,
        true
      );
      refresh();
    });
    events.addEventListener('occurrence-updated', refresh);
    events.addEventListener('patient-location-updated', refresh);
    events.addEventListener('unit-change-responded', refresh);
    events.addEventListener('patient-eta-alert', (event) => {
      const data = JSON.parse(event.data);
      speak(`Previsao atualizada. Paciente ${data.patientName}, chegada em aproximadamente ${data.etaMinutes} minutos na unidade ${data.unitName}.`);
    });
    events.addEventListener('patient-proximity-alert', (event) => {
      const data = JSON.parse(event.data);
      toast(`${data.patientName} esta a aproximadamente ${data.etaMinutes} min de ${data.unitName}.`);
      speak(`Atencao. O paciente ${data.patientName} esta a aproximadamente ${data.etaMinutes} minutos da unidade ${data.unitName}.`, true);
    });
    events.addEventListener('patient-arrival-alert', (event) => {
      const data = JSON.parse(event.data);
      toast(`${data.patientName} chegou a ${data.unitName}.`);
      speak(`Atencao. O paciente ${data.patientName} chegou a unidade ${data.unitName}. Problema informado: ${spokenProblem(data)}.`, true);
    });
    events.addEventListener('unit-change-suggested', (event) => {
      const data = JSON.parse(event.data);
      if (!data.suggestion) return;
      toast(`${data.patientName}: sugestao de redirecionamento para ${data.suggestion.suggestedUnitName}.`);
      speak(`Alerta de trajeto. O paciente ${data.patientName} pode estar se direcionando para outra unidade. Sugestao: ${data.suggestion.suggestedUnitName}.`);
    });
  }

  return {
    configure,
    toggle,
    speak,
    connectOperationalAlerts
  };
})();
