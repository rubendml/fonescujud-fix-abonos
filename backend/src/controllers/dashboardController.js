import { supabase } from '../config.js';

export const getResumenGeneral = async (req, res) => {
  try {
    // 🔹 Obtener datos básicos
    const { data: cuotas, error: errorCuotas } = await supabase
      .from('cuotas')
      .select('*');

    const { data: multas, error: errorMultas } = await supabase
      .from('multas')
      .select('*');

    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('*');

    const { data: movimientos, error: errorMovimientos } = await supabase
      .from('movimientos_creditos')
      .select('*');

    if (errorCuotas || errorMultas || errorUsuarios || errorMovimientos) {
      console.error('Error consultando datos:', {
        errorCuotas,
        errorMultas,
        errorUsuarios,
        errorMovimientos
      });
      return res.status(500).json({ error: 'Error consultando datos' });
    }

    // 🔹 CÁLCULOS

    // Cuotas
    const total_cuotas =
      cuotas?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0;

    // Multas
    const total_multas =
      multas?.reduce((sum, m) => sum + (m.valor || 0), 0) || 0;

    // Créditos (desde movimientos_creditos)
    const total_creditos =
      movimientos
        ?.filter(m => m.tipo_movimiento === 'desembolso')
        .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

    // Abonos
    const total_pagado =
      movimientos
        ?.filter(m => m.tipo_movimiento === 'abono')
        .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

    // Intereses
    const total_intereses =
      movimientos
        ?.filter(m => m.tipo_movimiento === 'interes')
        .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

    // 🔥 SALDO REAL
    const saldo_pendiente = total_creditos - total_pagado;

    // Usuarios
    const usuarios_afiliados =
      usuarios?.filter(u => u.afiliado).length || 0;

    const usuarios_no_afiliados =
      usuarios?.filter(u => !u.afiliado).length || 0;

    // Ingresos (lo que realmente entra)
    const ingresos = total_cuotas + total_multas;

    // Efectivo disponible
    const efectivo_disponible = ingresos - total_creditos;

    // 🔹 RESPUESTA FINAL (compatible con tu frontend actual)
    return res.json({
      totales: {
        ingresos,
        cuotas: total_cuotas,
        creditos: total_creditos,
        multas: total_multas,
        abonos: total_pagado,
        efectivo_disponible
      },
      resumen: {
        usuarios_afiliados,
        usuarios_no_afiliados,
        creditos_activos:
          movimientos?.filter(m => m.tipo_movimiento === 'desembolso')
            .length || 0,
        creditos_pagados: total_pagado,
        total_creditos,
        multas_pendientes: total_multas,
        total_desembolsado: total_creditos,
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