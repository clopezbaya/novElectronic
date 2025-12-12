import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
    return (
        <div className='flex flex-col min-h-screen'>
            <Toaster position="top-center" />
            <Header />
            <main className='flex-grow'>
                <Outlet />
            </main>
            <Footer />
            <ScrollRestoration />
        </div>
    );
}

export default App;