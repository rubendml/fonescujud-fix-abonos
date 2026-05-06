// Calcular interés simple
export const calcularInteres = (capital, porcentaje, meses) => {
  return (capital * porcentaje * meses) / 100;
};

// Calcular interes mensual
export const calcularInteresMensual = (capital, porcentaje) => {
  return (capital * porcentaje) / 100;
};

// Validar cédula colombiana (Opcional)
export const validarCedula = (cedula) => {
  const cedulaStr = cedula.toString();
  if (cedulaStr.length < 8 || cedulaStr.length > 10) {
    return false;
  }
  return /^\d+$/.test(cedulaStr);
};

// Validar email
export const validarEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Formatear moneda colombiana
export const formatearPesos = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
};

// Obtener nombre del mes en español
export const getNombreMes = (mes) => {
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Extraordinaria',
  ];
  return meses[mes - 1] || 'Mes inválido';
};
