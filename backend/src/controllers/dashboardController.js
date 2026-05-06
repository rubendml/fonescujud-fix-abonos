import { supabase } from '../config.js';

export const getResumenGeneral = async (req, res) => {
  try {

    // ===== CONSULTAS =====
    const { data: cuotas } = await supabase
      .from('recaudo_cuotas')
      .select('*')
      .eq('estado', 'pagado');

    const { data: multas } = await supabase
      .from('multas')
      .select('*');

    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('*');

    const { data: movimientos } = await supabase
      .from('movimientos_creditos')
      .select('*');

    // ===== CUOTAS =====
    const total_cuotas = cuotas?.reduce(
      (sum, c) => sum + (c.valor_pagado || 0), 0
    ) || 0;

    // ===== CRÉDITOS =====
    const total_desembolsado = movimientos
      ?.filter(m => m.tipo_movimiento === 'desembolso')
      .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

    const total_abonos = movimientos
      ?.filter(m => m.tipo_movimiento === 'abono')
      .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

    // ===== INTERESES COBRADOS (SOLO LOS QUE REALMENTE SE PAGARON) =====
    const intereses_cobrados = movimientos
    const intereses_cobrados = movimientos
      ?.filter(m => m.tipo_movimiento === 'interes')
      .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

    // ===== MULTAS =====
    const multas_pagadas = multas
      ?.filter(m => m.estado === 'pagada')
      .reduce((sum, m) => sum + (m.valor || 0), 0) || 0;

    const multas_pendientes = multas
      ?.filter(m => m.estado !== 'pagada')
      .reduce((sum, m) => sum + (m.valor || 0), 0) || 0;

    // =========================
    // 🔥 NUEVA LÓGICA CORRECTA
    // =========================

    // INGRESOS REALES (SIN ABONOS)
    const ingresos =
      total_cuotas +
      intereses_cobrados +
      multas_pagadas;

    // POR COBRAR (SOLO CAPITAL)
    const saldo_pendiente = total_desembolsado - total_abonos;

    // EFECTIVO DISPONIBLE
    const efectivo_disponible = ingresos - saldo_pendiente;

    return res.json({
      totales: {
        ingresos,
        cuotas: total_cuotas,
        creditos: total_desembolsado,
        multas: multas_pagadas,
        interes_recaudado: intereses_cobrados,
        efectivo_disponible
      },
      resumen: {
        usuarios_afiliados: usuarios?.filter(u => u.afiliado).length || 0,
        usuarios_no_afiliados: usuarios?.filter(u => !u.afiliado).length || 0,
        creditos_activos:
          movimientos?.filter(m => m.tipo_movimiento === 'desembolso').length || 0,
        total_creditos: total_desembolsado,
        saldo_pendiente,
        total_desembolsado,
        multas_pendientes,
        interes_recaudado: intereses_cobrados
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en dashboard' });
  }
};