import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/formatPrice';

interface Order {
    id: number;
    total: number;
    status: string;
    createdAt: string;
    proofOfPaymentUrl?: string;
    shippingAddress: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        zipCode: string;
        phone: string;
        email: string;
        observations: string;
    };
    user: {
        name: string;
        email: string;
    };
    orderItems: {
        product: {
            name: string;
            imageUrl: string;
        };
        quantity: number;
        price: number;
    }[];
}

const AdminOrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAppSelector((state) => state.auth);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!token || !id) return;
            setLoading(true);
            try {
                const response = await customFetch.get(`/admin/orders/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setOrder(response.data);
            } catch (error) {
                toast.error('Error al cargar el pedido.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [token, id]);

    if (loading) {
        return <div className="text-center py-20 text-xl">Cargando detalles del pedido...</div>;
    }

    if (!order) {
        return <div className="text-center py-20 text-xl text-red-500">No se encontró el pedido.</div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Detalles del Pedido #{order.id}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Artículos del Pedido</h2>
                    <ul className="divide-y divide-gray-200">
                        {order.orderItems.map((item, index) => (
                            <li key={index} className="py-4 flex">
                                <img src={item.product.imageUrl} alt={item.product.name} className="h-20 w-20 rounded object-cover"/>
                                <div className="ml-4 flex-grow">
                                    <p className="font-semibold">{item.product.name}</p>
                                    <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                                    <p className="text-sm text-gray-600">Precio: {formatPrice(item.price, 'Bs')}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <h2 className="text-xl font-bold mt-8 mb-4">Resumen del Pedido</h2>
                    <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> {formatPrice(order.total, 'Bs')}</p>
                    <p><strong>Estado:</strong> 
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {order.status}
                        </span>
                    </p>
                    {order.proofOfPaymentUrl && (
                        <div className="mt-4">
                            <h3 className="font-semibold">Comprobante de pago</h3>
                            <a href={`http://localhost:3000${order.proofOfPaymentUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Ver comprobante
                            </a>
                        </div>
                    )}
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Información del Cliente</h2>
                    <p><strong>Nombre:</strong> {order.user.name}</p>
                    <p><strong>Email:</strong> {order.user.email}</p>

                    <h2 className="text-xl font-bold mt-8 mb-4">Información de Envío</h2>
                    <p><strong>Nombre:</strong> {order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p><strong>Dirección:</strong> {order.shippingAddress.address}</p>
                    <p><strong>Departamento:</strong> {order.shippingAddress.city}</p>
                    <p><strong>Teléfono:</strong> {order.shippingAddress.phone}</p>
                    {order.shippingAddress.observations && <p><strong>Observaciones:</strong> {order.shippingAddress.observations}</p>}
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetailPage;
