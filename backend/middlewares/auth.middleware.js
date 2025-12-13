const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.sendStatus(403); // Forbidden
        }
        req.user = user;
        next();
    });
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (user && user.role === 'ADMIN') {
            next();
        } else {
            res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' }); // Forbidden
        }
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

module.exports = {
    authenticateToken,
    isAdmin,
};
