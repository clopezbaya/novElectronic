import React, { useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/formatPrice';
import { Link, useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import PaymentInfoModal from '../components/PaymentInfoModal';
import { logout } from '../features/auth/authSlice';

interface Order {
    id: number;
    total: number;
    status: string;
    createdAt: string;
    proofOfPaymentUrl?: string;
    orderItems: {
        quantity: number;
        price: number;
        productId: string;
        productName: string;
        productImage: string;
    }[];
}

const MyOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const { token } = useAppSelector((state: any) => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await customFetch.get('/orders', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setOrders(response.data);
        } catch (error: any) {
            toast.error('Error al cargar los pedidos.');
            if (error.response?.status === 401 || error.response?.status === 403) {
                dispatch(logout());
                toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [token, dispatch, navigate]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    if (loading) {
        return <div className="text-center py-20 text-xl">Cargando pedidos...</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-20">
                <h1 className="text-4xl font-bold mb-4">No tienes pedidos</h1>
                <p className="text-lg text-gray-600">Aún no has realizado ningún pedido.</p>
                <Link to="/" className="mt-6 inline-block bg-gray-900 text-white px-6 py-3 rounded-lg">
                    Empezar a comprar
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>
            <div className="space-y-8">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold">Pedido #{order.id}</h2>
                                <p className="text-sm text-gray-500">
                                    Realizado el: {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Total: {formatPrice(order.total, 'Bs')}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                order.status === 'PENDING_PAYMENT' ? 'bg-yellow-200 text-yellow-800' :
                                order.status === 'PENDING_VERIFICATION' ? 'bg-blue-200 text-blue-800' :
                                order.status === 'PAID' ? 'bg-green-200 text-green-800' :
                                'bg-gray-200 text-gray-800'
                            }`}>
                                {order.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="font-semibold">Artículos del pedido:</h3>
                            <ul className="divide-y divide-gray-200">
                                {order.orderItems.map((item, index) => (
                                    <li key={`${order.id}-${item.productId}-${index}`} className="py-4 flex">
                                        <img src={item.productImage} alt={item.productName} className="h-16 w-16 rounded object-cover"/>
                                        <div className="ml-4">
                                            <p className="font-semibold">{item.productName}</p>
                                            <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                                            <p className="text-sm text-gray-600">Precio: {formatPrice(item.price, 'Bs')}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {order.status === 'PENDING_PAYMENT' && (
                            <button onClick={() => setSelectedOrder(order)} className="mt-4 text-sm text-blue-600 hover:underline">
                                Mostrar Información de Pago
                            </button>
                        )}
                        {(order.status === 'PENDING_PAYMENT' || order.status === 'PENDING_VERIFICATION') && (
                            <FileUpload orderId={order.id} onUploadSuccess={fetchOrders} existingProofUrl={order.proofOfPaymentUrl} />
                        )}
                        {order.proofOfPaymentUrl && order.status !== 'PENDING_PAYMENT' && order.status !== 'PENDING_VERIFICATION' && (
                            <div className="mt-4">
                                <h3 className="font-semibold">Comprobante de pago</h3>
                                <a href={`http://localhost:3000${order.proofOfPaymentUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    Ver comprobante
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <PaymentInfoModal isOpen={selectedOrder !== null} onClose={() => setSelectedOrder(null)} />
        </div>
    );
};

export default MyOrdersPage;
