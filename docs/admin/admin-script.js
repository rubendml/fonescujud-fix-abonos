// API Configuration viene de config.js cargado en el HTML
// const API_BASE_URL ya está definido globalmente

// State for editing
let currentEditingId = null;
let currentEditingType = null;

// Utility Functions
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No hay token de autenticación');
    window.location.href = '../login.html';
    return {};
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Manejar errores de autenticación
const handleAuthError = (response) => {
  if (response.status === 401) {
    console.error('Token expirado o inválido');
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    window.location.href = '../login.html';
    return true;
  }
  return false;
};

// Fetch con manejo de autenticación
const authFetch = async (url, options = {}) => {
  const headers = getAuthHeaders();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });

  if (handleAuthError(response)) {
    throw new Error('Unauthorized');
  }

  return response;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

// Modal Management
const openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'flex';
};

const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
};

// Close modals on background click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// Toast notification
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// Almacenar usuarios para usar en dropdowns
let usuariosCache = [];
// Almacenar créditos para filtros y búsqueda en vivo
let creditosCache = [];
// Almacenar cuotas para filtrado por mes
let cuotasCache = [];

// Cargar usuarios en los dropdowns
const loadUsuariosInSelects = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/usuarios`);
    const usuarios = await response.json();
    usuariosCache = usuarios;

    // Llenar los tres selects de usuarios
    const selects = ['cuotaUsuario', 'creditoUsuario', 'multaUsuario'];
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seleccionar usuario</option>';
        usuarios.forEach(u => {
          const option = document.createElement('option');
          option.value = u.id;
          option.textContent = `${u.nombre} (${u.cedula})`;
          select.appendChild(option);
        });
        if (currentValue) select.value = currentValue;
      }
    });
  } catch (error) {
    console.error('Error loading usuarios:', error);
  }
};

// Dashboard Data Fetch
const fetchDashboardData = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/dashboard`);
    if (!response.ok) throw new Error('Error fetching data');
    const data = await response.json();
    updateDashboard(data);
  } catch (error) {
    console.error('Error:', error);
    if (error.message !== 'Unauthorized') {
      updateDashboardError();
    }
  }
};

const updateDashboard = (data) => {
  if (!data || !data.totales) return;
  const { totales, resumen } = data;

  // Top stat cards
  const totalAfiliados = document.getElementById('totalAfiliados');
  const totalCuotas = document.getElementById('totalCuotas');
  const totalCreditos = document.getElementById('totalCreditos');
  const totalPorCobrar = document.getElementById('totalPorCobrar');
  if (totalAfiliados) totalAfiliados.textContent = resumen?.usuarios_afiliados || 0;
  if (totalCuotas) totalCuotas.textContent = formatCurrency(totales.cuotas || 0);
  if (totalCreditos) totalCreditos.textContent = formatCurrency(totales.creditos || 0);
  if (totalPorCobrar) totalPorCobrar.textContent = formatCurrency(totales.multas || 0);

  // Cuotas detail
  const cuotasTotal = document.getElementById('cuotasTotal');
  const cuotasCantidad = document.getElementById('cuotasCantidad');
  if (cuotasTotal) cuotasTotal.textContent = formatCurrency(totales.cuotas || 0);
  if (cuotasCantidad) cuotasCantidad.textContent = resumen?.usuarios_afiliados || 0;

  // Créditos detail
  const creditoTotal = document.getElementById('creditoTotal');
  const creditoSaldo = document.getElementById('creditoSaldo');
  const creditoInteres = document.getElementById('creditoInteresDetalle');
  const creditosActivos = document.getElementById('creditosActivos');
  if (creditoTotal) creditoTotal.textContent = formatCurrency(totales.creditos || 0);
  if (creditoSaldo) creditoSaldo.textContent = formatCurrency(resumen?.saldo_pendiente || 0);
  if (creditoInteres) creditoInteres.textContent = formatCurrency(totales.interes_recaudado || 0);
  if (creditosActivos) creditosActivos.textContent = resumen?.creditos_activos || 0;

  // Multas detail
  const multasTotal = document.getElementById('multasTotal');
  const multasRecaudadas = document.getElementById('multasRecaudadas');
  const multasPendientes = document.getElementById('multasPendientes');
  const totalMultas = (totales.multas || 0) + (resumen?.multas_pendientes || 0);
  if (multasTotal) multasTotal.textContent = formatCurrency(totalMultas);
  if (multasRecaudadas) multasRecaudadas.textContent = formatCurrency(totales.multas || 0);
  if (multasPendientes) multasPendientes.textContent = formatCurrency(resumen?.multas_pendientes || 0);

  // Efectivo disponible
  const efectivoIngresos = document.getElementById('efectivoIngresos');
  const efectivoDesembolsado = document.getElementById('efectivoDesembolsado');
  const efectivoDisponible = document.getElementById('efectivoDisponible');
  if (efectivoIngresos) efectivoIngresos.textContent = formatCurrency(totales.ingresos || 0);
  if (efectivoDesembolsado) efectivoDesembolsado.textContent = formatCurrency(totales.creditos || 0);
  if (efectivoDisponible) efectivoDisponible.textContent = formatCurrency(totales.efectivo_disponible || 0);

  // Financial summary section
  const ingresosTotal = document.getElementById('ingresosTotal');
  const ingresoCuotas = document.getElementById('ingresoCuotas');
  const ingresoInteres = document.getElementById('ingresoInteres');
  const ingresoMultas = document.getElementById('ingresoMultas');
  const fondosPrestamos = document.getElementById('fondosPrestamos');
  const porCobrarTotal = document.getElementById('porCobrarTotal');
  const porCobrarSaldos = document.getElementById('porCobrarSaldos');
  const porCobrarMultas = document.getElementById('porCobrarMultas');
  if (ingresosTotal) ingresosTotal.textContent = formatCurrency(totales.ingresos || 0);
  if (ingresoCuotas) ingresoCuotas.textContent = formatCurrency(totales.cuotas || 0);
  if (ingresoInteres) ingresoInteres.textContent = formatCurrency(totales.interes_recaudado || 0);
  if (ingresoMultas) ingresoMultas.textContent = formatCurrency(totales.multas || 0);
  if (fondosPrestamos) fondosPrestamos.textContent = formatCurrency(totales.creditos || 0);
  if (porCobrarTotal) porCobrarTotal.textContent = formatCurrency((resumen?.saldo_pendiente || 0) + (totales.multas || 0));
  if (porCobrarSaldos) porCobrarSaldos.textContent = formatCurrency(resumen?.saldo_pendiente || 0);
  if (porCobrarMultas) porCobrarMultas.textContent = formatCurrency(totales.multas || 0);

  // Info cards at bottom
  const afiliados = document.getElementById('afiliados');
  const noAfiliados = document.getElementById('noAfiliados');
  if (afiliados) afiliados.textContent = resumen?.usuarios_afiliados || 0;
  if (noAfiliados) noAfiliados.textContent = resumen?.usuarios_no_afiliados || 0;
};

