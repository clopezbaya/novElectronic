const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const register = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        // Check if a user with this email already exists via Google
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.googleId) {
            return res.status(409).json({ message: 'Este correo electrónico ya está registrado con Google. Inicia sesión con Google.' });
        }
        if (existingUser) {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            userId: user.id,
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        if (error.code === 'P2002') {
            return res
                .status(409)
                .json({ message: 'El correo electrónico ya está registrado.' });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        // If user registered via Google, prompt them to use Google login
        if (user.googleId && !user.password) {
          return res.status(400).json({ message: 'Has iniciado sesión con Google anteriormente. Por favor, usa el botón de Google para iniciar sesión.' });
        }
        
        // If user has a password (either traditional or linked Google account)
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ message: 'Login exitoso', token });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error al obtener perfil de usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

module.exports = {
    register,
    login,
    getMe,
};
