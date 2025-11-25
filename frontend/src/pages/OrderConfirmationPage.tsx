import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { formatPrice } from '../utils/formatPrice';
import { Link } from 'react-router-dom';
import { nanoid } from 'nanoid'; // Importar nanoid
import logo from '../assets/logo.png'; // Importar el logo
import techIllustration from '../assets/tech-illustration.svg'; // Importar la ilustración tecnológica

const OrderConfirmationPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { cartItems, cartTotal } = useAppSelector((state: any) => state.cart); // Assuming cart still holds info

    useEffect(() => {
        // Optionally clear cart after order is confirmed/displayed
        // dispatch(clearCart()); // Uncomment if you want to clear cart on confirmation page load
    }, [dispatch]);

    // Placeholder data for QR and transfer - in a real app, this would come from backend
    const qrCodeImage = 'https://via.placeholder.com/200?text=QR+Code';
    const bankTransferDetails = {
        bankName: 'Banco Nacional de Bolivia',
        accountNumber: '123-456789-0',
        accountHolder: 'NovElectronic S.R.L.',
        identification: '123456789', // Example RUC/CI
        emailForProof: 'ventas@novelectronic.com',
        whatsappForProof: '59170012345',
    };

    return (
        <main className="relative lg:min-h-full">
            <div className="h-80 overflow-hidden lg:absolute lg:h-full lg:w-1/3 lg:pr-4 xl:pr-12 bg-gray-100 flex items-center justify-center relative"> {/* Added relative for absolute positioning of logo */}
                <img
                    src={techIllustration}
                    alt="Tech illustration"
                    className="h-full w-auto object-contain object-center"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <img src={logo} alt="NovElectronic Logo" className="h-48 w-auto" /> {/* Logo on top */}
                </div>
            </div>

            <div>
                <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-x-8 lg:px-8 lg:py-32 xl:gap-x-24">
                    <div className="lg:col-start-2 lg:col-span-2">
                        <h1 className="text-sm font-medium text-indigo-600">Pago exitoso</h1>
                        <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Gracias por tu pedido!</p>
                        <p className="mt-2 text-base text-gray-500">
                            Apreciamos tu pedido. Este será confirmado una vez que recibamos el depósito.
                            Por favor, envía tu comprobante de pago a través de WhatsApp o correo electrónico para agilizar la confirmación.
                        </p>

                        <ul
                            role="list"
                            className="mt-6 divide-y divide-gray-200 border-t border-gray-200 text-sm font-medium text-gray-500"
                        >
                            {cartItems.map((product:any) => (
                                <li key={product.id} className="flex space-x-6 py-6">
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="h-24 w-24 flex-none rounded-md bg-gray-100 object-cover object-center"
                                    />
                                    <div className="flex-auto space-y-1">
                                        <h3 className="text-gray-900">{product.title}</h3>
                                        <p>{product.category}</p>
                                        <p>Qty: {product.quantity}</p>
                                    </div>
                                    <p className="flex-none font-medium text-gray-900">{formatPrice(product.price, product.currency)}</p>
                                </li>
                            ))}
                        </ul>

                        <dl className="space-y-6 border-t border-gray-200 pt-6 text-sm font-medium text-gray-500">
                            <div className="flex justify-between">
                                <dt>Subtotal</dt>
                                <dd className="text-gray-900">{formatPrice(cartTotal, cartItems[0]?.currency || 'Bs')}</dd>
                            </div>

                            <div className="flex justify-between">
                                <dt>Shipping</dt>
                                <dd className="text-gray-900">{formatPrice(0, cartItems[0]?.currency || 'Bs')}</dd>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-200 pt-6 text-base font-medium text-gray-900">
                                <dt>Total</dt>
                                <dd className="text-base">{formatPrice(cartTotal, cartItems[0]?.currency || 'Bs')}</dd>
                            </div>
                        </dl>
                        
                        <div className="mt-16 border-t border-gray-200 py-6 text-right">
                            <Link to="/" className="text-sm font-medium text-gray-900 hover:text-blue-700">
                                Continuar Comprando
                                <span aria-hidden="true"> &rarr;</span>
                            </Link>
                        </div>

                        <div className='mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200 mt-6'>
                            <h3 className='text-xl font-semibold mb-4 text-blue-800'>
                                1. Pago mediante Código QR
                            </h3>
                            <p className='text-sm text-blue-700 mb-4'>
                                Escanea este código QR con tu aplicación de banca móvil para completar el pago.
                            </p>
                            <img
                                src={qrCodeImage}
                                alt='Código QR para Pago'
                                className='mx-auto w-48 h-48 border border-blue-300 p-2 rounded-md mb-3 shadow-md'
                            />
                            <p className='text-xs text-gray-700 mt-4'>
                                **Importante:** Una vez realizado el pago, envía tu comprobante a{' '}
                                <a
                                    href={`mailto:${bankTransferDetails.emailForProof}`}
                                    className='text-gray-900 hover:text-blue-700'
                                >
                                    {bankTransferDetails.emailForProof}
                                </a>{' '}
                                o por WhatsApp a{' '}
                                <a
                                    href={`https://wa.me/${bankTransferDetails.whatsappForProof}`}
                                    className='text-gray-900 hover:text-blue-700'
                                >
                                    {bankTransferDetails.whatsappForProof}
                                </a>{' '}
                                para confirmar tu pedido.
                            </p>
                        </div>

                        <div className='mb-8 p-6 bg-green-50 rounded-lg border border-green-200 text-left mt-6'>
                            <h3 className='text-xl font-semibold mb-4 text-green-800'>
                                2. Transferencia Bancaria
                            </h3>
                            <p className="text-sm text-gray-800">
                                <strong>Banco:</strong> {bankTransferDetails.bankName}
                            </p>
                            <p className="text-sm text-gray-800">
                                <strong>Número de Cuenta:</strong> {bankTransferDetails.accountNumber}
                            </p>
                            <p className="text-sm text-gray-800">
                                <strong>Titular:</strong> {bankTransferDetails.accountHolder}
                            </p>
                            <p className="text-sm text-gray-800">
                                <strong>C.I./NIT:</strong> {bankTransferDetails.identification}
                            </p>
                            <p className='mt-3 text-xs text-gray-700'>
                                **Importante:** Una vez realizado el pago, envía tu comprobante a{' '}
                                <a
                                    href={`mailto:${bankTransferDetails.emailForProof}`}
                                    className='text-gray-900 hover:text-blue-700'
                                >
                                    {bankTransferDetails.emailForProof}
                                </a>{' '}
                                o por WhatsApp a{' '}
                                <a
                                    href={`https://wa.me/${bankTransferDetails.whatsappForProof}`}
                                    className='text-gray-900 hover:text-blue-700'
                                >
                                    {bankTransferDetails.whatsappForProof}
                                </a>{' '}
                                para confirmar tu pedido.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default OrderConfirmationPage;