const updateDashboardError = () => {
  const cards = ['dashIngresosTotales', 'dashCuotasTotal', 'dashCreditos', 'dashMultas'];
  cards.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '$0';
  });
};

// Fetch Usuarios
const fetchUsuarios = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/usuarios`);
    if (!response.ok) throw new Error('Error fetching usuarios');
    const usuarios = await response.json();
    displayUsuarios(usuarios);
  } catch (error) {
    console.error('Error:', error);
    displayError('usuarios');
  }
};

const displayUsuarios = (usuarios, filter = '') => {
  const tbody = document.querySelector('#usuariosTable');
  if (!tbody) return;

  // Guardar en cache
  usuariosCache = usuarios;

  // Filtrar por nombre si hay búsqueda
  let filtered = usuarios;
  if (filter.trim()) {
    const searchLower = filter.toLowerCase().trim();
    filtered = usuarios.filter(u =>
      u.nombre.toLowerCase().includes(searchLower) ||
      u.cedula.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">No se encontraron usuarios</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>${u.nombre}</td>
      <td>${u.cedula}</td>
      <td>${u.email}</td>
      <td>${u.afiliado ? 'Sí' : 'No'}</td>
      <td>${formatCurrency(u.valor_cuota || 0)}</td>
      <td><span class="badge ${u.estado ? 'badge-success' : 'badge-danger'}">${u.estado ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <button class="btn-small btn-edit" onclick="editUsuario(${u.id})">Editar</button>
        <button class="btn-small btn-danger" onclick="deleteUsuario(${u.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
};

const editUsuario = (id) => {
  currentEditingId = id;
  currentEditingType = 'usuario';

  // Buscar usuario en la tabla
  const rows = document.querySelectorAll('#usuariosTable tr');
  for (let row of rows) {
    const btn = row.querySelector(`button[onclick="editUsuario(${id})"]`);
    if (btn) {
      const cells = row.cells;
      document.getElementById('usuarioNombre').value = cells[0].textContent;
      document.getElementById('usuarioCedula').value = cells[1].textContent;
      document.getElementById('usuarioEmail').value = cells[2].textContent;
      document.getElementById('usuarioAfiliado').value = cells[3].textContent === 'Sí' ? '1' : '0';
      document.getElementById('usuarioCuota').value = cells[4].textContent.replace(/[^\d]/g, '');
      break;
    }
  }
  openModal('usuarioModal');
};

const deleteUsuario = async (id) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

  try {
    const response = await authFetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      showToast('Usuario eliminado correctamente', 'success');
      fetchUsuarios();
    } else {
      showToast('Error al eliminar usuario', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al eliminar usuario', 'error');
  }
};

// Fetch Cuotas
const fetchCuotas = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/cuotas`);
    if (!response.ok) throw new Error('Error fetching cuotas');
    const cuotas = await response.json();
    cuotasCache = cuotas;
    displayCuotas(cuotasCache);
  } catch (error) {
    console.error('Error:', error);
    displayError('cuotas');
  }
};

const displayCuotas = (cuotas) => {
  const tbody = document.querySelector('#cuotasTable');
  if (!tbody) return;

  const filtroMes = document.getElementById('cuotasFilter')?.value || '';

  let filtrados = (cuotas || []).filter(c => {
    if (!filtroMes) return true;
    return c.mes.toString() === filtroMes;
  });

  // Ordenar por fecha (más reciente primero)
  filtrados = filtrados.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));

  if (filtrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">No hay cuotas para mostrar</td></tr>';
    return;
  }

  tbody.innerHTML = filtrados.map(c => `
    <tr>
      <td>${c.usuarios?.nombre || 'N/A'}</td>
      <td>${c.mes}/${c.anio}</td>
      <td>${formatCurrency(c.valor_pagado)}</td>
      <td>${new Date(c.fecha_pago).toLocaleDateString('es-CO')}</td>
      <td><span class="badge badge-success">${c.estado}</span></td>
      <td>
        <button class="btn-small btn-edit" onclick="editCuota(${c.id})">Editar</button>
      </td>
    </tr>
  `).join('');
};

const editCuota = (id) => {
  currentEditingId = id;
  currentEditingType = 'cuota';
  openModal('cuotaModal');
};

