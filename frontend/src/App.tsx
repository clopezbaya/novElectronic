import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SingleProductPage from './pages/SingleProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import BrandPage from './pages/BrandPage';
import CategoryPage from './pages/CategoryPage'; // Import the new CategoryPage

// Placeholder Components for now
const ErrorPage = () => (
    <h1 className='text-3xl text-center mt-10'>Error Page</h1>
); // For 404

// Basic Layout Component
const Layout = () => {
    return (
        <div className='flex flex-col min-h-screen'>
            <Header />
            <main className='flex-grow'>
                <Outlet /> {/* This is where nested routes will render */}
            </main>
            <Footer />
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path='/'
                    element={<Layout />}
                >
                    <Route
                        index
                        element={<HomePage />}
                    />
                    <Route
                        path='brands/:brandName'
                        element={<BrandPage />}
                    />
                    <Route
                        path='categories/:categoryName'
                        element={<CategoryPage />}
                    />
                    <Route
                        path='product/:id'
                        element={<SingleProductPage />}
                    />
                    <Route
                        path='cart'
                        element={<CartPage />}
                    />
                    <Route
                        path='checkout'
                        element={<CheckoutPage />}
                    />
                    <Route
                        path='order-confirmation'
                        element={<OrderConfirmationPage />}
                    />
                    <Route
                        path='*'
                        element={<ErrorPage />}
                    />{' '}
                    {/* Catch-all for 404 */}
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;