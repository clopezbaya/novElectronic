import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';
import { FaCheckCircle } from 'react-icons/fa';
import FileUpload from '../components/FileUpload';
import Breadcrumbs from '../components/Breadcrumbs';
import ImageModal from '../components/ImageModal';
import PaymentInstructions from '../components/PaymentInstructions'; // Import the new component

const OrderConfirmationPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order;
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');

    const handleImageClick = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setIsImageModalOpen(true);
    };

    const handleUploadSuccess = () => {
        setUploadSuccess(true);
        // Using a toast here from a library like react-hot-toast would be better
        // For now, just using state
        setTimeout(() => {
            navigate('/my-orders');
        }, 2000);
    };

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen-75 p-4">
                <h1 className="text-4xl font-bold text-gray-800 mb-6">No se encontraron detalles del pedido</h1>
                <p className="text-lg text-gray-600 mb-8">
                    Si acabas de realizar un pedido, puede que tarde un momento en aparecer.
                </p>
                <Link
                    to="/"
                    className="bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300"
                >
                    Volver a la Tienda
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    <div className="p-8">
                        <Breadcrumbs disableLinks={true} />
                        <div className="flex items-center mt-8">
                            <FaCheckCircle className="text-green-500 text-5xl mr-4" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">¡Gracias por tu pedido!</h1>
                                <p className="text-gray-600">Tu pedido #{order.orderNumber} ha sido recibido.</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-lg font-semibold">Resumen del Pedido</h2>
                            <ul className="mt-4 divide-y divide-gray-200">
                                {order.orderItems.map((item: any) => (
                                    <li key={item.productId} className="py-4 flex items-center">
                                        <img src={item.productImage} alt={item.productName} className="w-16 h-16 rounded-md object-cover"/>
                                        <div className="ml-4">
                                            <p className="font-semibold">{item.productName}</p>
                                            <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                                        </div>
                                        <p className="ml-auto font-semibold">{formatPrice(item.price * item.quantity, 'Bs')}</p>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">Subtotal</dt>
                                        <dd className="font-medium text-gray-900">{formatPrice(order.subtotal, 'Bs')}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">Envío</dt>
                                        <dd className="font-medium text-gray-900">{formatPrice(order.shippingCost, 'Bs')}</dd>
                                    </div>
                                    <div className="flex justify-between text-base font-bold">
                                        <dt>Total</dt>
                                        <dd>{formatPrice(order.total, 'Bs')}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-lg font-semibold">Información de Pago</h2>
                            <p className="text-gray-600 mt-2">
                                Tu pedido será confirmado una vez que recibamos el depósito.
                            </p>
                            {/* Use the new reusable component */}
                            <PaymentInstructions handleImageClick={handleImageClick} />
                        </div>

                        <div className="mt-8">
                            <h2 className="text-lg font-semibold">Adjuntar Comprobante</h2>
                            {uploadSuccess ? (
                                <div className="mt-4 text-center p-4 bg-green-100 text-green-800 rounded-lg">
                                    <p>¡Comprobante subido exitosamente!</p>
                                    <p className="text-sm">Serás redirigido a "Mis Pedidos" en un momento.</p>
                                </div>
                            ) : (
                                <>
                                <p className="text-gray-600 mt-2">
                                    Puedes adjuntar tu comprobante de pago a continuación o más tarde desde la sección "Mis Pedidos".
                                </p>
                                <FileUpload orderId={order.id} onUploadSuccess={handleUploadSuccess} existingProofUrl={order.proofOfPaymentUrl} />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
             <ImageModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                imageUrl={selectedImageUrl}
            />
        </div>
    );
};
export default OrderConfirmationPage;