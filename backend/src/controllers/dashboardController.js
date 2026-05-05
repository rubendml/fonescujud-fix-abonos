import supabase, { supabaseAdmin } from '../db.js';

// Obtener resumen financiero general
export const getResumenGeneral = async (req, res) => {
  try {
    // Cuotas
    const { data: cuotas } = await supabaseAdmin
      .from('recaudo_cuotas')
      .select('valor_pagado')
      .eq('estado', 'pagado');

    // Créditos
    const { data: creditos } = await supabaseAdmin
      .from('creditos')
      .select('monto_original, saldo_actual, interes_acumulado, estado');

    // Movimientos de créditos (para intereses realmente cobrados)
    const { data: movimientos } = await supabaseAdmin
      .from('movimientos_creditos')
      .select('tipo_movimiento, monto')
      .eq('tipo_movimiento', 'interes');

    // Abonos realizados a créditos (dinero que vuelve al fondo)
    const { data: abonos } = await supabaseAdmin
      .from('movimientos_creditos')
      .select('monto')
      .eq('tipo_movimiento', 'abono');

    // Multas
    const { data: multas } = await supabaseAdmin
      .from('multas')
      .select('valor, estado');

    // Usuarios
    const { data: usuarios } = await supabaseAdmin
      .from('usuarios')
      .select('id, afiliado');

    // Cálculos
    const total_cuotas = cuotas?.reduce((sum, c) => sum + c.valor_pagado, 0) || 0;
    const total_desembolsado =
      creditos?.reduce((sum, c) => sum + c.monto_original, 0) || 0;
    const total_saldo_pendiente =
      creditos?.reduce((sum, c) => sum + c.saldo_actual, 0) || 0;
    const total_interes_generado =
      creditos?.reduce((sum, c) => sum + c.interes_acumulado, 0) || 0;
    // Intereses realmente cobrados
    const total_interes_recaudado =
      movimientos?.reduce((sum, m) => sum + m.monto, 0) || 0;
    const total_abonos =
      abonos?.reduce((sum, a) => sum + a.monto, 0) || 0;
    const total_multas_recaudadas =
      multas
        ?.filter((m) => m.estado === 'pagada')
        .reduce((sum, m) => sum + m.valor, 0) || 0;
    const total_multas_pendientes =
      multas
        ?.filter((m) => m.estado === 'pendiente')
        .reduce((sum, m) => sum + m.valor, 0) || 0;
    const afiliados = usuarios?.filter((u) => u.afiliado).length || 0;
    const no_afiliados = usuarios?.filter((u) => !u.afiliado).length || 0;

    const resumen = {
      fecha_consulta: new Date().toISOString(),
      cuotas: {
        total_recaudado: total_cuotas,
        cantidad_pagos: cuotas?.length || 0,
        promedio: cuotas?.length ? total_cuotas / cuotas.length : 0,
      },
      creditos: {
        total_desembolsado,
        saldo_pendiente: total_saldo_pendiente,
        interes_generado: total_interes_generado,
        cantidad_activos: creditos?.filter((c) => c.saldo_actual > 0).length || 0,
        cantidad_pagados: creditos?.filter((c) => c.saldo_actual === 0).length || 0,
      },
      multas: {
        total_recaudadas: total_multas_recaudadas,
        total_pendientes: total_multas_pendientes,
        cantidad_pagadas: multas?.filter((m) => m.estado === 'pagada').length || 0,
        cantidad_pendientes: multas?.filter((m) => m.estado === 'pendiente').length || 0,
      },
      usuarios: {
        afiliados,
        no_afiliados,
        total: (usuarios?.length || 0),
      },
      totales: {
        ingresos_totales:
          total_cuotas + total_interes_generado + total_multas_recaudadas,
        fondos_en_prestamos: total_desembolsado,
        por_cobrar: total_saldo_pendiente + total_multas_pendientes,
      },
    };

    // Calcular efectivo disponible
    // Ingresos: cuotas + intereses cobrados + multas recaudadas
    // Menos: créditos desembolsados
    const total_ingresos = total_cuotas + total_interes_recaudado + total_multas_recaudadas;

    // SUMAR abonos (dinero que regresa al fondo)
    const efectivo_disponible =
      total_ingresos +
      total_abonos -
      total_desembolsado;

    // Retornar datos en el formato esperado por el frontend
    res.json({
      totales: {
        ingresos: total_ingresos,
        cuotas: total_cuotas,
        creditos: total_desembolsado,
        multas: total_multas_recaudadas,
        interes_recaudado: total_interes_recaudado,
        abonos: total_abonos,
        efectivo_disponible: efectivo_disponible
      },
      resumen: {
        usuarios_afiliados: afiliados,
        usuarios_no_afiliados: no_afiliados,
        creditos_activos: creditos?.filter((c) => c.saldo_actual > 0).length || 0,
        creditos_pagados: creditos?.filter((c) => c.saldo_actual === 0).length || 0,
        total_creditos: creditos?.length || 0,
        multas_pendientes: total_multas_pendientes,
        total_desembolsado: total_desembolsado,
        saldo_pendiente: total_saldo_pendiente,
        interes_acumulado: total_interes_generado,
        interes_recaudado: total_interes_recaudado
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener dashboar data
export const getDashboardData = async (req, res) => {
  try {
    const resumen = await getResumenGeneral(req, res);
    // This will be handled by the getResumenGeneral function
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
