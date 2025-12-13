const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const updateUserProfile = async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    if (req.user.userId !== parseInt(id)) {
        return res.sendStatus(403); // Forbidden
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { name, email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
        res.json(updatedUser);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
        }
        res.status(500).json({ message: 'Error al actualizar el perfil.' });
    }
};

const changePassword = async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (req.user.userId !== parseInt(id)) {
        return res.sendStatus(403); // Forbidden
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });
        if (!user || !user.password) {
            return res.status(404).json({ message: 'Usuario no encontrado o no tiene contraseña.' });
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { password: hashedNewPassword },
        });

        res.json({ message: 'Contraseña actualizada exitosamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar la contraseña.' });
    }
};

module.exports = {
    updateUserProfile,
    changePassword,
};
