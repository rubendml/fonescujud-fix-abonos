import app from '../backend/src/server.js';

export default function handler(req, res) {
    // 🔥 Manejo explícito de CORS (clave para login)
    const origin = req.headers.origin || '*';

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 🔥 RESPONDER preflight (ESTO ES LO QUE TE FALTA)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return app(req, res);
}