// Mostrar resumen de cuotas por afiliado
const mostrarResumenCuotas = () => {
  if (!cuotasCache || cuotasCache.length === 0) {
    showToast('No hay cuotas cargadas', 'warning');
    return;
  }

  // Crear modal para pedir la cédula
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      <h2>Consultar Resumen de Cuotas</h2>
      <p>Ingrese el número de cédula del afiliado:</p>
      <input type="text" id="cedulaBusqueda" placeholder="Número de cédula" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px;">
      <div style="text-align: right; gap: 10px; display: flex; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="this.closest('.modal').remove();">Cancelar</button>
        <button class="btn btn-primary" onclick="buscarResumenAfiliado();">Buscar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Enfoque en el input
  setTimeout(() => document.getElementById('cedulaBusqueda')?.focus(), 100);
};

const buscarResumenAfiliado = async () => {
  const cedula = document.getElementById('cedulaBusqueda')?.value?.trim();
  if (!cedula) {
    showToast('Ingrese una cédula', 'warning');
    return;
  }

  // Cerrar modal de búsqueda
  document.querySelector('.modal')?.remove();

  if (!cuotasCache || cuotasCache.length === 0) {
    showToast('No hay cuotas cargadas', 'warning');
    return;
  }

  // Buscar usuario por cédula
  const cuotasUsuario = cuotasCache.filter(c => {
    const usuarioCedula = c.usuarios?.cedula || '';
    return usuarioCedula.toString() === cedula.toString();
  });

  if (cuotasUsuario.length === 0) {
    showToast(`No se encontraron cuotas para la cédula: ${cedula}`, 'warning');
    return;
  }

  const usuario = cuotasUsuario[0]?.usuarios;
  let totalPagado = 0;
  let totalCuotas = cuotasUsuario.length;

  // Ordenar por fecha (más reciente primero)
  cuotasUsuario.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));

  cuotasUsuario.forEach(c => {
    totalPagado += c.valor_pagado || 0;
  });

  // Crear modal con resumen
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      <h2>Resumen de Cuotas - ${usuario?.nombre || 'Usuario'}</h2>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <strong style="color: #666;">Cédula:</strong>
          <p style="margin: 5px 0; font-size: 1.1em; color: #094a5e;">${usuario?.cedula || 'N/A'}</p>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <strong style="color: #666;">Nombre:</strong>
          <p style="margin: 5px 0; font-size: 1.1em; color: #094a5e;">${usuario?.nombre || 'N/A'}</p>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <strong style="color: #666;">Email:</strong>
          <p style="margin: 5px 0; font-size: 0.95em; color: #094a5e;">${usuario?.email || 'N/A'}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; background: #e8f4f8; padding: 15px; border-radius: 8px;">
        <div>
          <strong style="color: #094a5e; display: block;">Cuotas Pagadas</strong>
          <p style="margin: 5px 0; font-size: 1.5em; color: #27ae60;">${totalCuotas}</p>
        </div>
        <div>
          <strong style="color: #094a5e; display: block;">Total Pagado</strong>
          <p style="margin: 5px 0; font-size: 1.5em; color: #27ae60;">${formatCurrency(totalPagado)}</p>
        </div>
        <div>
          <strong style="color: #094a5e; display: block;">Promedio por Cuota</strong>
          <p style="margin: 5px 0; font-size: 1.5em; color: #3498db;">${formatCurrency(totalPagado / totalCuotas)}</p>
        </div>
      </div>

      <h3 style="color: #094a5e; border-bottom: 2px solid #094a5e; padding-bottom: 10px;">Detalle de Cuotas</h3>
      <div style="max-height: 50vh; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
          <thead style="background: #094a5e; color: white; position: sticky; top: 0;">
            <tr>
              <th style="padding: 10px; text-align: left;">Mes/Año</th>
              <th style="padding: 10px; text-align: left;">Fecha de Pago</th>
              <th style="padding: 10px; text-align: right;">Monto</th>
              <th style="padding: 10px; text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${cuotasUsuario.map(c => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${c.mes}/${c.anio}</td>
                <td style="padding: 10px;">${new Date(c.fecha_pago).toLocaleDateString('es-CO')}</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${formatCurrency(c.valor_pagado)}</td>
                <td style="padding: 10px; text-align: center;">
                  <span class="badge badge-success">${c.estado}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="text-align: right; margin-top: 20px;">
        <button class="btn btn-secondary" onclick="this.closest('.modal').remove();">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

