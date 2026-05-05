// API Configuration - Detecta automáticamente el entorno
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://fonescujud-fix-abonos.vercel.app/api'; // URL de Vercel

// Exportar para usar en otros archivos
window.API_BASE_URL = API_BASE_URL;
