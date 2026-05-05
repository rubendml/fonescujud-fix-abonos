import express from 'express';
import cors from 'cors';
import config from './config.js';
import usuariosRoutes from './routes/usuarios.js';
import cuotasRoutes from './routes/cuotas.js';
import creditosRoutes from './routes/creditos.js';
import multasRoutes from './routes/multas.js';
import dashboardRoutes from './routes/dashboard.js';
import movimientosRoutes from './routes/movimientos.js';
import authRoutes from './routes/auth.js';

const app = express();

// Middleware - Configuración de CORS para producción
const allowedOrigins = [
  'http://localhost:8000',
  'http://localhost:3000',
  'https://rubendml.github.io',
  'https://fonescujud-fix-abonos.vercel.app/api'
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.includes('github.io')) return true;
  if (origin.includes('vercel.app')) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.warn('[CORS] Origin bloqueado:', origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  res.header('Vary', 'Origin');
};

app.options('/api/*', (req, res) => {
  setCorsHeaders(req, res);
  return res.sendStatus(200);
});

// Forzar cabeceras CORS en todas las respuestas y manejar preflight explícito
app.use((req, res, next) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rutas API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/cuotas', cuotasRoutes);
app.use('/api/creditos', creditosRoutes);
app.use('/api/multas', multasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.server.port;

// Solo iniciar servidor si no está en Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     FONESCUJUD - Sistema de Fondo      ║
║             Backend Running             ║
╠════════════════════════════════════════╣
║  Puerto: ${PORT}
║  Entorno: ${config.server.nodeEnv}
║  Supabase: ${config.supabase.url ? 'Conectado' : 'No configurado'}
╚════════════════════════════════════════╝
    `);
  });
}

export default app;