// Fetch Créditos
const fetchCreditos = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/creditos`);
    if (!response.ok) throw new Error('Error fetching creditos');
    const creditos = await response.json();
    creditosCache = creditos;
    displayCreditos(creditosCache);
  } catch (error) {
    console.error('Error:', error);
    displayError('creditos');
  }
};

const displayCreditos = (creditos) => {
  const tbody = document.querySelector('#creditosTable');
  if (!tbody) return;

  const filtroEstado = document.getElementById('creditosFilter')?.value || '';
  const filtroTexto = document.getElementById('creditosBuscarCedula')?.value?.trim().toLowerCase() || '';

  const filtrados = (creditos || []).filter(c => {
    if (filtroEstado && c.estado !== filtroEstado) return false;
    if (!filtroTexto) return true;

    const cedula = (c.usuarios?.cedula || '').toString().toLowerCase();
    const nombre = (c.usuarios?.nombre || '').toString().toLowerCase();
    const usuarioId = (c.usuario_id || '').toString().toLowerCase();

    return cedula.includes(filtroTexto) || nombre.includes(filtroTexto) || usuarioId.includes(filtroTexto);
  });

  if (filtrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">No hay créditos para mostrar</td></tr>';
    return;
  }

  tbody.innerHTML = filtrados.map(c => {
    const usuarioNombre = c.usuarios?.nombre || `Usuario ${c.usuario_id}`;
    return `
      <tr>
        <td>${usuarioNombre}</td>
        <td>${formatCurrency(c.monto_original)}</td>
        <td>${formatCurrency(c.saldo_actual)}</td>
        <td>${c.plazo_meses} meses</td>
        <td>${c.porcentaje_interes}%</td>
        <td><span class="badge ${c.estado === 'activo' ? 'badge-success' : 'badge-danger'}">${c.estado}</span></td>
        <td>
          <button class="btn-small btn-primary" onclick="verDetalleCredito(${c.id})">📋 Detalle</button>
          <button class="btn-small btn-info" onclick="abonarCredito(${c.id})">Abonar</button>
          <button class="btn-small btn-warning" onclick="registrarInteres(${c.id})">Intereses</button>
          <button class="btn-small btn-success" onclick="finalizarCredito(${c.id})">Finalizar</button>
        </td>
      </tr>
    `;
  }).join('');
};

const abonarCredito = (id) => {
  const monto = prompt('Ingresa el monto del abono:');
  if (monto && !isNaN(monto) && parseFloat(monto) > 0) {
    registrarAbono(id, parseFloat(monto));
  } else if (monto) {
    showToast('Monto inválido', 'error');
  }
};

const registrarAbono = async (creditoId, monto) => {
  try {
    console.log('[registrarAbono] Enviando:', { credito_id: creditoId, monto });
    const response = await authFetch(`${API_BASE_URL}/creditos/abono`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ credito_id: creditoId, monto })
    });

    const data = await response.json();
    console.log('[registrarAbono] Respuesta:', data);

    if (response.ok) {
      showToast(`Abono de $${monto.toLocaleString('es-CO')} registrado`, 'success');
      // Recargar créditos después de un pequeño delay para asegurar sincronización
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchCreditos();
      // Actualizar también el dashboard
      await fetchDashboardData();
    } else {
      showToast(`Error: ${data.error || 'No se pudo registrar el abono'}`, 'error');
    }
  } catch (error) {
    console.error('[registrarAbono] Error:', error);
    showToast('Error al registrar abono: ' + error.message, 'error');
  }
};

const registrarInteres = (id) => {
  const monto = prompt('Ingresa el monto del interés:');
  if (monto && !isNaN(monto) && parseFloat(monto) > 0) {
    crearRegistroInteres(id, parseFloat(monto));
  } else if (monto) {
    showToast('Monto inválido', 'error');
  }
};

const crearRegistroInteres = async (creditoId, monto) => {
  try {
    console.log('[crearRegistroInteres] Enviando:', { credito_id: creditoId, monto });
    const response = await authFetch(`${API_BASE_URL}/creditos/interes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ credito_id: creditoId, monto })
    });

    const data = await response.json();
    console.log('[crearRegistroInteres] Respuesta:', data);

    if (response.ok) {
      showToast(`Interés de $${monto.toLocaleString('es-CO')} registrado`, 'success');
      // Recargar créditos después de un pequeño delay para asegurar sincronización
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchCreditos();
      // Actualizar también el dashboard
      await fetchDashboardData();
    } else {
      showToast(`Error: ${data.error || 'No se pudo registrar el interés'}`, 'error');
    }
  } catch (error) {
    console.error('[crearRegistroInteres] Error:', error);
    showToast('Error al registrar interés: ' + error.message, 'error');
  }
};


