import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import toast from 'react-hot-toast';
import { FaSignOutAlt, FaStore } from 'react-icons/fa';
import ConfirmationModal from './ConfirmationModal';

const AdminLayout: React.FC = () => {
    const activeLinkClass = "bg-gray-700 text-white";
    const inactiveLinkClass = "text-gray-300 hover:bg-gray-700 hover:text-white";
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        dispatch(logout());
        toast.success('Has cerrado sesión exitosamente.');
        navigate('/login', { state: { fromLogout: true } });
        setIsLogoutModalOpen(false);
    };

    return (
        <div className="flex">
            <aside className="w-64 bg-gray-800 text-white flex flex-col flex-shrink-0 h-screen sticky top-0">
                <div>
                    <div className="p-4 text-2xl font-bold border-b border-gray-700">
                        Admin Panel
                    </div>
                    <nav className="mt-4">
                        <NavLink
                            to="/admin"
                            end
                            className={({ isActive }) =>
                                `block px-4 py-2 text-lg rounded-md mx-2 ${isActive ? activeLinkClass : inactiveLinkClass}`
                            }
                        >
                            Pedidos
                        </NavLink>
                        <NavLink
                            to="/admin/products"
                            className={({ isActive }) =>
                                `block px-4 py-2 text-lg rounded-md mx-2 mt-2 ${isActive ? activeLinkClass : inactiveLinkClass}`
                            }
                        >
                            Productos
                        </NavLink>
                    </nav>
                </div>
                <div className="mt-auto p-4 border-t border-gray-700">
                    <NavLink
                        to="/"
                        className={
                            `flex items-center px-4 py-2 text-lg rounded-md mx-2 ${inactiveLinkClass}`
                        }
                    >
                        <FaStore className="mr-3" /> Ver Tienda
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center px-4 py-2 text-lg rounded-md mx-2 mt-2 ${inactiveLinkClass}`}
                    >
                        <FaSignOutAlt className="mr-3" /> Cerrar Sesión
                    </button>
                </div>
            </aside>
            <main className="flex-grow bg-gray-100 min-h-screen">
                <Outlet />
            </main>
            <ConfirmationModal 
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                title="Confirmar Cierre de Sesión"
                message="¿Estás seguro de que quieres cerrar sesión?"
            />
        </div>
    );
};

export default AdminLayout;
