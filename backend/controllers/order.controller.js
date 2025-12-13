const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const admin = require("firebase-admin");

const bucket = admin.storage().bucket();

const createOrder = async (req, res) => {
    const { orderItems, total, subtotal, shippingCost, shippingAddress } = req.body;
    try {
        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'El pedido debe contener al menos un artículo.' });
        }

        const newOrder = await prisma.order.create({
            data: {
                userId: req.user.userId,
                subtotal: parseFloat(subtotal),
                shippingCost: parseFloat(shippingCost),
                total: parseFloat(total),
                status: 'PENDING_PAYMENT',
                shippingAddress: shippingAddress,
                orderItems: {
                    create: orderItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: parseFloat(item.price),
                    })),
                },
            },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: { name: true, images: true },
                        },
                    },
                },
            },
        });

        const formattedOrder = {
            id: newOrder.id,
            total: newOrder.total,
            subtotal: newOrder.subtotal,
            shippingCost: newOrder.shippingCost,
            status: newOrder.status,
            createdAt: newOrder.createdAt,
            orderItems: newOrder.orderItems.map((item) => ({
                quantity: item.quantity,
                price: item.price,
                productId: item.productId,
                productName: item.product.name,
                productImage: item.product.images[0]?.url || 'https://via.placeholder.com/150',
            })),
        };
        res.status(201).json({
            message: 'Pedido creado exitosamente',
            order: formattedOrder,
        });
    } catch (error) {
        console.error('Error al crear pedido:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el pedido.' });
    }
};

const uploadProof = async (req, res) => {
    const { id } = req.params;
    const orderId = parseInt(id);

    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        if (order.userId !== req.user.userId) {
            return res.status(403).json({ message: 'No tienes permiso para actualizar este pedido.' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo.' });
        }

        const file = req.file;
        const fileName = `proofs/${orderId}-${Date.now()}-${file.originalname}`;
        const fileUpload = bucket.file(fileName);
        const blobStream = fileUpload.createWriteStream({
            metadata: { contentType: file.mimetype },
        });

        blobStream.on('error', (err) => {
            console.error('Error uploading proof to Firebase Storage:', err);
            res.status(500).json({ message: 'Error al subir el comprobante de pago a Firebase Storage.' });
        });

        blobStream.on('finish', async () => {
            await fileUpload.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    proofOfPaymentUrl: publicUrl,
                    status: 'PENDING_VERIFICATION'
                },
            });
            res.json({
                message: 'Comprobante de pago subido exitosamente.',
                order: updatedOrder,
                url: publicUrl
            });
        });

        blobStream.end(file.buffer);
    } catch (error) {
        console.error('Error al subir el comprobante de pago:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user.userId },
            include: {
                orderItems: {
                    include: {
                        product: { select: { name: true, images: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const formattedOrders = orders.map((order) => ({
            id: order.id,
            subtotal: order.subtotal,
            shippingCost: order.shippingCost,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
            proofOfPaymentUrl: order.proofOfPaymentUrl,
            shippingProofUrl: order.shippingProofUrl,
            orderItems: order.orderItems.map((item) => ({
                quantity: item.quantity,
                price: item.price,
                productId: item.productId,
                productName: item.product.name,
                productImage: item.product.images[0]?.url || 'https://via.placeholder.com/150',
            })),
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error('Error al obtener pedidos del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los pedidos.' });
    }
};

module.exports = {
    createOrder,
    uploadProof,
    getMyOrders,
};