const finalizarCredito = async (id) => {
  if (confirm('¿Estás seguro de que deseas finalizar este crédito?')) {
    try {
      const response = await authFetch(`${API_BASE_URL}/creditos/finalizar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ credito_id: id, estado_final: 'pagado' })
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Crédito finalizado correctamente', 'success');
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchCreditos();
        await fetchDashboardData();
      } else {
        showToast('Error: ' + (data.error || 'No se pudo finalizar el crédito'), 'error');
      }
    } catch (error) {
      console.error('[finalizarCredito] Error:', error);
      showToast('Error al finalizar crédito: ' + error.message, 'error');
    }
  }
};

const editCredito = (id) => {
  currentEditingId = id;
  currentEditingType = 'credito';
  openModal('creditoModal');
};

// Ver detalle completo de un crédito desde la tabla
const verDetalleCredito = async (creditoId) => {
  try {
    // Buscar el crédito en el cache
    const credito = creditosCache.find(c => c.id === creditoId);
    if (!credito) {
      showToast('Crédito no encontrado', 'error');
      return;
    }

    const usuario = {
      nombre: credito.usuarios?.nombre || 'Usuario',
      cedula: credito.usuarios?.cedula || 'N/A',
      email: credito.usuarios?.email || 'N/A',
      telefono: credito.usuarios?.telefono || 'N/A'
    };

    // Obtener movimientos del crédito
    mostrarDetalleCreditoModal(credito, usuario);
  } catch (error) {
    console.error('Error al ver detalle del crédito:', error);
    showToast('Error al cargar detalle del crédito: ' + error.message, 'error');
  }
};

// Búsqueda de Crédito por Cédula
const buscarCreditoPorCedula = async (cedula) => {
  if (!cedula || cedula.trim() === '') {
    showToast('Por favor ingresa una cédula', 'warning');
    return;
  }

  try {
    if (!creditosCache || creditosCache.length === 0) {
      await fetchCreditos();
    }

    const cedulaBuscar = cedula.trim();
    const creditos = creditosCache.filter(c => c.usuarios?.cedula === cedulaBuscar);

    if (!creditos || creditos.length === 0) {
      showToast('Este usuario no tiene créditos registrados', 'info');
      return;
    }

    // Buscar el crédito más reciente o activo
    let creditoSeleccionado = creditos.find(c => c.estado === 'activo') || creditos[0];
    const usuario = {
      nombre: creditoSeleccionado.usuarios?.nombre || 'Usuario',
      cedula: creditoSeleccionado.usuarios?.cedula || cedulaBuscar,
      email: creditoSeleccionado.usuarios?.email || 'N/A',
      telefono: creditoSeleccionado.usuarios?.telefono || 'N/A'
    };

    mostrarDetalleCreditoModal(creditoSeleccionado, usuario);
  } catch (error) {
    console.error('Error al buscar crédito:', error);
    showToast('Error al buscar crédito: ' + error.message, 'error');
  }
};

// Función wrapper para buscar desde sección de movimientos
const buscarCreditoPorCedulaMovimientos = async () => {
  const input = document.getElementById('movimientosCedulaBuscar');
  if (!input) return;

  const cedula = input.value.trim();
  if (!cedula) {
    showToast('Por favor ingresa una cédula', 'warning');
    return;
  }

  try {
    if (!creditosCache || creditosCache.length === 0) {
      await fetchCreditos();
    }

    const creditos = creditosCache.filter(c => c.usuarios?.cedula === cedula);

    if (!creditos || creditos.length === 0) {
      showToast('Este usuario no tiene créditos registrados', 'info');
      return;
    }

    // Buscar el crédito más reciente o activo
    let creditoSeleccionado = creditos.find(c => c.estado === 'activo') || creditos[0];
    const usuario = {
      nombre: creditoSeleccionado.usuarios?.nombre || 'Usuario',
      cedula: creditoSeleccionado.usuarios?.cedula || cedula,
      email: creditoSeleccionado.usuarios?.email || 'N/A',
      telefono: creditoSeleccionado.usuarios?.telefono || 'N/A'
    };

    // Mostrar el modal de detalle
    mostrarDetalleCreditoModal(creditoSeleccionado, usuario);

    // Filtrar los movimientos del crédito
    const response = await authFetch(`${API_BASE_URL}/movimientos`);
    if (!response.ok) throw new Error('Error al cargar movimientos');
    const todosMovimientos = await response.json();

    // Filtrar movimientos del crédito seleccionado
    const movimientosCredito = todosMovimientos.filter(m => m.credito_id === creditoSeleccionado.id);

    if (movimientosCredito.length === 0) {
      showToast(`El crédito #${creditoSeleccionado.id} no tiene movimientos registrados`, 'info');
    } else {
      showToast(`Mostrando ${movimientosCredito.length} movimiento(s) del crédito #${creditoSeleccionado.id}`, 'success');
    }

    // Mostrar solo los movimientos de este crédito
    displayMovimientos(movimientosCredito);

  } catch (error) {
    console.error('Error al buscar crédito:', error);
    showToast('Error al buscar crédito: ' + error.message, 'error');
  }
};

const mostrarDetalleCreditoModal = (credito, usuario) => {
  // Información del usuario
  const nombreEl = document.getElementById('creditoDetalleNombre');
  const cedulaEl = document.getElementById('creditoDetalleCedula');
  const emailEl = document.getElementById('creditoDetalleEmail');
  const telefonoEl = document.getElementById('creditoDetalleTelefono');
  if (nombreEl) nombreEl.textContent = usuario.nombre;
  if (cedulaEl) cedulaEl.textContent = usuario.cedula;
  if (emailEl) emailEl.textContent = usuario.email;
  if (telefonoEl) telefonoEl.textContent = usuario.telefono || 'N/A';

  // Información del crédito
  const montoEl = document.getElementById('creditoDetalleMonto');
  const saldoEl = document.getElementById('creditoDetalleSaldo');
  const fechaEl = document.getElementById('creditoDetalleFechaDesembolso');
  const plazoEl = document.getElementById('creditoDetallePlazo');
  const tasaEl = document.getElementById('creditoDetalleTasa');
  const estadoEl = document.getElementById('creditoDetalleEstado');
  if (montoEl) montoEl.textContent = formatCurrency(credito.monto_original);
  if (saldoEl) saldoEl.textContent = formatCurrency(credito.saldo_actual);
  if (fechaEl) fechaEl.textContent = new Date(credito.fecha_desembolso).toLocaleDateString('es-CO');
  if (plazoEl) plazoEl.textContent = credito.plazo_meses;
  if (tasaEl) tasaEl.textContent = credito.porcentaje_interes;
  if (estadoEl) {
    estadoEl.innerHTML = `<span class="badge ${credito.estado === 'activo' ? 'badge-success' : credito.estado === 'pagado' ? 'badge-info' : 'badge-danger'}">${credito.estado.toUpperCase()}</span>`;
  }
  const interesCobrado = parseFloat(credito.interes_cobrado || 0);

  const interesCobEl = document.getElementById('creditoDetalleInteresCobrado');
  if (interesCobEl) interesCobEl.textContent = formatCurrency(interesCobrado || 0);

  // Cambiar título del modal
  document.getElementById('creditoDetalleTitulo').textContent = `Detalle de Crédito - ${usuario.nombre}`;

  // Abrir el modal
  openModal('creditoDetalleModal');
};

const getTipoBadgeColor = (tipo) => {
  switch (tipo) {
    case 'desembolso': return '#094a5e';
    case 'abono': return '#27ae60';
    case 'interes': return '#f39c12';
    case 'ajuste': return '#9b59b6';
    default: return '#7f8c8d';
  }
};

// Fetch Multas
const fetchMultas = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/multas`);
    if (!response.ok) throw new Error('Error fetching multas');
    const multas = await response.json();
    displayMultas(multas);
  } catch (error) {
    console.error('Error:', error);
    displayError('multas');
  }
};

const displayMultas = (multas) => {
  const tbody = document.querySelector('#multasTable');
  if (!tbody) return;

  if (multas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">No hay multas registradas</td></tr>';
    return;
  }

  tbody.innerHTML = multas.map(m => {
    const usuarioNombre = m.usuarios?.nombre || `Usuario ${m.usuario_id}`;
    return `
    <tr>
      <td>${usuarioNombre}</td>
      <td>${m.motivo}</td>
      <td>${formatCurrency(m.valor)}</td>
      <td>${new Date(m.fecha_multa).toLocaleDateString('es-CO')}</td>
      <td><span class="badge ${m.estado === 'pagada' ? 'badge-success' : 'badge-danger'}">${m.estado}</span></td>
      <td>
        <button class="btn-small btn-edit" onclick="editMulta(${m.id})">Editar</button>
      </td>
    </tr>
  `;
  }).join('');
};

const editMulta = async (id) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/multas/${id}`);
    if (!response.ok) throw new Error('Error cargando multa');
    const multa = await response.json();

    currentEditingId = id;
    currentEditingType = 'multa';

    // Llenar los datos en el modal
    const usuarioSelect = document.getElementById('multaUsuario');
    // Asegurar que el select tenga las opciones cargadas antes de fijar el valor
    await loadUsuariosInSelects();
    usuarioSelect.value = multa.usuario_id;
    usuarioSelect.disabled = true; // Deshabilitar cambio de usuario

    document.getElementById('multaMotivo').value = multa.motivo;
    document.getElementById('multaValor').value = multa.valor;
    document.getElementById('multaFecha').value = multa.fecha_multa.split('T')[0];
    document.getElementById('multaEstado').value = multa.estado;

    // Cambiar título del modal
    document.querySelector('#multaModal h2').textContent = `Editar Multa - ${multa.usuarios?.nombre || 'Usuario desconocido'}`;

    openModal('multaModal');
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al cargar la multa', 'error');
  }
};

