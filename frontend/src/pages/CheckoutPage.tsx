import React, { useState } from 'react';
import { useAppSelector } from '../app/hooks';
import { formatPrice } from '../utils/formatPrice';
import { Link, useNavigate } from 'react-router-dom';

const CheckoutPage: React.FC = () => {
  const { cartTotal, cartItems } = useAppSelector((state: any) => state.cart);
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the order to the backend
    console.log('Order submitted:', { shippingInfo, cartItems, cartTotal });
    // For now, just navigate to the order confirmation page
    navigate('/order-confirmation');
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-75 p-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Tu Carrito Está Vacío</h1>
        <p className="text-lg text-gray-600 mb-8">Por favor, añade artículos a tu carrito antes de finalizar la compra.</p>
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
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <h1 className="sr-only">Finalizar compra</h1>

          <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
            <div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Información de contacto</h2>

                <div className="mt-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      value={shippingInfo.email}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t border-gray-200 pt-10">
                <h2 className="text-lg font-medium text-gray-900">Información de envío</h2>

                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        autoComplete="given-name"
                        value={shippingInfo.firstName}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Apellido
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        autoComplete="family-name"
                        value={shippingInfo.lastName}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Dirección
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="address"
                        id="address"
                        autoComplete="street-address"
                        value={shippingInfo.address}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      Ciudad
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="city"
                        id="city"
                        autoComplete="address-level2"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      País
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="country"
                            id="country"
                            autoComplete="country-name"
                            value={shippingInfo.country}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                      Código postal
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="zipCode"
                        id="zipCode"
                        autoComplete="postal-code"
                        value={shippingInfo.zipCode}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        autoComplete="tel"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pago */}
              <div className="mt-10 border-t border-gray-200 pt-10">
                <h2 className="text-lg font-medium text-gray-900">Pago</h2>
                  <p className="mt-4 text-sm text-gray-500">
                    Por el momento solo aceptamos pago contra entrega.
                  </p>
              </div>

            </div>

            {/* Resumen del pedido */}
            <div className="mt-10 lg:mt-0">
              <h2 className="text-lg font-medium text-gray-900">Resumen del pedido</h2>

              <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                <h3 className="sr-only">Artículos en tu carrito</h3>
                <ul role="list" className="divide-y divide-gray-200">
                  {cartItems.map((product:any) => (
                    <li key={product.id} className="flex px-4 py-6 sm:px-6">
                      <div className="flex-shrink-0">
                        <img src={product.image} alt={product.title} className="w-20 rounded-md" />
                      </div>

                      <div className="ml-6 flex flex-1 flex-col">
                        <div className="flex">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm">
                              <a href="#" className="font-medium text-gray-700 hover:text-gray-800">
                                {product.title}
                              </a>
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                            <p className="mt-1 text-sm text-gray-500">Qty: {product.quantity}</p>
                          </div>
                        </div>

                        <div className="flex flex-1 items-end justify-between pt-2">
                          <p className="mt-1 text-sm font-medium text-gray-900">{formatPrice(product.price, product.currency)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-6 border-t border-gray-200 px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm">Subtotal</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatPrice(cartTotal, cartItems[0]?.currency || 'Bs')}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm">Envío</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatPrice(0, cartItems[0]?.currency || 'Bs')}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-300 pt-6 text-base font-medium text-gray-900">
                    <dt>Total</dt>
                    <dd>{formatPrice(cartTotal, cartItems[0]?.currency || 'Bs')}</dd>
                  </div>
                </dl>

                <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                  <button
                    type="submit"
                    className="w-full rounded-md border border-transparent bg-gray-900 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:ring-offset-gray-50"
                  >
                    Confirmar pedido
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
