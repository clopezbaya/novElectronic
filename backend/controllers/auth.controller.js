const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const { sendWelcomeEmail } = require('../services/email.service');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Traditional registration
const register = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
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
        await sendWelcomeEmail(user.email, user.name || user.email); // Enviar email de bienvenida
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            userId: user.id,
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Traditional login
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) { // Also check if user has a password (might be a Google-only account)
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }
        
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

// Google OAuth Callback Handler
const googleCallback = (req, res) => {
    // Passport attaches the user to req.user after successful authentication
    const user = req.user;
    if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    // Redirect user to a dedicated frontend page to handle the token
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
};

// Get current user profile
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
    googleCallback,
    getMe,
};