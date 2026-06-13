const occurrenceTypes = [
  {
    need: 'EMERGENCIA',
    label: 'Emergencia',
    categories: [
      {
        code: 'DOR',
        label: 'Dor',
        subcategories: [
          { code: 'DOR_NO_PEITO', label: 'Dor no peito / suspeita cardiovascular', priority: 'CRITICA' },
          { code: 'DOR_ABDOMINAL', label: 'Dor abdominal', priority: 'ALTA' },
          { code: 'DOR_CABECA', label: 'Dor de cabeca intensa', priority: 'MEDIA' },
          { code: 'DOR_MEMBRO', label: 'Dor em membro', priority: 'MEDIA' }
        ]
      },
      {
        code: 'TRAUMA',
        label: 'Trauma',
        subcategories: [
          { code: 'FRATURA', label: 'Fratura aparente ou suspeita', priority: 'ALTA' },
          { code: 'QUEDA', label: 'Queda', priority: 'MEDIA' },
          { code: 'AMPUTACAO', label: 'Amputacao', priority: 'CRITICA' }
        ]
      },
      {
        code: 'FERIMENTO',
        label: 'Corte ou lesao',
        subcategories: [
          { code: 'CORTE_LESAO', label: 'Corte ou lesao', priority: 'MEDIA' },
          { code: 'SANGRAMENTO_INTENSO', label: 'Sangramento intenso', priority: 'CRITICA' },
          { code: 'QUEIMADURA', label: 'Queimadura', priority: 'ALTA' }
        ]
      },
      {
        code: 'RESPIRATORIO',
        label: 'Respiratorio',
        subcategories: [
          { code: 'FALTA_AR', label: 'Falta de ar', priority: 'CRITICA' },
          { code: 'CRISE_ASMA', label: 'Crise de asma/bronquite', priority: 'ALTA' }
        ]
      }
    ]
  },
  { need: 'CONSULTA', label: 'Consulta', categories: [] },
  { need: 'AGENDAMENTO', label: 'Agendamento', categories: [] },
  { need: 'RETORNO', label: 'Retorno', categories: [] },
  { need: 'EXAME', label: 'Exame', categories: [] },
  { need: 'OUTRO', label: 'Outro', categories: [] }
];

function inferPriority(need, category, subcategory) {
  if (need !== 'EMERGENCIA') return 'BAIXA';

  for (const type of occurrenceTypes) {
    for (const item of type.categories) {
      const found = item.subcategories.find((sub) => sub.code === subcategory);
      if (found) return found.priority;
    }
  }

  if (category === 'DOR' || category === 'TRAUMA') return 'MEDIA';
  return 'BAIXA';
}

module.exports = { occurrenceTypes, inferPriority };