// Fetch Movimientos
const fetchMovimientos = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/movimientos`);
    if (!response.ok) throw new Error('Error fetching movimientos');
    const movimientos = await response.json();
    displayMovimientos(movimientos);
  } catch (error) {
    console.error('Error:', error);
    if (error.message !== 'Unauthorized') {
      displayError('movimientos');
    }
  }
};

const displayMovimientos = (movimientos) => {
  const tbody = document.querySelector('#movimientosTable');
  if (!tbody) return;

  const filterValue = document.getElementById('movimientosFilter')?.value || '';

  const filtered = filterValue
    ? movimientos.filter(m => m.tipo_movimiento === filterValue)
    : movimientos;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">No hay movimientos para mostrar</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    const usuario = m.usuarios?.nombre || 'Desconocido';
    const fecha = new Date(m.fecha_movimiento).toLocaleDateString('es-CO');
    const tipo = m.tipo_movimiento.charAt(0).toUpperCase() + m.tipo_movimiento.slice(1);

    let tipoBadge = 'badge-info';
    if (m.tipo_movimiento === 'desembolso') tipoBadge = 'badge-primary';
    if (m.tipo_movimiento === 'abono') tipoBadge = 'badge-success';
    if (m.tipo_movimiento === 'interes') tipoBadge = 'badge-warning';

    return `
      <tr>
        <td>#${m.credito_id}</td>
        <td>${usuario}</td>
        <td><span class="badge ${tipoBadge}">${tipo}</span></td>
        <td>${formatCurrency(m.monto)}</td>
        <td>${fecha}</td>
        <td>${m.descripcion || '-'}</td>
      </tr>
    `;
  }).join('');
};

// Fetch Reportes
const fetchReportes = async () => {
  try {
    // Obtener datos de dashboard
    const dashResponse = await authFetch(`${API_BASE_URL}/dashboard`);
    if (!dashResponse.ok) throw new Error('Error fetching dashboard');
    const dashData = await dashResponse.json();

    // Obtener datos de movimientos
    const movResponse = await authFetch(`${API_BASE_URL}/movimientos/resumen`);
    if (!movResponse.ok) throw new Error('Error fetching movimientos resumen');
    const movData = await movResponse.json();

    displayReportes(dashData, movData);
  } catch (error) {
    console.error('Error:', error);
  }
};

const displayReportes = (dashData, movData) => {
  // Actualizar resumen de créditos
  const resumen = dashData.resumen || {};

  const reportTotalDesembolsado = document.getElementById('reportTotalDesembolsado');
  const reportSaldoPendiente = document.getElementById('reportSaldoPendiente');
  const reportInteresAcumulado = document.getElementById('reportInteresAcumulado');
  const reportCreditosActivos = document.getElementById('reportCreditosActivos');
  const reportCreditosPagados = document.getElementById('reportCreditosPagados');
  const reportTotalCreditos = document.getElementById('reportTotalCreditos');

  if (reportTotalDesembolsado) reportTotalDesembolsado.textContent = formatCurrency(resumen.total_desembolsado || 0);
  if (reportSaldoPendiente) reportSaldoPendiente.textContent = formatCurrency(resumen.saldo_pendiente || 0);
  if (reportInteresAcumulado) reportInteresAcumulado.textContent = formatCurrency(resumen.interes_recaudado || 0);
  if (reportCreditosActivos) reportCreditosActivos.textContent = resumen.creditos_activos || 0;
  if (reportCreditosPagados) reportCreditosPagados.textContent = resumen.creditos_pagados || 0;
  if (reportTotalCreditos) reportTotalCreditos.textContent = resumen.total_creditos || 0;

  // Actualizar resumen de movimientos
  const reportTotalDesembolsos = document.getElementById('reportTotalDesembolsos');
  const reportTotalAbonos = document.getElementById('reportTotalAbonos');
  const reportTotalIntereses = document.getElementById('reportTotalIntereses');
  const reportMontoDesembolsado = document.getElementById('reportMontoDesembolsado');
  const reportMontoAbonado = document.getElementById('reportMontoAbonado');
  const reportMontoInteres = document.getElementById('reportMontoInteres');

  if (reportTotalDesembolsos) reportTotalDesembolsos.textContent = movData.desembolsos || 0;
  if (reportTotalAbonos) reportTotalAbonos.textContent = movData.abonos || 0;
  if (reportTotalIntereses) reportTotalIntereses.textContent = movData.intereses || 0;
  if (reportMontoDesembolsado) reportMontoDesembolsado.textContent = formatCurrency(movData.monto_total_desembolsado || 0);
  if (reportMontoAbonado) reportMontoAbonado.textContent = formatCurrency(movData.monto_total_abonado || 0);
  if (reportMontoInteres) reportMontoInteres.textContent = formatCurrency(movData.monto_total_interes || 0);
};

const displayError = (section) => {
  const tableId = `${section}Table`;
  const table = document.querySelector(`#${tableId}`);
  if (table) {
    const tbody = table.querySelector('tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:red;">Error cargando datos</td></tr>';
  }
};

