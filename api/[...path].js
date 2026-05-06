import app from '../backend/src/server.js';

export default async function handler(req, res) {
    try {
        const origin = req.headers.origin || '*';

        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // 🔥 RESPUESTA LIMPIA AL PREFLIGHT (CRÍTICO)
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        return app(req, res);

    } catch (error) {
        console.error('💥 ERROR EN VERCEL HANDLER:', error);

        return res.status(500).json({
            error: 'Server crashed in Vercel',
            detail: error.message
        });
    }
}