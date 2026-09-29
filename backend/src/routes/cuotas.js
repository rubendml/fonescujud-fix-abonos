import express from 'express';
import {
  registrarCuota,
  getCuotasUsuario,
  getAllCuotas,
  getCierrePresupuestal,
  getResumenCuotas,
} from '../controllers/cuotasController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/resumen', getResumenCuotas);
router.get('/usuario/:usuario_id', getCuotasUsuario);
router.get('/cierre-presupuestal', authMiddleware, adminOnly, getCierrePresupuestal);
router.get('/', getAllCuotas);

// Rutas protegidas
router.post('/', authMiddleware, adminOnly, registrarCuota);

export default router;
