import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';
const PUBLIC_GET_PATHS = new Set(['/api/dashboard']);

export const isMaintenanceEnabled = () => process.env.MAINTENANCE_MODE === 'true';

export const canAccessDuringMaintenance = user => {
    if (user?.rol !== 'admin' || !user.usuario) return false;

    const allowedUsers = (process.env.MAINTENANCE_ALLOWED_ADMINS || '')
        .split(',')
        .map(username => username.trim().toLocaleLowerCase('es-CO'))
        .filter(Boolean);

    return allowedUsers.includes(String(user.usuario).trim().toLocaleLowerCase('es-CO'));
};

export function maintenanceGate(req, res, next) {
    if (!isMaintenanceEnabled() || req.method === 'OPTIONS') return next();
    if (req.path === '/api/health') return next();
    if (req.method === 'GET' && PUBLIC_GET_PATHS.has(req.path)) return next();

    if (req.path === '/api/auth/login') return next();

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(503).json({ error: 'Acceso suspendido temporalmente por mantenimiento' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    try {
        const user = token ? jwt.verify(token, JWT_SECRET) : null;
        if (canAccessDuringMaintenance(user)) {
            req.user = user;
            return next();
        }
    } catch {
        // Treat missing and invalid sessions identically during maintenance.
    }

    return res.status(503).json({ error: 'Acceso suspendido temporalmente por mantenimiento' });
}