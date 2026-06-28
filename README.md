# API Node.js MVC

## Rodar localmente com pgAdmin

1. Abra o pgAdmin.
2. Crie um banco vazio chamado `prontuario_mvp`.
3. Copie `.env.example` para `.env`.
4. Ajuste usuario e senha do PostgreSQL no `.env`.
5. Execute:

```bash
npm install
npm run migrate
npm run dev
```

Dashboard:

```text
http://localhost:3001
```

Prontuario:

```text
http://localhost:3001/prontuario.html
```

Area administrativa:

```text
http://localhost:3001/admin.html
```

## Endpoints principais

Login inicial academico. A troca da senha sera obrigatoria:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "Admin",
  "password": "Admin123"
}
```

As interfaces web usam cookie de sessao `HttpOnly`. Nao salve credenciais no `localStorage`.

CRUD administrativo de unidades, com cookie de sessao e token CSRF:

```http
GET /api/admin/units
X-CSRF-Token: TOKEN_RETORNADO_PELA_SESSAO
```

```http
POST /api/admin/units
X-CSRF-Token: TOKEN_RETORNADO_PELA_SESSAO
Content-Type: application/json

{
  "name": "Hospital Exemplo",
  "address": "Rua Central, 100",
  "city": "Sao Paulo",
  "state": "SP",
  "phone": "+55 11 3000-0000",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "active": true
}
```

Cadastros administrativos disponiveis na tela `/admin.html`:

- Unidades de atendimento: `units`
- Capacidades de atendimento por unidade: `unit_capabilities`
- Usuarios do sistema: `app_users`
- Protocolos de triagem: `triage_protocols`

As rotas administrativas ficam sob:

```text
/api/admin/units
/api/admin/capabilities
/api/admin/users
/api/admin/protocols
```

Os protocolos alimentam o endpoint usado pelo app Android:

```text
GET /api/occurrences/types
```

Assim, novas categorias e subcategorias de triagem podem ser cadastradas sem alterar o codigo do app.

## Registros clinicos do prontuario

Os modulos do prontuario persistem no PostgreSQL:

```text
clinical_triages
clinical_anamneses
clinical_consultations
clinical_prescriptions
clinical_prescription_items
clinical_evolutions
clinical_attachments
```

Endpoints:

```text
GET/POST /api/clinical/triages
GET/POST /api/clinical/anamneses
GET/POST /api/clinical/consultations
GET/POST /api/clinical/prescriptions
GET/POST /api/clinical/evolutions
GET/POST /api/clinical/attachments
```

## Fluxo operacional de ocorrencias

O dashboard aplica transicoes controladas:

```text
ALERTA_ENVIADO
EM_PREPARO
AGUARDANDO
EM_ATENDIMENTO
FINALIZADA
```

Cada mudanca registra horario, ator, auditoria e historico em `occurrence_status_history`.
Ao iniciar `EM_ATENDIMENTO`, uma consulta clinica e criada automaticamente e vinculada pela coluna `clinical_consultations.occurrence_id`.

## Rastreamento do paciente

Durante uma ocorrencia ativa, o app Android envia a localizacao aproximadamente a cada 30 segundos:

```text
POST /api/occurrences/:id/location
POST /api/occurrences/:id/unit-suggestions/:suggestionId/respond
```

O backend registra o historico em `occurrence_location_history`, calcula distancia/ETA, emite alerta de proximidade e pode sugerir uma unidade compativel mais proxima. A troca exige confirmacao do paciente e e registrada em auditoria.

### Simulador administrativo

Na area `/admin.html`, acesse `Simular trajeto`:

1. Selecione uma ocorrencia ativa.
2. Arraste o controle de progresso, clique no mapa ou informe latitude/longitude.
3. Clique em `Enviar posicao`.
4. Use `Simular 2 min` para testar o alerta de proximidade.
5. Use `Reiniciar alertas` para repetir os testes.

O simulador usa os mesmos endpoints, calculos e eventos SSE do app Android.

### Avisos por voz

No Dashboard operacional, clique em `Ativar voz` a cada abertura da pagina. O navegador usa `SpeechSynthesis` em portugues para anunciar:

- Inicio de uma nova ocorrencia, paciente, problema e unidade.
- Atualizacoes relevantes de ETA.
- Proximidade de aproximadamente dois minutos.
- Chegada do paciente.
- Sugestao de redirecionamento.

O clique e necessario por causa das politicas de reproducao automatica dos navegadores.

```http
POST /api/auth/qrcode
Content-Type: application/json

{ "qrToken": "CARTAO-MARIA-001" }
```

```http
GET /api/occurrences/types
```

```http
POST /api/units/nearby
Content-Type: application/json

{
  "latitude": -23.5651,
  "longitude": -46.6529,
  "need": "EMERGENCIA",
  "category": "DOR",
  "subcategory": "DOR_NO_PEITO"
}
```

```http
POST /api/occurrences
Authorization: Bearer TOKEN_TEMPORARIO_RETORNADO_PELO_QR
Content-Type: application/json

{
  "patientId": "11111111-1111-1111-1111-111111111111",
  "unitId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "need": "EMERGENCIA",
  "category": "DOR",
  "subcategory": "DOR_NO_PEITO",
  "details": "Dor forte iniciada ha 20 minutos",
  "latitude": -23.5651,
  "longitude": -46.6529
}
```

## Observacao clinica

O sistema classifica prioridade operacional inicial. Ele nao fecha diagnostico medico. Termos como infarto devem ser tratados como suspeita, risco ou sinal de alerta ate avaliacao da equipe.

## Render

No Render, configure as variaveis:

```text
NODE_ENV=production
DATABASE_URL=URL_DO_POSTGRES_DO_RENDER
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
AUTH_SECRET=uma_chave_aleatoria_com_no_minimo_32_caracteres
RENDER_EXTERNAL_URL=https://geniamed.onrender.com
CORS_ORIGIN=https://geniamed.onrender.com
PORT=3000
```

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

O `npm start` ja executa as migrations antes de subir o servidor.

Consulte tambem `../SECURITY.md`.