// ========== FORM SUBMISSIONS ==========

// Nuevo/Editar Usuario
document.getElementById('usuarioForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    nombre: document.getElementById('usuarioNombre').value,
    cedula: document.getElementById('usuarioCedula').value,
    email: document.getElementById('usuarioEmail').value,
    afiliado: document.getElementById('usuarioAfiliado').value === '1',
    valor_cuota: parseInt(document.getElementById('usuarioCuota').value) || 0,
    estado: true
  };

  try {
    let response;
    if (currentEditingId) {
      response = await authFetch(`${API_BASE_URL}/usuarios/${currentEditingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
    } else {
      response = await authFetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
    }

    if (response.ok) {
      showToast(currentEditingId ? 'Usuario actualizado' : 'Usuario creado', 'success');
      closeModal('usuarioModal');
      currentEditingId = null;
      document.getElementById('usuarioForm').reset();
      fetchUsuarios();
    } else {
      const error = await response.json();
      showToast('Error: ' + (error.error || 'Error al guardar usuario'), 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al guardar usuario', 'error');
  }
});

// Registrar/Editar Cuota
document.getElementById('cuotaForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    usuario_id: parseInt(document.getElementById('cuotaUsuario').value),
    mes: parseInt(document.getElementById('cuotaMes').value),
    anio: parseInt(document.getElementById('cuotaAnio').value),
    valor_pagado: parseInt(document.getElementById('cuotaValor').value) || 0,
    fecha_pago: document.getElementById('cuotaFecha').value,
    estado: 'pagada'
  };

  try {
    const response = await authFetch(`${API_BASE_URL}/cuotas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      showToast('Cuota registrada', 'success');
      closeModal('cuotaModal');
      document.getElementById('cuotaForm').reset();
      fetchCuotas();
    } else {
      const error = await response.json();
      showToast('Error: ' + (error.error || 'Error al registrar cuota'), 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al registrar cuota', 'error');
  }
});

// Nuevo/Editar Crédito
document.getElementById('creditoForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const usuarioIdStr = document.getElementById('creditoUsuario').value;
  const montoStr = document.getElementById('creditoMonto').value;
  const plazoStr = document.getElementById('creditoPlazo').value;
  const interesStr = document.getElementById('creditoInteres').value;
  const fechaStr = document.getElementById('creditoFecha').value;
  const estado = document.getElementById('creditoEstado')?.value || 'activo';

  // Log de valores crudos
  console.log('Valores del formulario:', {
    usuarioIdStr, montoStr, plazoStr, interesStr, fechaStr
  });

  // Validación más robusta
  if (!usuarioIdStr || !montoStr || !plazoStr || !interesStr || !fechaStr) {
    showToast('Por favor completa todos los campos', 'error');
    console.log('Campo vacío detectado');
    return;
  }

  const usuarioId = parseInt(usuarioIdStr, 10);
  const monto = parseFloat(montoStr);
  const plazo = parseInt(plazoStr, 10);
  const interes = parseFloat(interesStr);

  // Validación numérica
  if (isNaN(usuarioId) || isNaN(monto) || isNaN(plazo) || isNaN(interes)) {
    showToast('Por favor verifica los valores numéricos', 'error');
    console.log('Error de conversión:', { usuarioId, monto, plazo, interes });
    return;
  }

  if (usuarioId <= 0 || monto <= 0 || plazo <= 0 || interes < 0) {
    showToast('Los montos y plazos deben ser mayores a 0', 'error');
    return;
  }

  const formData = {
    usuario_id: usuarioId,
    monto_original: monto,
    monto_solicitado: monto,
    plazo_meses: plazo,
    porcentaje_interes: interes,
    fecha_desembolso: fechaStr
  };

  console.log('Enviando crédito:', formData);

  try {
    const response = await authFetch(`${API_BASE_URL}/creditos`, {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    const responseData = await response.json();
    console.log('Respuesta del servidor:', responseData, 'Status:', response.status);

    if (response.ok) {
      showToast('Crédito registrado correctamente', 'success');
      closeModal('creditoModal');
      currentEditingId = null;
      document.getElementById('creditoForm').reset();
      fetchCreditos();
    } else {
      console.error('Error del servidor:', responseData);
      showToast('Error: ' + (responseData.error || 'Error al guardar crédito'), 'error');
    }
  } catch (error) {
    console.error('Error de red:', error);
    if (error.message !== 'Unauthorized') {
      showToast('Error al guardar crédito: ' + error.message, 'error');
    }
  }
});

// Nueva/Editar Multa
document.getElementById('multaForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    usuario_id: parseInt(document.getElementById('multaUsuario').value),
    motivo: document.getElementById('multaMotivo').value,
    valor: parseInt(document.getElementById('multaValor').value) || 0,
    fecha_multa: document.getElementById('multaFecha').value,
    estado: document.getElementById('multaEstado').value
  };

  try {
    let response;

    if (currentEditingId) {
      // Editar multa existente
      response = await authFetch(`${API_BASE_URL}/multas/${currentEditingId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
    } else {
      // Crear nueva multa
      response = await authFetch(`${API_BASE_URL}/multas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
    }

    if (response.ok) {
      showToast(currentEditingId ? 'Multa actualizada' : 'Multa creada', 'success');
      closeModal('multaModal');
      currentEditingId = null;
      document.querySelector('#multaModal h2').textContent = 'Nueva Multa';
      document.getElementById('multaForm').reset();
      fetchMultas();
      // Recargar dashboard para reflejar cambios
      fetchDashboardData();
    } else {
      const error = await response.json();
      showToast('Error: ' + (error.error || 'Error al guardar multa'), 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al guardar multa', 'error');
  }
});
// Navigation setup
const setupNavigation = () => {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.getAttribute('data-section');

      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));

      const sectionEl = document.getElementById(`${section}-section`);
      if (sectionEl) {
        sectionEl.classList.add('active');

        if (section === 'usuarios') fetchUsuarios();
        if (section === 'cuotas') fetchCuotas();
        if (section === 'creditos') fetchCreditos();
        if (section === 'movimientos') fetchMovimientos();
        if (section === 'multas') fetchMultas();
        if (section === 'reportes') fetchReportes();
      }

      const titles = {
        dashboard: 'Dashboard',
        usuarios: 'Usuarios',
        cuotas: 'Cuotas',
        creditos: 'Créditos',
        movimientos: 'Movimientos de Créditos',
        multas: 'Multas',
        reportes: 'Reportes'
      };
      const titleEl = document.getElementById('sectionTitle');
      if (titleEl) titleEl.textContent = titles[section] || 'Dashboard';
    });
  });

  // Logout button
  document.querySelector('.logout-btn')?.addEventListener('click', () => {
    alert('Sesión cerrada');
    window.location.href = '../public/';
  });
};

