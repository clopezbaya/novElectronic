import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import type { RootState } from '../app/store'; // Import RootState for proper typing
import type { CartItem } from '../features/cart/cartSlice'; // Import CartItem type
import { formatPrice } from '../utils/formatPrice';
import { Link, useNavigate } from 'react-router-dom';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { clearCart } from '../features/cart/cartSlice';
import Breadcrumbs from '../components/Breadcrumbs';

const bolivianDepartments = [
    "Beni", "Chuquisaca", "Cochabamba", "La Paz", "Oruro", "Pando", "Potosí", "Santa Cruz", "Tarija"
];

const CheckoutPage: React.FC = () => {
  const dispatch = useAppDispatch();
  // Use RootState for proper state typing
  const { cartTotal, cartItems } = useAppSelector((state: RootState) => state.cart);
  const { isAuthenticated, token } = useAppSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: 'Santa Cruz',
    phone: '',
    email: '',
    observations: '',
  });
  const [loading, setLoading] = useState(false);

  const shippingCost = shippingInfo.city === 'Santa Cruz' ? 15 : 25; // Adjusted shipping cost

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Necesitas iniciar sesión para finalizar la compra.');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
        toast.error('Error: No estás autenticado.');
        navigate('/login');
        return;
    }
    if (cartItems.length === 0) {
        toast.error('El carrito está vacío. Añade productos para comprar.');
        navigate('/');
        return;
    }

    setLoading(true);
    try {
        const orderData = {
            // Add type annotation to item
            orderItems: cartItems.map((item: CartItem) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            })),
            subtotal: cartTotal,
            shippingCost: shippingCost,
            total: cartTotal + shippingCost,
            shippingAddress: shippingInfo,
        };
        const response = await customFetch.post('/orders', orderData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        toast.success('Pedido creado exitosamente. Redirigiendo a la confirmación.');
        dispatch(clearCart());
        navigate('/order-confirmation', { state: { order: response.data.order } });
    } catch (error: any) {
        console.error('Error al crear el pedido:', error);
        toast.error(error.response?.data?.message || 'Error al crear el pedido. Inténtalo de nuevo.');
    } finally {
        setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

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
    <div className="bg-gray-100">
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <Breadcrumbs />
          <h1 className="sr-only">Finalizar compra</h1>

          <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16 mt-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Información de contacto</h2>

                <div className="relative mb-6">
                    <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    value={shippingInfo.email}
                    onChange={handleInputChange}
                    className="block px-3.5 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer"
                    placeholder=" "
                    required
                    />
                    <label htmlFor="email" className="absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                    Correo electrónico
                    </label>
                </div>

                <h2 className="text-2xl font-semibold text-gray-900 mt-10 border-t border-gray-200 pt-10 mb-6">Información de envío</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    <div className="relative">
                        <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        autoComplete="given-name"
                        value={shippingInfo.firstName}
                        onChange={handleInputChange}
                        className="block px-3.5 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer"
                        placeholder=" "
                        required
                        />
                        <label htmlFor="firstName" className="absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                        Nombre
                        </label>
                    </div>

                    <div className="relative">
                        <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        autoComplete="family-name"
                        value={shippingInfo.lastName}
                        onChange={handleInputChange}
                        className="block px-3.5 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer"
                        placeholder=" "
                        required
                        />
                        <label htmlFor="lastName" className="absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                        Apellido
                        </label>
                    </div>

                    <div className="sm:col-span-2 relative">
                        <input
                        type="text"
                        name="address"
                        id="address"
                        autoComplete="street-address"
                        value={shippingInfo.address}
                        onChange={handleInputChange}
                        className="block px-3.5 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer"
                        placeholder=" "
                        required
                        />
                        <label htmlFor="address" className="absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                        Dirección
                        </label>
                    </div>

                    <div className="relative">
                        <select
                        id="city"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        className="block px-3.5 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer"
                        required
                        >
                        {bolivianDepartments.map(dep => (
                            <option key={dep} value={dep}>{dep}</option>
                        ))}
                        </select>
                        <label htmlFor="city" className="absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900">
                        Departamento
                        </label>
                    </div>

                    <div className="sm:col-span-2 relative">
                        <input
                        type="text"
                        name="phone"
                        id="phone"
                        autoComplete="tel"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        className="block px-3.5 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer"
                        placeholder=" "
                        required
                        />
                        <label htmlFor="phone" className="absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                        Teléfono
                        </label>
                    </div>

                    <div className="sm:col-span-2 relative">
                        <textarea
                        name="observations"
                        id="observations"
                        rows={3}
                        value={shippingInfo.observations}
                        onChange={handleInputChange}
                        className="block px-3.5 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer"
                        placeholder=" "
                        />
                        <label htmlFor="observations" className="absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                        Observaciones o recomendaciones
                        </label>
                    </div>
                </div>
            </div>
            
            {/* Order Summary */}
            <div className="mt-10 lg:mt-0">
              <h2 className="text-2xl font-semibold text-gray-900">Resumen del pedido</h2>

              <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                <h3 className="sr-only">Artículos en tu carrito</h3>
                <ul role="list" className="divide-y divide-gray-200">
                  {/* Add type annotation to product here */}
                  {cartItems.map((product: CartItem) => (
                    <li key={product.id} className="flex px-4 py-6 sm:px-6">
                      <div className="flex-shrink-0">
                        <img src={product.image} alt={product.title} className="w-24 rounded-md" />
                      </div>

                      <div className="ml-6 flex flex-1 flex-col">
                        <div className="flex">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base">
                              <a href="#" className="font-semibold text-gray-700 hover:text-gray-800">
                                {product.title}
                              </a>
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                            <p className="mt-1 text-sm text-gray-500">Qty: {product.quantity}</p>
                          </div>
                        </div>

                        <div className="flex flex-1 items-end justify-between pt-2">
                          <p className="mt-1 text-base font-medium text-gray-900">{formatPrice(product.price, product.currency)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-6 border-t border-gray-200 px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between">
                    <dt className="text-base">Subtotal</dt>
                    <dd className="text-base font-medium text-gray-900">{formatPrice(cartTotal, cartItems[0]?.currency || 'Bs')}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-base">Envío</dt>
                    <dd className="text-base font-medium text-gray-900">{formatPrice(shippingCost, 'Bs')}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-300 pt-6 text-xl font-bold text-gray-900">
                    <dt>Total</dt>
                    <dd>{formatPrice(cartTotal + shippingCost, 'Bs')}</dd>
                  </div>
                </dl>

                <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                  {/* Shipping Info Alert */}
                  <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
                      <p className="font-bold">Aviso de Envío</p>
                      <p className="text-sm mt-1">El tiempo de entrega estimado es de <strong>48 a 72 horas hábiles</strong> una vez que tu pago sea verificado.</p>
                      <p className="text-sm mt-2">Te recomendamos estar atento al estado de tu orden en la sección <Link to="/my-orders" className="font-semibold underline hover:text-blue-900">"Mis Pedidos"</Link>.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading} // Use the loading state here
                    className={`w-full rounded-lg border border-transparent px-4 py-3 text-lg font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 transition-colors ${
                        loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-700 focus:ring-gray-900'
                    }`}
                  >
                    {loading ? 'Procesando...' : 'Confirmar pedido'}
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
