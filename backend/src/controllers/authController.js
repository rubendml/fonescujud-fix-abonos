import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

export const login = async (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    // Buscar usuario en la base de datos
    const { data: user, error } = await supabaseAdmin
        .from('usuarios')
        .select('id, nombre, email, rol, usuario, password')
        .eq('usuario', usuario)
        .single();

    if (error || !user) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Validar contraseña (en producción usar hash)
    if (user.password !== password) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Generar token JWT
    const token = jwt.sign({ id: user.id, rol: user.rol, nombre: user.nombre, usuario: user.usuario }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, rol: user.rol });
};
