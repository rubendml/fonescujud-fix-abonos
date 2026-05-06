const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const setText = (id, value) => {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = value;
  }
};

const fetchDashboardData = async () => {
  try {

    const response = await fetch(`${API_BASE_URL}/dashboard`);

    if (!response.ok) {
      throw new Error('Error');
    }

    const data = await response.json();

    updateDashboard(data);

    const now = new Date();

    setText(
      'lastUpdate',
      now.toLocaleString('es-CO')
    );

    document.getElementById('loading').style.display = 'none';

    document.getElementById('mainContent').style.display = 'block';

  } catch (error) {

    console.error(error);

    document.getElementById('loading').style.display = 'none';

    document.getElementById('errorMessage').style.display = 'block';
  }
};

const updateDashboard = (data) => {

  if (!data || !data.totales) return;

  const { totales, resumen } = data;

  // ===== TOP =====

  setText(
    'totalAfiliados',
    resumen?.usuarios_afiliados || 0
  );

  setText(
    'totalCuotas',
    formatCurrency(totales.cuotas)
  );

  setText(
    'totalCreditos',
    formatCurrency(totales.creditos)
  );

  setText(
    'totalPorCobrar',
    formatCurrency(resumen.saldo_pendiente)
  );

  // ===== CUOTAS =====

  setText(
    'cuotasTotal',
    formatCurrency(totales.cuotas)
  );

  setText(
    'cuotasCantidad',
    resumen?.usuarios_afiliados || 0
  );

  // ===== CREDITOS =====

  setText(
    'creditoTotal',
    formatCurrency(totales.creditos)
  );

  setText(
    'creditoSaldo',
    formatCurrency(resumen.saldo_pendiente)
  );

  setText(
    'creditoInteres',
    formatCurrency(resumen.interes_recaudado)
  );

  setText(
    'creditosActivos',
    resumen.creditos_activos || 0
  );

  // ===== MULTAS =====

  setText(
    'multasTotal',
    formatCurrency(totales.multas)
  );

  setText(
    'multasRecaudadas',
    formatCurrency(totales.multas)
  );

  setText(
    'multasPendientes',
    formatCurrency(resumen.multas_pendientes)
  );

  // ===== INGRESOS =====

  setText(
    'ingresosTotal',
    formatCurrency(totales.ingresos)
  );

  setText(
    'ingresoCuotas',
    formatCurrency(totales.cuotas)
  );

  setText(
    'ingresoInteres',
    formatCurrency(totales.interes_recaudado)
  );

  setText(
    'ingresoMultas',
    formatCurrency(totales.multas)
  );

  // ===== FONDOS =====

  setText(
    'fondosPrestamos',
    formatCurrency(totales.creditos)
  );

  // ===== POR COBRAR =====

  setText(
    'porCobrarTotal',
    formatCurrency(resumen.saldo_pendiente)
  );

  setText(
    'porCobrarSaldos',
    formatCurrency(resumen.saldo_pendiente)
  );

  setText(
    'porCobrarMultas',
    formatCurrency(resumen.multas_pendientes)
  );

  // ===== AFILIADOS =====

  setText(
    'afiliados',
    resumen.usuarios_afiliados || 0
  );

  setText(
    'noAfiliados',
    resumen.usuarios_no_afiliados || 0
  );
};

document.addEventListener('DOMContentLoaded', () => {

  fetchDashboardData();

  setInterval(fetchDashboardData, 300000);

});