import app from '../backend/src/server.js';

export default function handler(req, res) {
    try {
        const origin = req.headers.origin || '*';

        // ✅ HEADERS CORS
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET,POST,PUT,PATCH,DELETE,OPTIONS'
        );
        res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization'
        );

        // ✅ RESPUESTA PREFLIGHT (EVITA CORS ERROR)
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // ✅ PASAR A EXPRESS
        return app(req, res);

    } catch (error) {
        console.error('💥 ERROR VERCEL:', error);

        return res.status(500).json({
            error: 'Vercel function crashed',
            detail: error.message
        });
    }
}