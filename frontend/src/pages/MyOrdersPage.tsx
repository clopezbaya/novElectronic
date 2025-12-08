import React, { useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/formatPrice';
import { Link, useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import PaymentInfoModal from '../components/PaymentInfoModal';
import ImageModal from '../components/ImageModal';
import { logout } from '../features/auth/authSlice';
import { getTranslatedStatus } from '../utils/translations';

interface Order {
    id: number;
    total: number;
    status: string;
    createdAt: string;
    proofOfPaymentUrl?: string;
    shippingProofUrl?: string;
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');

    const handleImageClick = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setIsModalOpen(true);
    };

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

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'PENDING_PAYMENT':
                return 'bg-yellow-200 text-yellow-800';
            case 'PENDING_VERIFICATION':
                return 'bg-blue-200 text-blue-800';
            case 'PAID':
                return 'bg-green-200 text-green-800';
            case 'ENVIADO':
                return 'bg-purple-200 text-purple-800';
            case 'DELIVERED':
                return 'bg-gray-400 text-white';
            case 'CANCELED':
                return 'bg-red-200 text-red-800';
            case 'PAYMENT_REJECTED':
                return 'bg-red-300 text-red-900';
            default:
                return 'bg-gray-200 text-gray-800';
        }
    };

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
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(order.status)}`}>
                                {getTranslatedStatus(order.status)}
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
                        
                        {(order.status === 'PENDING_PAYMENT' || order.status === 'PAYMENT_REJECTED') && (
                            <>
                                <button onClick={() => setSelectedOrder(order)} className="mt-4 text-sm text-blue-600 hover:underline">
                                    Mostrar Información de Pago
                                </button>
                                {order.status === 'PAYMENT_REJECTED' && (
                                    <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                        <p className="font-bold">Tu pago fue rechazado.</p>
                                        <p>Por favor, verifica tu comprobante y vuelve a subirlo.</p>
                                    </div>
                                )}
                                <FileUpload orderId={order.id} onUploadSuccess={fetchOrders} existingProofUrl={order.proofOfPaymentUrl} />
                            </>
                        )}
                        
                        {(order.status === 'PENDING_VERIFICATION' || order.status === 'PAID' || order.status === 'ENVIADO' || order.status === 'DELIVERED') && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {order.proofOfPaymentUrl && (
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                                        <h3 className="font-semibold text-lg mb-2 text-gray-700">Comprobante de Pago</h3>
                                        <img 
                                            src={`http://localhost:3000${order.proofOfPaymentUrl}`} 
                                            alt="Proof of Payment" 
                                            className="w-full h-auto rounded-lg max-h-64 object-contain cursor-pointer"
                                            onClick={() => handleImageClick(`http://localhost:3000${order.proofOfPaymentUrl}`)}
                                        />
                                    </div>
                                )}
                                {order.shippingProofUrl && (
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                                        <h3 className="font-semibold text-lg mb-2 text-gray-700">Comprobante de Envío</h3>
                                        <img 
                                            src={`http://localhost:3000${order.shippingProofUrl}`} 
                                            alt="Shipping Proof" 
                                            className="w-full h-auto rounded-lg max-h-64 object-contain cursor-pointer"
                                            onClick={() => handleImageClick(`http://localhost:3000${order.shippingProofUrl}`)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <PaymentInfoModal isOpen={selectedOrder !== null} onClose={() => setSelectedOrder(null)} />
            <ImageModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imageUrl={selectedImageUrl}
            />
        </div>
    );
};

export default MyOrdersPage;
