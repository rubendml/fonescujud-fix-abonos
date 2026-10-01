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

// =========================
// CORS
// =========================
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

// =========================
// BODY PARSER
// =========================
app.use(express.json());

// =========================
// LOGS
// =========================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =========================
// RUTAS
// =========================
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/cuotas', cuotasRoutes);
app.use('/api/creditos', creditosRoutes);
app.use('/api/multas', multasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/auth', authRoutes);

// =========================
// HEALTH CHECK
// =========================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// =========================
// ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', err);

  res.status(500).json({
    error: 'Internal server error',
    detail: err.message
  });
});

// =========================
// LOCAL SERVER
// =========================
const PORT = config.server.port || 3000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}

// =========================
// EXPORT
// =========================
export default app;