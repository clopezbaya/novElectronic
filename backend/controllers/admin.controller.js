const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const admin = require("firebase-admin");
const {
    sendOrderStatusUpdateEmail,
    sendPaymentVerifiedEmail, // New import
    sendOrderShippedEmail, // New import
} = require('../services/email.service');

const bucket = admin.storage().bucket();

// --- Admin Order Management ---

const getAllOrders = async (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    try {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        let whereClause = {};
        if (search) {
            whereClause = {
                OR: [
                    { user: { name: { contains: search.toString(), mode: 'insensitive' } } },
                    { user: { email: { contains: search.toString(), mode: 'insensitive' } } },
                ],
            };
        }

        const totalOrders = await prisma.order.count({ where: whereClause });
        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true, email: true } },
            },
            skip: skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            orders,
            totalOrders,
            page: pageNum,
            totalPages: Math.ceil(totalOrders / limitNum),
        });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { name: true, email: true } },
                orderItems: {
                    include: {
                        product: { select: { name: true, images: true } },
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        
        const formattedOrder = {
            ...order,
            orderItems: order.orderItems.map(item => ({
                ...item,
                productImage: item.product.images[0]?.url || 'https://via.placeholder.com/150',
            }))
        };
        res.json(formattedOrder);
    } catch (error) {
        console.error(`Error fetching order #${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: { status },
            include: { user: { select: { email: true, name: true } } }
        });

        if (updatedOrder.user) {
            const orderForEmail = {
                id: updatedOrder.id,
                orderNumber: updatedOrder.orderNumber,
                userEmail: updatedOrder.user.email,
                userName: updatedOrder.user.name,
                status: updatedOrder.status,
            };

            switch (status) {
                case 'PAID':
                    await sendPaymentVerifiedEmail(orderForEmail);
                    break;
                case 'ENVIADO':
                    // This email is handled by shipOrder, not here directly from updateOrderStatus
                    break;
                default:
                    await sendOrderStatusUpdateEmail(orderForEmail);
                    break;
            }
        } else {
            console.error(`Usuario no encontrado para la orden ${updatedOrder.id}, no se pudo enviar el email de actualización.`);
        }

        res.json({
            message: 'Estado del pedido actualizado.',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const shipOrder = async (req, res) => {
    const { id } = req.params;
    const orderId = parseInt(id);

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo.' });
        }

        const file = req.file;
        const fileName = `shipping-proofs/${orderId}-${Date.now()}-${file.originalname}`;
        const fileUpload = bucket.file(fileName);
        const blobStream = fileUpload.createWriteStream({
            metadata: { contentType: file.mimetype },
        });

        blobStream.on('error', (err) => {
            console.error('Error uploading shipping proof:', err);
            res.status(500).json({ message: 'Error al subir el comprobante de envío.' });
        });

        blobStream.on('finish', async () => {
            await fileUpload.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;

            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    shippingProofUrl: publicUrl,
                    status: 'ENVIADO',
                },
                include: { user: { select: { email: true, name: true } } }
            });

            if (updatedOrder.user) {
                const orderForEmail = {
                    id: updatedOrder.id,
                    orderNumber: updatedOrder.orderNumber,
                    userEmail: updatedOrder.user.email,
                    userName: updatedOrder.user.name,
                    status: updatedOrder.status,
                    shippingProofUrl: updatedOrder.shippingProofUrl,
                };
                await sendOrderShippedEmail(orderForEmail);
            } else {
                console.error(`Usuario no encontrado para la orden ${updatedOrder.id}, no se pudo enviar el email de envío.`);
            }

            res.json({
                message: 'Comprobante de envío subido y estado actualizado.',
                order: updatedOrder,
                url: publicUrl
            });
        });

        blobStream.end(file.buffer);
    } catch (error) {
        console.error('Error al subir el comprobante de envío:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// --- Admin Product Management ---

const getAllProductsAdmin = async (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    try {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        let whereClause = {};
        if (search) {
            whereClause = { name: { contains: search.toString(), mode: 'insensitive' } };
        }

        const totalProducts = await prisma.product.count({ where: whereClause });
        const products = await prisma.product.findMany({
            where: whereClause,
            include: { brand: true, categories: true, images: true },
            skip: skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            products,
            totalProducts,
            page: pageNum,
            totalPages: Math.ceil(totalProducts / limitNum),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products for admin' });
    }
};

const getProductByIdAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { brand: true, categories: true, images: true },
        });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.json(product);
    } catch (error) {
        console.error(`Error fetching product #${id} for admin:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const createProductAdmin = async (req, res) => {
    const { name, description, originalPrice, resalePrice, imageUrls, sourceUrl, stock, brandId, categoryIds } = req.body;
    try {
        const newProduct = await prisma.product.create({
            data: {
                id: `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                name,
                description,
                originalPrice,
                resalePrice,
                sourceUrl,
                stock,
                brand: { connect: { id: brandId } },
                categories: { connect: categoryIds.map((id) => ({ id })) },
                images: { create: imageUrls.map(url => ({ url })) }
            },
        });
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
};

const updateProductAdmin = async (req, res) => {
    const { id } = req.params;
    const { name, description, originalPrice, resalePrice, imageUrls, sourceUrl, stock, brandId, categoryIds } = req.body;
    try {
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                originalPrice,
                resalePrice,
                sourceUrl,
                stock,
                brand: { connect: { id: brandId } },
                categories: { set: categoryIds.map((id) => ({ id })) },
                images: {
                    deleteMany: {},
                    create: imageUrls.map(url => ({ url }))
                }
            },
        });
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
};

const deleteProductAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.product.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product' });
    }
};


module.exports = {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    shipOrder,
    getAllProductsAdmin,
    getProductByIdAdmin,
    createProductAdmin,
    updateProductAdmin,
    deleteProductAdmin,
};