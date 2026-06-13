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
