import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
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

// Admin Imports
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import AdminPage from './pages/AdminPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import AdminOrderDetailPage from './pages/AdminOrderDetailPage';

// Placeholder Components
const ErrorPage = () => (
    <div className="flex justify-center items-center h-screen">
        <h1 className='text-4xl text-center font-bold'>404 - Page Not Found</h1>
    </div>
);

// Public Layout Component
const PublicLayout = () => {
    return (
        <div className='flex flex-col min-h-screen'>
            <Header />
            <main className='flex-grow'>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route
                    path='/'
                    element={<PublicLayout />}
                >
                    <Route index element={<HomePage />} />
                    <Route path='brands/:brandName' element={<BrandPage />} />
                    <Route path='categories/:categoryName' element={<CategoryPage />} />
                    <Route path='product/:id' element={<SingleProductPage />} />
                    <Route path='cart' element={<CartPage />} />
                    <Route path='checkout' element={<CheckoutPage />} />
                    <Route path='order-confirmation' element={<OrderConfirmationPage />} />
                    <Route path='register' element={<RegisterPage />} />
                    <Route path='login' element={<LoginPage />} />
                    <Route path='profile' element={<ProfilePage />} />
                    <Route path='my-orders' element={<MyOrdersPage />} />
                </Route>

                {/* Admin Routes */}
                <Route
                    path="/admin"
                    element={<AdminRoute />}
                >
                    <Route element={<AdminLayout />}>
                        <Route index element={<AdminPage />} />
                        <Route path="products" element={<AdminProductsPage />} />
                        <Route path="products/new" element={<AddProductPage />} />
                        <Route path="products/edit/:id" element={<EditProductPage />} />
                        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                    </Route>
                </Route>

                {/* Not Found Route */}
                <Route path='*' element={<ErrorPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
