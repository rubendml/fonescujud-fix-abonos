import app from '../backend/src/server.js';

export default function handler(req, res) {
    const origin = req.headers.origin || '*';

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 🔥 ESTE ES EL FIX REAL
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return app(req, res);
}