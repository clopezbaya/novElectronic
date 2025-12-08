import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setUser } from '../features/auth/authSlice';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { FaUserCircle, FaEdit, FaKey, FaTimes } from 'react-icons/fa';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const ProfilePage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation(); // Initialize useLocation
    const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    useEffect(() => {
        // Check if the navigation state indicates an intentional logout
        const fromLogout = location.state?.fromLogout;

        if (!isAuthenticated) {
            if (!fromLogout) { // Only show toast if not coming from an intentional logout
                toast.error('Necesitas iniciar sesión para ver tu perfil.');
            }
            navigate('/login');
        } else {
            setName(user?.name || '');
            setEmail(user?.email || '');
        }
    }, [isAuthenticated, user, navigate, location.state]); // Add location.state to dependencies

    useEffect(() => {
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            setConfirmPasswordError('Las nuevas contraseñas no coinciden.');
        } else {
            setConfirmPasswordError('');
        }

        const hasMinLength = newPassword.length >= 8;
        const hasUppercase = /[A-Z]/.test(newPassword);
        const hasLowercase = /[a-z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);
        
        if (newPassword && (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar)) {
            setPasswordError('La contraseña no cumple con todos los requisitos de seguridad.');
        } else {
            setPasswordError('');
        }
    }, [newPassword, confirmPassword]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await customFetch.put(`/users/${user?.id}`, { name, email }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(setUser(response.data));
            toast.success('Perfil actualizado.');
            setIsEditingProfile(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar el perfil.');
        }
    };
    
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordError || confirmPasswordError) {
            toast.error('Corrige los errores en las contraseñas.');
            return;
        }

        try {
            await customFetch.put(`/users/${user?.id}/password`, { oldPassword, newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Contraseña actualizada.');
            setIsChangingPassword(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al cambiar la contraseña.');
        }
    };

    const inputContainerClass = "relative";
    const inputClass = "block px-3.5 pb-2.5 pt-5 w-full max-w-xs text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer mx-auto"; // Added max-w-xs and mx-auto
    const labelClass = "absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4";

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="bg-gray-100 py-12 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    
                    {/* Profile Section */}
                    <div className="mb-8 border-b border-gray-200 pb-8">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-4">
                                <FaUserCircle className="text-6xl text-gray-700" />
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800">Hola, {user?.name || user?.email}</h1>
                                    <p className="text-gray-600 text-lg">{user?.email}</p>
                                </div>
                            </div>
                            {!isEditingProfile && (
                                <button onClick={() => { setIsEditingProfile(true); setIsChangingPassword(false); }} className="flex items-center text-sm font-medium text-gray-900 hover:text-gray-600"><FaEdit className="mr-1"/> Editar Perfil</button>
                            )}
                        </div>

                        {isEditingProfile && (
                            <form onSubmit={handleProfileUpdate} className="mt-6 space-y-6">
                                <h2 className="text-2xl font-bold text-gray-800">Editar Perfil</h2>
                                <div className={inputContainerClass}>
                                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder=" "/>
                                    <label htmlFor="name" className={labelClass}>Nombre</label>
                                </div>
                                <div className={inputContainerClass}>
                                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder=" "/>
                                    <label htmlFor="email" className={labelClass}>Email</label>
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2 rounded-lg text-gray-800 bg-gray-200 hover:bg-gray-300">Cancelar</button>
                                    <button type="submit" className="px-6 py-2 rounded-lg text-white bg-gray-900 hover:bg-gray-700">Guardar Cambios</button>
                                </div>
                            </form>
                        )}
                    </div>
                    
                    {/* Change Password Section */}
                    <div>
                         <button onClick={() => { setIsChangingPassword(!isChangingPassword); setIsEditingProfile(false); }} className="flex items-center text-base font-semibold text-gray-800 hover:text-gray-600">
                             <FaKey className="mr-2"/> 
                             <span>Cambiar Contraseña</span>
                        </button>
                         {isChangingPassword && (
                            <form onSubmit={handlePasswordChange} className="mt-6 space-y-6">
                                <div className="max-w-xs mx-auto">
                                    <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className={inputClass} placeholder=" " required/>
                                    <label className={labelClass}>Contraseña Actual</label>
                                </div>
                                <div className="max-w-xs mx-auto">
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder=" " required/>
                                     <label className={labelClass}>Nueva Contraseña</label>
                                     <PasswordStrengthIndicator password={newPassword} />
                                     {passwordError && <p className="text-red-600 text-xs mt-1 absolute">{passwordError}</p>}
                                </div>
                                 <div className="max-w-xs mx-auto">
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} placeholder=" " required/>
                                    <label className={labelClass}>Confirmar Nueva Contraseña</label>
                                    {confirmPasswordError && <p className="text-red-600 text-xs mt-1 absolute">{confirmPasswordError}</p>}
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button type="button" onClick={() => setIsChangingPassword(false)} className="px-6 py-2 rounded-lg text-gray-800 bg-gray-200 hover:bg-gray-300">Cancelar</button>
                                    <button type="submit" className="px-6 py-2 rounded-lg text-white bg-gray-900 hover:bg-gray-700" disabled={passwordError || confirmPasswordError}>Cambiar Contraseña</button>
                                </div>
                            </form>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;