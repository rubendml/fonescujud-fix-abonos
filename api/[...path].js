💥 REEMPLÁZALO COMPLETO por esto:
import app from '../backend/src/server.js';

export default function handler(req, res) {
    const origin = req.headers.origin || '*';

    // 🔥 Headers SIEMPRE
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 🔥 RESPUESTA INMEDIATA AL PREFLIGHT
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    return app(req, res);
}