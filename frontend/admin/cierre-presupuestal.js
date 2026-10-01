(() => {
    let cuotasCierre = [];
    let interesesCierre = [];
    let multasCierre = [];
    let valorCupo = 200000;

    const escaparHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);

    const obtenerSocios = () => {
        const selectedYear = document.getElementById('cierreYearFilter')?.value || '';
        const cuotas = cuotasCierre.filter(cuota =>
            cuota.estado === 'pagado' &&
            cuota.usuarios?.afiliado === true &&
            (!selectedYear || Number(cuota.anio) <= Number(selectedYear))
        );
        const participantes = new Map();

        cuotas.forEach(cuota => {
            const usuario = cuota.usuarios;
            if (!participantes.has(usuario.id)) {
                participantes.set(usuario.id, { usuario, cuotas: [], total: 0 });
            }
            const socio = participantes.get(usuario.id);
            socio.cuotas.push(cuota);
            socio.total += Number(cuota.valor_pagado) || 0;
        });

        return [...participantes.values()]
            .filter(socio => socio.total > 0)
            .sort((a, b) => b.total - a.total);
    };

    const obtenerInteresesPeriodo = () => {
        const selectedYear = document.getElementById('cierreYearFilter')?.value || '';
        return interesesCierre.filter(interes => {
            const periodo = periodoColombia(interes.fecha_movimiento);
            return periodo && (!selectedYear || periodo.year === Number(selectedYear));
        });
    };

    const obtenerMultasPeriodo = () => {
        const selectedYear = document.getElementById('cierreYearFilter')?.value || '';
        return multasCierre.filter(multa => {
            const periodo = periodoColombia(multa.fecha_pago);
            return multa.estado === 'pagada' && periodo && (!selectedYear || periodo.year === Number(selectedYear));
        });
    };

    const distribuirUtilidad = (socios, totalCupos, totalUtilidad) => {
        const utilidadCop = Math.round(totalUtilidad);
        const partes = socios.map((socio, index) => {
            const cupos = socio.total / valorCupo;
            const exacto = totalCupos > 0 ? utilidadCop * cupos / totalCupos : 0;
            const asignado = Math.floor(exacto);
            return { id: socio.usuario.id, asignado, residuo: exacto - asignado, index };
        });
        const pesosPendientes = utilidadCop - partes.reduce((sum, parte) => sum + parte.asignado, 0);

        [...partes].sort((a, b) => b.residuo - a.residuo || a.index - b.index)
            .slice(0, pesosPendientes)
            .forEach(parte => { parte.asignado += 1; });

        return new Map(partes.map(parte => [parte.id, parte.asignado]));
    };

    const nombreMes = mes => Number(mes) === 13
        ? 'Cuota extraordinaria'
        : new Date(2000, Number(mes) - 1, 1).toLocaleString('es-CO', { month: 'long' });

    const periodoColombia = fecha => {
        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return null;
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Bogota', year: 'numeric', month: 'numeric'
        }).formatToParts(date);
        return {
            year: Number(parts.find(part => part.type === 'year')?.value),
            month: Number(parts.find(part => part.type === 'month')?.value)
        };
    };

    const renderizarDetalleIntereses = intereses => {
        const tbody = document.getElementById('cierreInteresesTable');
        const periodos = new Map();

        intereses.forEach(interes => {
            const { year, month } = periodoColombia(interes.fecha_movimiento) || {};
            if (!year || !month) return;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            if (!periodos.has(key)) periodos.set(key, { year, month, total: 0, movimientos: [] });
            const periodo = periodos.get(key);
            periodo.total += Number(interes.monto) || 0;
            periodo.movimientos.push(interes);
        });

        const ordenados = [...periodos.values()].sort((a, b) => b.year - a.year || b.month - a.month);
        if (!ordenados.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay intereses registrados para este periodo</td></tr>';
            return;
        }

        tbody.innerHTML = ordenados.map(periodo => {
            const movimientos = periodo.movimientos.map(interes => `
                <tr>
                    <td>${new Date(interes.fecha_movimiento).toLocaleDateString('es-CO')}</td>
                    <td>${escaparHtml(interes.descripcion || 'Interés registrado')}</td>
                    <td>${formatCurrency(Number(interes.monto) || 0)}</td>
                </tr>
            `).join('');

            return `
                <tr>
                    <td>${escaparHtml(nombreMes(periodo.month))} ${periodo.year}</td>
                    <td>${periodo.movimientos.length.toLocaleString('es-CO')}</td>
                    <td>${formatCurrency(periodo.total)}</td>
                </tr>
                <tr class="closing-details-row">
                    <td colspan="3">
                        <details class="closing-details">
                            <summary>Ver ${periodo.movimientos.length.toLocaleString('es-CO')} movimientos</summary>
                            <table class="closing-payment-table">
                                <thead><tr><th>Fecha</th><th>Descripción</th><th>Interés</th></tr></thead>
                                <tbody>${movimientos}</tbody>
                            </table>
                        </details>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const renderizarDetalleMultas = multas => {
        const tbody = document.getElementById('cierreMultasTable');
        const periodos = new Map();

        multas.forEach(multa => {
            const { year, month } = periodoColombia(multa.fecha_pago) || {};
            if (!year || !month) return;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            if (!periodos.has(key)) periodos.set(key, { year, month, total: 0, multas: [] });
            const periodo = periodos.get(key);
            periodo.total += Number(multa.valor) || 0;
            periodo.multas.push(multa);
        });

        const ordenados = [...periodos.values()].sort((a, b) => b.year - a.year || b.month - a.month);
        if (!ordenados.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay multas pagadas para este periodo</td></tr>';
            return;
        }

        tbody.innerHTML = ordenados.map(periodo => {
            const detalle = periodo.multas.map(multa => `
                <tr>
                    <td>${new Date(multa.fecha_pago).toLocaleDateString('es-CO')}</td>
                    <td>${escaparHtml(multa.usuarios?.nombre || 'Usuario')}</td>
                    <td>${escaparHtml(multa.motivo || multa.descripcion || 'Multa pagada')}</td>
                    <td>${formatCurrency(Number(multa.valor) || 0)}</td>
                </tr>
            `).join('');

            return `
                <tr>
                    <td>${escaparHtml(nombreMes(periodo.month))} ${periodo.year}</td>
                    <td>${periodo.multas.length.toLocaleString('es-CO')}</td>
                    <td>${formatCurrency(periodo.total)}</td>
                </tr>
                <tr class="closing-details-row">
                    <td colspan="3">
                        <details class="closing-details">
                            <summary>Ver ${periodo.multas.length.toLocaleString('es-CO')} multas pagadas</summary>
                            <table class="closing-payment-table">
                                <thead><tr><th>Fecha de pago</th><th>Usuario</th><th>Motivo</th><th>Valor</th></tr></thead>
                                <tbody>${detalle}</tbody>
                            </table>
                        </details>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const renderizarCierre = () => {
        const tbody = document.getElementById('cierreTable');
        if (!tbody) return;

        const socios = obtenerSocios();
        const totalAportes = socios.reduce((total, socio) => total + socio.total, 0);
        const totalCuotas = socios.reduce((total, socio) => total + socio.cuotas.length, 0);
        const totalCupos = totalAportes / valorCupo;
        const intereses = obtenerInteresesPeriodo();
        const totalIntereses = intereses.reduce((total, interes) => total + (Number(interes.monto) || 0), 0);
        const multas = obtenerMultasPeriodo();
        const totalMultas = multas.reduce((total, multa) => total + (Number(multa.valor) || 0), 0);
        const totalUtilidades = totalIntereses + totalMultas;
        const utilidadPorCupo = totalCupos > 0 ? totalUtilidades / totalCupos : 0;
        const asignacionesIntereses = distribuirUtilidad(socios, totalCupos, totalIntereses);
        const asignacionesMultas = distribuirUtilidad(socios, totalCupos, totalMultas);
        const busqueda = (document.getElementById('cierreSearch')?.value || '').trim().toLocaleLowerCase('es-CO');

        document.getElementById('cierreTotalAportes').textContent = formatCurrency(totalAportes);
        document.getElementById('cierreTotalCupos').textContent = totalCupos.toLocaleString('es-CO', { maximumFractionDigits: 2 });
        document.getElementById('cierreTotalSocios').textContent = socios.length.toLocaleString('es-CO');
        document.getElementById('cierreTotalCuotas').textContent = totalCuotas.toLocaleString('es-CO');
        document.getElementById('cierreTotalIntereses').textContent = formatCurrency(totalIntereses);
        document.getElementById('cierreTotalMultas').textContent = formatCurrency(totalMultas);
        document.getElementById('cierreTotalUtilidades').textContent = formatCurrency(totalUtilidades);
        document.getElementById('cierreUtilidadPorCupo').textContent = formatCurrency(utilidadPorCupo);
        renderizarDetalleIntereses(intereses);
        renderizarDetalleMultas(multas);

        const visibles = socios.filter(({ usuario }) =>
            String(usuario.nombre || '').toLocaleLowerCase('es-CO').includes(busqueda) ||
            String(usuario.cedula || '').toLocaleLowerCase('es-CO').includes(busqueda)
        );

        if (!visibles.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No hay afiliados aportantes para este filtro</td></tr>';
            return;
        }

        tbody.innerHTML = visibles.map(({ usuario, cuotas, total }) => {
            const porcentaje = totalAportes > 0 ? total / totalAportes * 100 : 0;
            const cupos = total / valorCupo;
            const utilidadIntereses = asignacionesIntereses.get(usuario.id) || 0;
            const utilidadMultas = asignacionesMultas.get(usuario.id) || 0;
            const detalle = [...cuotas]
                .sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago))
                .map(cuota => `
          <tr>
            <td>${escaparHtml(nombreMes(cuota.mes))} ${escaparHtml(cuota.anio)}</td>
            <td>${formatCurrency(Number(cuota.valor_pagado) || 0)}</td>
                        <td>${((Number(cuota.valor_pagado) || 0) / valorCupo).toLocaleString('es-CO', { maximumFractionDigits: 2 })}</td>
            <td>${new Date(cuota.fecha_pago).toLocaleDateString('es-CO')}</td>
          </tr>
        `).join('');

            return `
        <tr>
          <td>${escaparHtml(usuario.nombre)}</td>
          <td>${escaparHtml(usuario.cedula)}</td>
                        <td>${cuotas.length.toLocaleString('es-CO')}</td>
                        <td>${cupos.toLocaleString('es-CO', { maximumFractionDigits: 2 })}</td>
          <td>${formatCurrency(total)}</td>
          <td>${porcentaje.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%</td>
                        <td>${formatCurrency(utilidadIntereses)}</td>
                        <td>${formatCurrency(utilidadMultas)}</td>
                        <td>${formatCurrency(utilidadIntereses + utilidadMultas)}</td>
        </tr>
        <tr class="closing-details-row">
                    <td colspan="7">
            <details class="closing-details">
                            <summary>Ver detalle de ${cuotas.length.toLocaleString('es-CO')} cuotas; ${cupos.toLocaleString('es-CO', { maximumFractionDigits: 2 })} cupos</summary>
              <table class="closing-payment-table">
                                <thead><tr><th>Periodo</th><th>Valor pagado</th><th>Cupos equivalentes</th><th>Fecha de pago</th></tr></thead>
                <tbody>${detalle}</tbody>
              </table>
            </details>
          </td>
        </tr>
      `;
        }).join('');
    };

    const cargarCierre = async () => {
        const tbody = document.getElementById('cierreTable');
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Cargando aportes...</td></tr>';
        document.getElementById('cierreInteresesTable').innerHTML = '<tr><td colspan="3" class="text-center text-muted">Cargando intereses...</td></tr>';
        document.getElementById('cierreMultasTable').innerHTML = '<tr><td colspan="3" class="text-center text-muted">Cargando multas...</td></tr>';

        try {
            const response = await authFetch(`${API_BASE_URL}/cuotas/cierre-presupuestal`);
            if (!response.ok) throw new Error('No fue posible cargar los aportes');
            const data = await response.json();
            cuotasCierre = data.cuotas || [];
            interesesCierre = data.intereses || [];
            multasCierre = data.multas || [];
            valorCupo = Number(data.valor_cupo) || 200000;

            const selector = document.getElementById('cierreYearFilter');
            const yearSelected = selector.value;
            const years = [...new Set([
                ...cuotasCierre.map(cuota => String(cuota.anio)),
                ...interesesCierre.map(interes => periodoColombia(interes.fecha_movimiento)?.year).filter(Boolean).map(String),
                ...multasCierre.map(multa => periodoColombia(multa.fecha_pago)?.year).filter(Boolean).map(String)
            ])].sort((a, b) => Number(b) - Number(a));
            selector.innerHTML = '<option value="">Todos los años</option>' + years
                .map(year => `<option value="${year}">${year}</option>`).join('');
            if (years.includes(yearSelected)) selector.value = yearSelected;
            renderizarCierre();
        } catch (error) {
            console.error('Error al cargar cierre presupuestal:', error);
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No fue posible cargar los aportes. Verifique su sesión e inténtelo de nuevo.</td></tr>';
            document.getElementById('cierreInteresesTable').innerHTML = '<tr><td colspan="3" class="text-center text-muted">No fue posible cargar los intereses</td></tr>';
            document.getElementById('cierreMultasTable').innerHTML = '<tr><td colspan="3" class="text-center text-muted">No fue posible cargar las multas</td></tr>';
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelector('[data-section="cierre"]')?.addEventListener('click', () => {
            document.getElementById('sectionTitle').textContent = 'Cierre presupuestal';
            cargarCierre();
        });
        document.getElementById('cierreYearFilter')?.addEventListener('change', renderizarCierre);
        document.getElementById('cierreSearch')?.addEventListener('input', renderizarCierre);
    });
})();
