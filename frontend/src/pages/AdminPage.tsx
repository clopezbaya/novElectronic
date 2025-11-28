import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAppSelector, useDebounce } from '../app/hooks';
import { useNavigate, Link } from 'react-router-dom';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/formatPrice';

interface Order {
    id: number;
    total: number;
    status: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
    orderItems: {
        product: {
            name: string;
        };
        quantity: number;
    }[];
}

const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const debouncedSearch = useDebounce(searchTerm, 500);

    const fetchAllOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }
            const response = await customFetch.get(`/admin/orders?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data.orders);
            setTotalPages(response.data.totalPages);
        } catch (err: any) {
            console.error('Error fetching all orders:', err);
            setError(err.response?.data?.message || 'Error al cargar los pedidos.');
            if (err.response?.status === 403) {
                 toast.error('No tienes permisos de administrador.');
                 navigate('/');
            }
        } finally {
            setIsLoading(false);
            searchInputRef.current?.focus();
        }
    }, [isAuthenticated, token, navigate, page, debouncedSearch]);

    useEffect(() => {
        fetchAllOrders();
    }, [fetchAllOrders]);

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            await customFetch.put(`/admin/orders/${orderId}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
            toast.success(`Estado del pedido #${orderId} actualizado.`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al actualizar el estado.');
        }
    };

    if (isLoading) {
        return <div className="text-center py-20 text-xl">Cargando Pedidos de Clientes...</div>;
    }

    if (error) {
        return <div className="text-center py-20 text-xl text-red-500">{error}</div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Panel de Administrador - Pedidos</h1>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar por cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md w-1/3"
                />
                <Link to="/admin/products" className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                    Gestionar Productos
                </Link>
            </div>
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Pedido ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cliente</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Fecha</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Estado</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Comprobante</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <Link to={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                                        #{order.id}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.user.name} ({order.user.email})</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{formatPrice(order.total, 'Bs')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            order.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'PENDING_VERIFICATION' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.proofOfPaymentUrl ? (
                                        <a href={`http://localhost:3000${order.proofOfPaymentUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            Ver
                                        </a>
                                    ) : (
                                        'N/A'
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    >
                                        <option>PENDING_PAYMENT</option>
                                        <option>PENDING_VERIFICATION</option>
                                        <option>PAID</option>
                                        <option>SHIPPED</option>
                                        <option>DELIVERED</option>
                                        <option>CANCELED</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50">
                    Anterior
                </button>
                <span>Página {page} de {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50">
                    Siguiente
                </button>
            </div>
        </div>
    );
};

export default AdminPage;