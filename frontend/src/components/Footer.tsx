import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className='bg-gray-900 text-white p-6 text-center shadow-inner mt-12'>
            <div className='flex flex-col items-center px-4 sm:px-6 lg:px-8'>
                <div className="mb-4">
                    <Link to="/terms-and-conditions" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                        Términos y Condiciones
                    </Link>
                </div>
                <p className='text-sm text-gray-500 mb-4'>
                    &copy; {new Date().getFullYear()} Tienda NovElectronic.
                    Todos los derechos reservados.
                </p>
                <div className='flex space-x-6 text-2xl'>
                    <a
                        href='#'
                        className='hover:text-gray-400 transition-colors duration-200'
                    >
                        <FaFacebook />
                    </a>
                    <a
                        href='#'
                        className='hover:text-gray-400 transition-colors duration-200'
                    >
                        <FaTwitter />
                    </a>
                    <a
                        href='#'
                        className='hover:text-gray-400 transition-colors duration-200'
                    >
                        <FaInstagram />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
