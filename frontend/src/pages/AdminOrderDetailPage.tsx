import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/formatPrice';
import { statusTranslations } from '../utils/translations';
import ImageModal from '../components/ImageModal';

// Helper function to get the correct image URL
const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url; // Already an absolute URL (Firebase, external, etc.)
    }
    // If it's a relative path (likely an old local file), return empty string
    // Since old local files are likely gone, we choose not to display a broken image.
    return '';
};

interface Order {
    id: number;
    user: {
        name: string;
        email: string;
    };
    total: number;
    status: string;
    createdAt: string;
    orderItems: any[];
    shippingAddress: any;
    proofOfPaymentUrl?: string;
    shippingProofUrl?: string;
}

const statusOptions = Object.keys(statusTranslations);

const AdminOrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { token } = useAppSelector((state: any) => state.auth);
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [shippingProof, setShippingProof] = useState<File | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');

    const handleImageClick = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const fetchOrder = async () => {
            setIsLoading(true);
            try {
                const response = await customFetch.get(`/admin/orders/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setOrder(response.data);
                setSelectedStatus(response.data.status);
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Failed to load order details.');
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchOrder();
        }
    }, [id, token]);

    const handleStatusChange = async () => {
        if (!order) return;

        if (
            selectedStatus === 'ENVIADO' &&
            !shippingProof &&
            !order.shippingProofUrl
        ) {
            toast.error('Por favor, adjunta un comprobante de envío.');
            return;
        }

        try {
            if (selectedStatus === 'ENVIADO' && shippingProof) {
                const formData = new FormData();
                formData.append('shippingProof', shippingProof);

                await customFetch.post(
                    `/admin/orders/${order.id}/ship`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } else {
                await customFetch.put(
                    `/admin/orders/${order.id}`,
                    { status: selectedStatus },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            }
            toast.success('Estado del pedido actualizado exitosamente!');
            const response = await customFetch.get(`/admin/orders/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setOrder(response.data);
            setSelectedStatus(response.data.status);
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Error al actualizar el estado del pedido.');
        }
    };

    const isButtonDisabled = () => {
        if (!order) return true;
        if (selectedStatus === order.status) return true;
        if (order.status === 'DELIVERED') return true; // Disable if already delivered
        if (
            selectedStatus === 'ENVIADO' &&
            !shippingProof &&
            !order.shippingProofUrl
        )
            return true;
        return false;
    };

    if (isLoading) {
        return (
            <div className='text-center py-20 text-xl'>
                Loading order details...
            </div>
        );
    }

    if (error) {
        return (
            <div className='text-center py-20 text-xl text-red-500'>
                {error}
            </div>
        );
    }

    if (!order) {
        return (
            <div className='text-center py-20 text-xl'>Order not found.</div>
        );
    }

    return (
        <div className='container mx-auto px-4 py-8'>
            <h1 className='text-3xl font-bold mb-8'>
                Order Details #{order.id}
            </h1>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                <div className='lg:col-span-2'>
                    <div className='bg-white p-6 rounded-lg shadow-md mb-8'>
                        <h2 className='text-2xl font-bold mb-4'>Artículos</h2>
                        <ul>
                            {order.orderItems.map((item) => (
                                <li
                                    key={item.id}
                                    className='flex justify-between items-center py-2 border-b'
                                >
                                    <div className='flex items-center'>
                                        <img
                                            src={item.productImage}
                                            alt={item.product.name}
                                            className='h-16 w-16 rounded object-cover mr-4'
                                        />
                                        <div>
                                            <p className='font-semibold'>
                                                {item.product.name}
                                            </p>
                                            <p className='text-sm text-gray-600'>
                                                Cantidad: {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <p className='font-semibold'>
                                        {formatPrice(
                                            item.price * item.quantity,
                                            'Bs'
                                        )}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
                        {order.proofOfPaymentUrl && (
                            <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
                                <h2 className='text-xl font-bold mb-4 text-gray-700'>
                                    Comprobante de Pago
                                </h2>
                                <img
                                    src={getImageUrl(order.proofOfPaymentUrl)}
                                    alt='Proof of Payment'
                                    className='w-full h-auto rounded-lg cursor-pointer'
                                    onClick={() =>
                                        handleImageClick(
                                            getImageUrl(order.proofOfPaymentUrl)
                                        )
                                    }
                                />
                            </div>
                        )}

                        {order.shippingProofUrl ? (
                            <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
                                <h2 className='text-xl font-bold mb-4 text-gray-700'>
                                    Comprobante de Envío
                                </h2>
                                <img
                                    src={getImageUrl(order.shippingProofUrl)}
                                    alt='Shipping Proof'
                                    className='w-full h-auto rounded-lg cursor-pointer'
                                    onClick={() =>
                                        handleImageClick(
                                            getImageUrl(order.shippingProofUrl)
                                        )
                                    }
                                />
                            </div>
                        ) : (
                            selectedStatus === 'ENVIADO' && (
                                <div className='bg-white p-6 rounded-lg shadow-md'>
                                    <label
                                        htmlFor='shippingProof'
                                        className='block text-lg font-medium text-gray-800 mb-2'
                                    >
                                        Adjuntar Comprobante de Envío
                                    </label>
                                    <input
                                        type='file'
                                        id='shippingProof'
                                        onChange={(e) => {
                                            const file = e.target.files
                                                ? e.target.files[0]
                                                : null;
                                            setShippingProof(file);
                                        }}
                                        disabled={order.status === 'DELIVERED'} // Disable if order is delivered
                                        className='mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100'
                                    />
                                    {shippingProof && (
                                        <div className='mt-4'>
                                            <h3 className='text-md font-medium text-gray-800 mb-2'>
                                                Previsualización:
                                            </h3>
                                            <img
                                                src={URL.createObjectURL(
                                                    shippingProof
                                                )}
                                                alt='Shipping Proof Preview'
                                                className='w-full h-auto rounded-lg max-h-48 object-contain'
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </div>
                <div className='lg:col-span-1'>
                    <div className='bg-white p-6 rounded-lg shadow-md'>
                        <h2 className='text-2xl font-bold mb-4'>
                            Resumen del Pedido
                        </h2>
                        <p>
                            <strong>Cliente:</strong> {order.user.name}
                        </p>
                        <p>
                            <strong>Email:</strong> {order.user.email}
                        </p>
                        <p>
                            <strong>Total:</strong>{' '}
                            {formatPrice(order.total, 'Bs')}
                        </p>
                        <p>
                            <strong>Fecha:</strong>{' '}
                            {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        {order.shippingAddress && (
                            <div className='mt-4 pt-4 border-t'>
                                <h3 className='text-lg font-bold mb-2'>
                                    Información de Envío
                                </h3>
                                <p>
                                    <strong>Nombre Completo:</strong>{' '}
                                    {order.shippingAddress.firstName}{' '}
                                    {order.shippingAddress.lastName}
                                </p>
                                <p>
                                    <strong>Dirección:</strong>{' '}
                                    {order.shippingAddress.address}
                                </p>
                                <p>
                                    <strong>Ciudad:</strong>{' '}
                                    {order.shippingAddress.city}
                                </p>
                                {order.shippingAddress.phone && (
                                    <p>
                                        <strong>Teléfono:</strong>{' '}
                                        {order.shippingAddress.phone}
                                    </p>
                                )}
                                {order.shippingAddress.observations && (
                                    <p>
                                        <strong>Observaciones:</strong>{' '}
                                        {order.shippingAddress.observations}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className='mt-6'>
                            <label
                                htmlFor='status'
                                className='block text-sm font-medium text-gray-700'
                            >
                                Estado del Pedido
                            </label>
                            <select
                                id='status'
                                value={selectedStatus}
                                onChange={(e) =>
                                    setSelectedStatus(e.target.value)
                                }
                                disabled={order.status === 'DELIVERED'}
                                className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
                            >
                                {statusOptions.map((status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {statusTranslations[status]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleStatusChange}
                            disabled={isButtonDisabled()}
                            className='w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 mt-6 disabled:bg-gray-400 disabled:cursor-not-allowed'
                        >
                            Actualizar Estado
                        </button>
                    </div>
                </div>
            </div>
            <ImageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imageUrl={selectedImageUrl}
            />
        </div>
    );
};

export default AdminOrderDetailPage;