// Botones de creación
document.getElementById('btnNuevoUsuario')?.addEventListener('click', () => {
  currentEditingId = null;
  document.getElementById('usuarioForm').reset();
  openModal('usuarioModal');
});

document.getElementById('btnNuevaCuota')?.addEventListener('click', () => {
  currentEditingId = null;
  document.getElementById('cuotaForm').reset();
  loadUsuariosInSelects();
  openModal('cuotaModal');
});

document.getElementById('btnNuevoCredito')?.addEventListener('click', () => {
  currentEditingId = null;
  document.getElementById('creditoForm').reset();
  loadUsuariosInSelects();
  openModal('creditoModal');
});

document.getElementById('btnNuevaMulta')?.addEventListener('click', () => {
  currentEditingId = null;
  document.querySelector('#multaModal h2').textContent = 'Nueva Multa';
  const usuarioSelect = document.getElementById('multaUsuario');
  usuarioSelect.disabled = false; // Habilitar para nueva multa
  usuarioSelect.value = '';
  document.getElementById('multaForm').reset();
  loadUsuariosInSelects();
  openModal('multaModal');
});

// Botones de cerrar modal
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const modal = e.target.closest('.modal');
    if (modal) modal.style.display = 'none';
  });
});

// Botón de búsqueda de crédito por cédula
document.getElementById('btnBuscarCredito')?.addEventListener('click', () => {
  const cedula = document.getElementById('creditosBuscarCedula')?.value;
  buscarCreditoPorCedula(cedula);
});

// Permitir búsqueda con Enter
document.getElementById('creditosBuscarCedula')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const cedula = e.target.value;
    buscarCreditoPorCedula(cedula);
  }
});

// Búsqueda de crédito desde movimientos con Enter
document.getElementById('movimientosCedulaBuscar')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    buscarCreditoPorCedulaMovimientos();
  }
});

// Filtrado en vivo de créditos
document.getElementById('creditosBuscarCedula')?.addEventListener('input', () => {
  displayCreditos(creditosCache);
});

// Filtro de usuarios - búsqueda por nombre
document.getElementById('usuariosSearch')?.addEventListener('input', (e) => {
  const searchTerm = e.target.value;
  displayUsuarios(usuariosCache, searchTerm);
});

// Filtro de créditos
document.getElementById('creditosFilter')?.addEventListener('change', () => {
  if (creditosCache && creditosCache.length > 0) {
    displayCreditos(creditosCache);
  } else {
    fetchCreditos();
  }
});

// Filtro de cuotas por mes
document.getElementById('cuotasFilter')?.addEventListener('change', () => {
  if (cuotasCache && cuotasCache.length > 0) {
    displayCuotas(cuotasCache);
  } else {
    fetchCuotas();
  }
});

// Filtro de créditos
document.getElementById('creditosFilter')?.addEventListener('change', () => {
  fetchCreditos();
});

// Filtro de movimientos
document.getElementById('movimientosFilter')?.addEventListener('change', () => {
  fetchMovimientos();
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin panel loaded');
  setupNavigation();
  fetchDashboardData();
  fetchReportes();
  setInterval(() => {
    fetchDashboardData();
    fetchReportes();
  }, 300000);
});
