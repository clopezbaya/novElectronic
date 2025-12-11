import React from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import type { RootState } from '../app/store';
import { removeItem, editItem, clearCart } from '../features/cart/cartSlice';
import { formatPrice } from '../utils/formatPrice';
import { Link } from 'react-router-dom';
import { FaTrashAlt, FaShoppingCart } from 'react-icons/fa';
import { nanoid } from 'nanoid';
import Breadcrumbs from '../components/Breadcrumbs';

const CartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { cartItems, cartTotal } = useAppSelector((state: RootState) => state.cart);

  const handleRemoveItem = (id: string) => {
    dispatch(removeItem(id));
  };

  const handleEditItemQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    dispatch(editItem({ id, quantity }));
  };

  if (cartItems.length === 0) {
    return (
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full text-center">
                <FaShoppingCart className="text-7xl text-gray-400 mb-6 mx-auto" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Tu Carrito Está Vacío</h1>
                <p className="text-gray-600 mb-6">Parece que aún no has añadido nada. ¡Explora nuestros productos!</p>
                <Link
                  to="/"
                  className="bg-gray-900 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-700 transition duration-300 transform hover:scale-105"
                >
                  Empezar a Comprar
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mt-8">Shopping Cart</h1>
        <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">
              Items in your shopping cart
            </h2>

            <ul role="list" className="divide-y divide-gray-200 border-b border-t border-gray-200">
              {cartItems.map((item: any) => (
                <li key={nanoid()} className="flex py-6 sm:py-10">
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-24 w-24 rounded-md object-contain object-center sm:h-48 sm:w-48"
                    />
                  </div>

                  <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-sm">
                            <Link to={`/product/${item.productId}`} className="font-medium text-gray-900 hover:text-blue-700">
                              {item.title}
                            </Link>
                          </h3>
                        </div>
                        <div className="mt-1 flex text-sm">
                          <p className="text-gray-500">{item.category}</p>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-900">{formatPrice(item.price, item.currency)}</p>
                      </div>

                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        <label htmlFor={`quantity-${item.id}`} className="sr-only">
                          Cantidad, {item.title}
                        </label>
                        <input
                          id={`quantity-${item.id}`}
                          name={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleEditItemQuantity(item.id, parseInt(e.target.value))}
                          className="w-20 rounded-md border border-gray-300 py-1.5 text-center text-base font-medium leading-5 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />

                        <div className="absolute right-0 top-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="-m-2 inline-flex p-2 text-gray-900 hover:text-blue-700"
                          >
                            <span className="sr-only">Eliminar</span>
                            <FaTrashAlt className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => dispatch(clearCart())}
                className="text-sm font-medium text-gray-900 hover:text-blue-700"
              >
                Vaciar Carrito Completo
              </button>
            </div>
          </section>

          {/* Order summary */}
          <section
            aria-labelledby="summary-heading"
            className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Resumen del pedido
            </h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">{formatPrice(cartTotal, cartItems[0]?.currency || 'Bs')}</dd>
              </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <dt className="flex items-center text-sm text-gray-600">
                      <span>Envío</span>
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">Se calcula al finalizar la compra</dd>
                  </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Total del pedido</dt>
                <dd className="text-base font-medium text-gray-900">{formatPrice(cartTotal, cartItems[0]?.currency || 'Bs')}</dd>
              </div>
            </dl>

            <div className="mt-6">
                <Link
                  to="/checkout"
                  className="w-full rounded-md border border-transparent bg-gray-900 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:ring-offset-gray-50"
                >
                    Finalizar compra
                </Link>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};

export default CartPage;