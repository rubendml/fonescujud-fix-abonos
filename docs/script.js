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
    console.log('Fetching from:', `${API_BASE_URL}/dashboard`);

    const response = await fetch(`${API_BASE_URL}/dashboard`);
    if (!response.ok) throw new Error('Error al consultar dashboard');

    const data = await response.json();
    console.log('Data recibida:', data);

    updateDashboard(data);

    const now = new Date();
    const el = document.getElementById('lastUpdate');
    if (el) el.textContent = now.toLocaleString('es-CO');

  } catch (error) {
    console.error('Error dashboard público:', error);
  }
};

const updateDashboard = (data) => {
  if (!data || !data.totales) return;

  const { totales, resumen } = data;

  // 🔹 CARDS SUPERIORES
  const totalAfiliados = document.getElementById('totalAfiliados');
  const totalCuotas = document.getElementById('totalCuotas');
  const totalCreditos = document.getElementById('totalCreditos');
  const totalPorCobrar = document.getElementById('totalPorCobrar');

  if (totalAfiliados) totalAfiliados.textContent = resumen?.usuarios_afiliados || 0;
  if (totalCuotas) totalCuotas.textContent = formatCurrency(totales.cuotas || 0);
  if (totalCreditos) totalCreditos.textContent = formatCurrency(totales.creditos || 0);

  // 🔥 SOLO SALDO REAL (SIN INTERESES FUTUROS)
  if (totalPorCobrar) {
    totalPorCobrar.textContent = formatCurrency(
      resumen?.saldo_pendiente || 0
    );
  }

  // 🔹 INGRESOS
  const ingresosTotal = document.getElementById('ingresosTotal');
  const ingresoCuotas = document.getElementById('ingresoCuotas');
  const ingresoInteres = document.getElementById('ingresoInteres');
  const ingresoMultas = document.getElementById('ingresoMultas');

  if (ingresosTotal) ingresosTotal.textContent = formatCurrency(totales.ingresos || 0);
  if (ingresoCuotas) ingresoCuotas.textContent = formatCurrency(totales.cuotas || 0);
  if (ingresoInteres) ingresoInteres.textContent = formatCurrency(totales.interes_recaudado || 0);
  if (ingresoMultas) ingresoMultas.textContent = formatCurrency(totales.multas || 0);

  // 🔹 CRÉDITOS
  const creditoTotal = document.getElementById('creditoTotal');
  const creditoSaldo = document.getElementById('creditoSaldo');
  const creditoIntereses = document.getElementById('creditoIntereses');
  const creditoActivos = document.getElementById('creditoActivos');

  if (creditoTotal) creditoTotal.textContent = formatCurrency(totales.creditos || 0);
  if (creditoSaldo) creditoSaldo.textContent = formatCurrency(resumen?.saldo_pendiente || 0);
  if (creditoIntereses) creditoIntereses.textContent = formatCurrency(resumen?.interes_recaudado || 0);
  if (creditoActivos) creditoActivos.textContent = resumen?.creditos_activos || 0;
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Public dashboard cargado');
  fetchDashboardData();
  setInterval(fetchDashboardData, 300000);
});