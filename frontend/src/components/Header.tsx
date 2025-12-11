import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaShoppingCart,
    FaBars,
    FaTimes,
    FaChevronDown,
    FaUserCircle,
    FaSignOutAlt,
    FaTachometerAlt,
    FaChevronUp,
} from 'react-icons/fa';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { logout, setUser } from '../features/auth/authSlice';
import logo from '../assets/logo1.png';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';
import type { Brand, Category } from '../types/index.ts';

const Header = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { numItemsInCart } = useAppSelector((state: any) => state.cart);
    const { isAuthenticated, user, token } = useAppSelector(
        (state: any) => state.auth
    );

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [isMobileBrandAccordionOpen, setIsMobileBrandAccordionOpen] =
        useState(false);
    const [isMobileCategoryAccordionOpen, setIsMobileCategoryAccordionOpen] =
        useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const brandMenuRef = useRef<HTMLDivElement>(null);
    const categoryMenuRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMenuData = async () => {
            try {
                const [brandsResponse, categoriesResponse] = await Promise.all([
                    customFetch.get<Brand[]>('/brands'),
                    customFetch.get<Category[]>('/categories'),
                ]);
                setBrands(brandsResponse.data);
                setCategories(categoriesResponse.data);
            } catch (error) {
                console.error('Error fetching menu data:', error);
            }
        };
        fetchMenuData();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            if (token && !user) {
                try {
                    const response = await customFetch.get('/auth/me', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    dispatch(setUser(response.data));
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    dispatch(logout());
                }
            }
        };
        fetchUser();
    }, [token, user, dispatch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                brandMenuRef.current &&
                !brandMenuRef.current.contains(event.target as Node)
            )
                setIsBrandMenuOpen(false);
            if (
                categoryMenuRef.current &&
                !categoryMenuRef.current.contains(event.target as Node)
            )
                setIsCategoryMenuOpen(false);
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node)
            )
                setIsUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeAllMenus = () => {
        setIsBrandMenuOpen(false);
        setIsCategoryMenuOpen(false);
        setIsUserMenuOpen(false);
    };

    const toggleBrandMenu = () => {
        closeAllMenus();
        setIsBrandMenuOpen(!isBrandMenuOpen);
    };

    const toggleCategoryMenu = () => {
        closeAllMenus();
        setIsCategoryMenuOpen(!isCategoryMenuOpen);
    };

    const toggleUserMenu = () => {
        closeAllMenus();
        setIsUserMenuOpen(!isUserMenuOpen);
    };

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        dispatch(logout());
        toast.success('Has cerrado sesión exitosamente.');
        navigate('/login', { state: { fromLogout: true } });
        setIsLogoutModalOpen(false);
        if (isMenuOpen) toggleMenu();
    }

    return (
        <header className='bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50'>
            <nav className='flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                {/* Left Section: Logo */}
                <div className='flex items-center'>
                    <Link
                        to='/'
                        className='flex items-center'
                    >
                        <img
                            src={logo}
                            alt='NovElectronic Logo'
                            className='h-10 w-auto'
                        />
                    </Link>
                </div>

                {/* Center Section: Main Links (Desktop) */}
                <div className='hidden lg:flex items-center space-x-8'>
                    <Link
                        to='/'
                        className='text-base font-medium text-white hover:text-gray-300'
                    >
                        Inicio
                    </Link>

                    <div
                        className='relative'
                        ref={brandMenuRef}
                    >
                        <button
                            onClick={toggleBrandMenu}
                            className='flex items-center text-base font-medium text-white hover:text-gray-300'
                        >
                            Marcas <FaChevronDown className='ml-1 h-3 w-3' />
                        </button>
                        {isBrandMenuOpen && (
                            <div className='absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-white rounded-md shadow-lg z-10'>
                                <div className='py-1'>
                                    {brands.map((brand) => (
                                        <Link
                                            key={brand.id}
                                            to={`/brands/${brand.name}`}
                                            onClick={() =>
                                                setIsBrandMenuOpen(false)
                                            }
                                            className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                        >
                                            {brand.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div
                        className='relative'
                        ref={categoryMenuRef}
                    >
                        <button
                            onClick={toggleCategoryMenu}
                            className='flex items-center text-base font-medium text-white hover:text-gray-300'
                        >
                            Categorías{' '}
                            <FaChevronDown className='ml-1 h-3 w-3' />
                        </button>
                        {isCategoryMenuOpen && (
                            <div className='absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-white rounded-md shadow-lg z-10'>
                                <div className='py-1'>
                                    {categories.map((category) => (
                                        <Link
                                            key={category.id}
                                            to={`/categories/${category.name}`}
                                            onClick={() =>
                                                setIsCategoryMenuOpen(false)
                                            }
                                            className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section: Icons */}
                <div className='hidden lg:flex items-center space-x-6'>
                    <Link
                        to='/cart'
                        className='relative text-white hover:text-gray-300'
                    >
                        <FaShoppingCart className='h-6 w-6' />
                        {numItemsInCart > 0 && (
                            <span className='absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center'>
                                {numItemsInCart}
                            </span>
                        )}
                    </Link>

                    {!isAuthenticated ? (
                        <>
                            <Link
                                to='/login'
                                className='text-base font-medium text-white hover:text-gray-300'
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                to='/register'
                                className='text-base font-medium text-white hover:text-gray-300 ml-4'
                            >
                                Registrarse
                            </Link>
                        </>
                    ) : (
                        <div
                            className='relative'
                            ref={userMenuRef}
                        >
                            <button
                                onClick={toggleUserMenu}
                                className='flex items-center text-white hover:text-gray-300'
                            >
                                <FaUserCircle className='h-6 w-6' />
                            </button>
                            {isUserMenuOpen && (
                                <div className='absolute top-full right-0 mt-3 w-56 bg-white rounded-md shadow-lg z-10'>
                                    <div className='py-1'>
                                        <div className='px-4 py-2 border-b border-gray-200'>
                                            <p className='text-sm font-medium text-gray-900 truncate'>
                                                {user?.name || user?.email}
                                            </p>
                                        </div>
                                        {user?.role === 'ADMIN' && (
                                            <Link
                                                to='/admin'
                                                onClick={() =>
                                                    setIsUserMenuOpen(false)
                                                }
                                                className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                            >
                                                <FaTachometerAlt className='mr-2' />{' '}
                                                Panel Admin
                                            </Link>
                                        )}
                                        <Link
                                            to='/profile'
                                            onClick={() =>
                                                setIsUserMenuOpen(false)
                                            }
                                            className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                        >
                                            <FaUserCircle className='mr-2' /> Mi
                                            Perfil
                                        </Link>
                                        {user?.role !== 'ADMIN' && (
                                            <Link
                                                to='/my-orders'
                                                onClick={() =>
                                                    setIsUserMenuOpen(false)
                                                }
                                                className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                            >
                                                <FaTachometerAlt className='mr-2' />{' '}
                                                Mis Pedidos
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className='w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                        >
                                            <FaSignOutAlt className='mr-2' />{' '}
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Hamburger Button */}
                <div className='lg:hidden'>
                    <button
                        onClick={toggleMenu}
                        className='text-white hover:text-gray-300 focus:outline-none'
                    >
                        {isMenuOpen ? (
                            <FaTimes className='h-6 w-6' />
                        ) : (
                            <FaBars className='h-6 w-6' />
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className='lg:hidden bg-gray-900 border-t border-gray-700'>
                    <div className='pt-2 pb-3 space-y-1'>
                        <Link
                            to='/'
                            onClick={toggleMenu}
                            className='block px-4 py-2 text-base font-medium text-white hover:bg-gray-700'
                        >
                            Inicio
                        </Link>

                        <div className='w-full flex flex-col items-center'>
                            <button
                                onClick={() =>
                                    setIsMobileBrandAccordionOpen(
                                        !isMobileBrandAccordionOpen
                                    )
                                }
                                className='flex justify-center items-center w-full max-w-xs text-base font-medium text-white hover:bg-gray-700 py-2'
                            >
                                <span>Marcas</span>
                                {isMobileBrandAccordionOpen ? (
                                    <FaChevronUp className='ml-2' />
                                ) : (
                                    <FaChevronDown className='ml-2' />
                                )}
                            </button>
                            {isMobileBrandAccordionOpen && (
                                <div className='flex flex-col items-center space-y-2 mt-2 w-full max-w-xs'>
                                    {brands.map((brand) => (
                                        <Link
                                            key={brand.id}
                                            to={`/brands/${brand.name}`}
                                            onClick={() => {
                                                setIsBrandMenuOpen(false);
                                                toggleMenu();
                                            }}
                                            className='text-base text-gray-300 hover:text-white w-full text-center'
                                        >
                                            {brand.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className='w-full flex flex-col items-center'>
                            <button
                                onClick={() =>
                                    setIsMobileCategoryAccordionOpen(
                                        !isMobileCategoryAccordionOpen
                                    )
                                }
                                className='flex justify-center items-center w-full max-w-xs text-base font-medium text-white hover:bg-gray-700 py-2'
                            >
                                <span>Categorías</span>
                                {isMobileCategoryAccordionOpen ? (
                                    <FaChevronUp className='ml-2' />
                                ) : (
                                    <FaChevronDown className='ml-2' />
                                )}
                            </button>
                            {isMobileCategoryAccordionOpen && (
                                <div className='flex flex-col items-center space-y-2 mt-2 w-full max-w-xs'>
                                    {categories.map((category) => (
                                        <Link
                                            key={category.id}
                                            to={`/categories/${category.name}`}
                                            onClick={() => {
                                                setIsCategoryMenuOpen(false);
                                                toggleMenu();
                                            }}
                                            className='text-base text-gray-300 hover:text-white w-full text-center'
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link
                            to='/cart'
                            onClick={toggleMenu}
                            className='relative block px-4 py-2 text-base font-medium text-white hover:bg-gray-700'
                        >
                            <FaShoppingCart className='h-6 w-6 inline-block mr-2' />{' '}
                            Carrito
                            {numItemsInCart > 0 && (
                                <span className='absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center'>
                                    {numItemsInCart}
                                </span>
                            )}
                        </Link>

                        {!isAuthenticated ? (
                            <>
                                <Link
                                    to='/login'
                                    onClick={toggleMenu}
                                    className='block px-4 py-2 text-base font-medium text-white hover:bg-gray-700'
                                >
                                    Iniciar Sesión
                                </Link>
                                <Link
                                    to='/register'
                                    onClick={toggleMenu}
                                    className='block px-4 py-2 text-base font-medium text-white hover:bg-gray-700'
                                >
                                    Registrarse
                                </Link>
                            </>
                        ) : (
                            <div className='pt-4 pb-3 border-t border-gray-700'>
                                <div className='flex items-center px-4'>
                                    <FaUserCircle className='h-8 w-8 text-gray-300' />
                                    <div className='ml-3'>
                                        <p className='text-base font-medium text-white'>
                                            {user?.name}
                                        </p>
                                        <p className='text-sm font-medium text-gray-400'>
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>
                                <div className='mt-3 space-y-1'>
                                    {user?.role === 'ADMIN' && (
                                        <Link
                                            to='/admin'
                                            onClick={toggleMenu}
                                            className='flex items-center px-4 py-2 text-base font-medium text-white hover:bg-gray-700'
                                        >
                                            Panel Admin
                                        </Link>
                                    )}
                                    <Link
                                        to='/profile'
                                        onClick={toggleMenu}
                                        className='flex items-center px-4 py-2 text-base font-medium text-white hover:bg-gray-700'
                                    >
                                        Mi Perfil
                                    </Link>
                                    {user?.role !== 'ADMIN' && (
                                        <Link
                                            to='/my-orders'
                                            onClick={toggleMenu}
                                            className='flex items-center px-4 py-2 text-base font-medium text-white hover:bg-gray-700'
                                        >
                                            Mis Pedidos
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className='w-full text-left flex items-center px-4 py-2 text-base font-medium text-white hover:bg-gray-700'
                                    >
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <ConfirmationModal 
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                title="Confirmar Cierre de Sesión"
                message="¿Estás seguro de que quieres cerrar sesión?"
            />
        </header>
    );
};

export default Header;
