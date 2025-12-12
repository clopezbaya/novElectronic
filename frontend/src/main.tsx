import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { store } from './app/store';
import './index.css';

// Import all the components
import App from './App.tsx';
import HomePage from './pages/HomePage';
import SingleProductPage from './pages/SingleProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import BrandPage from './pages/BrandPage';
import CategoryPage from './pages/CategoryPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import MyOrdersPage from './pages/MyOrdersPage';
import GoogleAuthCallbackPage from './pages/GoogleAuthCallbackPage';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import AdminPage from './pages/AdminPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import AdminOrderDetailPage from './pages/AdminOrderDetailPage';

// Placeholder for Error Page
const ErrorPage = () => (
    <div className="flex justify-center items-center h-screen">
        <h1 className='text-4xl text-center font-bold'>404 - Page Not Found</h1>
    </div>
);

// Define the router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'brands/:brandName', element: <BrandPage /> },
      { path: 'categories/:categoryName', element: <CategoryPage /> },
      { path: 'product/:id', element: <SingleProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order-confirmation', element: <OrderConfirmationPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'my-orders', element: <MyOrdersPage /> },
    ],
  },
  {
    path: '/auth/google/success',
    element: <GoogleAuthCallbackPage />,
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'products/new', element: <AddProductPage /> },
          { path: 'products/edit/:id', element: <EditProductPage /> },
          { path: 'orders/:id', element: <AdminOrderDetailPage /> },
        ],
      },
    ],
  },
  // Not Found Route - Note: for createBrowserRouter, a top-level splat is better
  { path: '*', element: <ErrorPage /> }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);