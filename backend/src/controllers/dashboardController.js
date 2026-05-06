import { supabase } from '../config.js';

export const getResumenGeneral = async (req, res) => {
  try {
    // 🔹 CONSULTAS
    const { data: cuotas } = await supabase.from('cuotas').select('*');
    const { data: multas } = await supabase.from('multas').select('*');
    const { data: usuarios } = await supabase.from('usuarios').select('*');
    const { data: movimientos } = await supabase
      .from('movimientos_creditos')
      .select('*');

    // 🔹 CÁLCULOS

    const total_cuotas =
      cuotas?.reduce((sum, c) => sum + (c.valor_pagado || c.valor || 0), 0) || 0;

    const total_multas =
      multas?.reduce((sum, m) => sum + (m.valor || 0), 0) || 0;

    const total_creditos =
      movimientos
        ?.filter(m => m.tipo_movimiento === 'desembolso')
        .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

    const total_pagado =
      movimientos
        ?.filter(m => m.tipo_movimiento === 'abono')
        .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

    const total_intereses =
      movimientos
        ?.filter(m => m.tipo_movimiento === 'interes')
        .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

    const saldo_pendiente = total_creditos - total_pagado;

    const usuarios_afiliados =
      usuarios?.filter(u => u.afiliado).length || 0;

    const usuarios_no_afiliados =
      usuarios?.filter(u => !u.afiliado).length || 0;

    const ingresos = total_cuotas + total_multas;

    const efectivo_disponible = ingresos - total_creditos;

    return res.json({
      totales: {
        ingresos,
        cuotas: total_cuotas,
        creditos: total_creditos,
        multas: total_multas,
        abonos: total_pagado,
        efectivo_disponible,
        interes_recaudado: total_intereses // 🔥 FIX
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
    console.error('❌ Error en dashboard:', error);
    return res.status(500).json({
      error: 'Error al obtener resumen'
    });
  }
};