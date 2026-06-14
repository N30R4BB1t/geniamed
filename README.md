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
http://localhost:3000
```

Prontuario:

```text
http://localhost:3000/prontuario.html
```

Area administrativa:

```text
http://localhost:3000/admin.html
```

## Endpoints principais

Login inicial:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "Admin",
  "password": "Admin123"
}
```

CRUD administrativo de unidades:

```http
GET /api/admin/units
Authorization: Bearer TOKEN_DO_LOGIN
```

```http
POST /api/admin/units
Authorization: Bearer TOKEN_DO_LOGIN
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
AUTH_SECRET=uma_chave_longa_e_segura
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
