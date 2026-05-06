const API_BASE_URL =
  window.location.hostname === 'rubendml.github.io'
    ? 'https://fonescujud-fix-abonos.vercel.app/api'
    : 'http://localhost:3000/api';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const fetchDashboardData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard`);
    if (!response.ok) throw new Error('Error');

    const data = await response.json();
    updateDashboard(data);

    const now = new Date();
    const el = document.getElementById('lastUpdate');
    if (el) el.textContent = now.toLocaleString('es-CO');

  } catch (error) {
    console.error(error);
  }
};

const updateDashboard = (data) => {
  if (!data || !data.totales) return;

  const { totales, resumen } = data;

  // TOP
  document.getElementById('totalAfiliados').textContent =
    resumen?.usuarios_afiliados || 0;

  document.getElementById('totalCuotas').textContent =
    formatCurrency(totales.cuotas);

  document.getElementById('totalCreditos').textContent =
    formatCurrency(totales.creditos);

  // 🔥 POR COBRAR = SOLO CAPITAL
  document.getElementById('totalPorCobrar').textContent =
    formatCurrency(resumen.saldo_pendiente);

  // INGRESOS
  document.getElementById('ingresosTotal').textContent =
    formatCurrency(totales.ingresos);

  document.getElementById('ingresoCuotas').textContent =
    formatCurrency(totales.cuotas);

  document.getElementById('ingresoInteres').textContent =
    formatCurrency(totales.interes_recaudado);

  document.getElementById('ingresoMultas').textContent =
    formatCurrency(totales.multas);

  // CRÉDITOS
  document.getElementById('creditoTotal').textContent =
    formatCurrency(totales.creditos);

  document.getElementById('creditoSaldo').textContent =
    formatCurrency(resumen.saldo_pendiente);

  document.getElementById('creditoIntereses').textContent =
    formatCurrency(resumen.interes_recaudado);

  document.getElementById('creditoActivos').textContent =
    resumen.creditos_activos;

  // EFECTIVO
  document.getElementById('efectivoIngresos').textContent =
    formatCurrency(totales.ingresos);

  document.getElementById('efectivoDesembolsado').textContent =
    formatCurrency(totales.creditos);

  document.getElementById('efectivoDisponible').textContent =
    formatCurrency(totales.efectivo_disponible);
};

document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardData();
  setInterval(fetchDashboardData, 300000);
});