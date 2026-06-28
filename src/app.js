const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const routes = require('./routes');
const { attachSession } = require('./middlewares/auth');

const app = express();
const production = ['production', 'prod'].includes(process.env.NODE_ENV);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  if (production && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://unpkg.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: production ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' }
}));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
    return callback(new Error('Origem nao autorizada pelo CORS.'));
  }
}));
app.use(express.json({ limit: '256kb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(attachSession);
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Pragma', 'no-cache');
  next();
});
app.use(express.static(path.join(__dirname, '..', 'public'), {
  etag: true,
  maxAge: production ? '1h' : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err);
  const isValidation = err.name === 'ZodError';
  const status = isValidation ? 400 : (err.status || 500);
  const exposeMessage = status < 500;
  res.status(status).json({
    error: isValidation
      ? 'Dados enviados sao invalidos.'
      : (exposeMessage ? err.message : 'Erro interno do servidor.')
  });
});

function allowedOrigins() {
  const configured = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  return [...new Set([
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    renderUrl,
    ...configured
  ].filter(Boolean))];
}

module.exports = app;
