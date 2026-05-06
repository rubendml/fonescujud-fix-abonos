import { supabase } from '../config.js';

export const getResumenGeneral = async (req, res) => {
  try {

    const { data: cuotas } = await supabase.from('cuotas').select('*').eq('estado', 'pagado');
    const { data: multas } = await supabase.from('multas').select('*');
    const { data: usuarios } = await supabase.from('usuarios').select('*');
    const { data: movimientos } = await supabase
      .from('movimientos_creditos')
      .select('*');

    // =========================
    // 🔢 CÁLCULOS REALES
    // =========================

    // CUOTAS
    const total_cuotas =
      cuotas?.reduce((sum, c) => sum + Number(c.valor_pagado || c.valor || 0), 0) || 0;

    // MULTAS
    const total_multas =
      multas?.reduce((sum, m) => sum + Number(m.valor || 0), 0) || 0;

    // DESEMBOLSOS (SALIDA DE DINERO)
    const total_desembolsos =
      movimientos
        ?.filter(m => m.tipo_movimiento === 'desembolso')
        .reduce((sum, m) => sum + Number(m.monto || 0), 0) || 0;

    // ABONOS (DINERO QUE REGRESA)
    const total_abonos =
      movimientos
        ?.filter(m => m.tipo_movimiento === 'abono')
        .reduce((sum, m) => sum + Number(m.monto || 0), 0) || 0;

    // INTERESES
    const total_intereses =
      movimientos
        ?.filter(m => m.tipo_movimiento === 'interes')
        .reduce((sum, m) => sum + Number(m.monto || 0), 0) || 0;

    // SALDO PENDIENTE (CRÉDITOS REALES)
    const saldo_pendiente = total_desembolsos - total_abonos;

    // USUARIOS
    const usuarios_afiliados =
      usuarios?.filter(u => u.afiliado).length || 0;

    const usuarios_no_afiliados =
      usuarios?.filter(u => !u.afiliado).length || 0;

    // =========================
    // 💰 FINANZAS REALES
    // =========================

    const ingresos = total_cuotas + total_multas + total_abonos;

    const efectivo_disponible =
      ingresos - total_desembolsos;

    // =========================
    // 📤 RESPUESTA
    // =========================

    return res.json({
      totales: {
        ingresos,
        cuotas: total_cuotas,
        creditos: total_desembolsos,
        multas: total_multas,
        abonos: total_abonos,
        efectivo_disponible,
        interes_recaudado: total_intereses
      },
      resumen: {
        usuarios_afiliados,
        usuarios_no_afiliados,
        creditos_activos:
          movimientos?.filter(m => m.tipo_movimiento === 'desembolso').length || 0,
        creditos_pagados: total_abonos,
        total_creditos: total_desembolsos,
        multas_pendientes: total_multas,
        total_desembolsado: total_desembolsos,
        saldo_pendiente,
        interes_acumulado: total_intereses,
        interes_recaudado: total_intereses
      }
    });

  } catch (error) {
    console.error('Error en dashboard:', error);
    return res.status(500).json({
      error: 'Error al obtener resumen'
    });
  }
};