import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { FaGoogle } from 'react-icons/fa';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        toast.error('Las contraseñas no coinciden.');
        return;
    }
    // Basic check for strength, more detailed feedback is visual
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
    
    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
        toast.error('La contraseña no cumple con todos los requisitos de seguridad.');
        return;
    }

    setLoading(true);
    try {
      await customFetch.post('/auth/register', { email, password, name });
      toast.success('Registro exitoso. Por favor, inicia sesión.');
      navigate('/login');
    } catch (error: any) {
      console.error('Error durante el registro:', error);
      toast.error(error.response?.data?.message || 'Error en el registro. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`; // Redirect to backend Google OAuth initiation
  };

  const inputContainerClass = "relative";
  const inputClass = "block px-3.5 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer";
  const labelClass = "absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 space-y-6"> {/* Changed space-y-8 to space-y-6 */}
        <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">Crear una cuenta</h2>
            <p className="text-gray-600 mt-2">Regístrate para empezar a comprar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4"> {/* Changed space-y-8 to space-y-4 */}
          <div className={inputContainerClass}>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder=" "
              required
            />
            <label htmlFor="name" className={labelClass}>Nombre</label>
          </div>
          <div className={inputContainerClass}>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder=" "
              required
            />
            <label htmlFor="email" className={labelClass}>Correo Electrónico</label>
          </div>
          <div className={inputContainerClass}>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder=" "
              required
            />
            <label htmlFor="password" className={labelClass}>Contraseña</label>
          </div>

          <PasswordStrengthIndicator password={password} />

          <div className={inputContainerClass}>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder=" "
              required
            />
            <label htmlFor="confirmPassword" className={labelClass}>Confirmar Contraseña</label>
            {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-600 text-xs mt-1 absolute">Las contraseñas no coinciden.</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>

        <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-gray-400"></div>
            <span className="flex-shrink mx-4 text-gray-500">O</span>
            <div className="flex-grow border-t border-gray-400"></div>
        </div>

        <button
            onClick={handleGoogleRegister}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50"
            disabled={loading}
        >
            <FaGoogle className="mr-2 text-google-blue" /> Continuar con Google
        </button>

        <div className="text-base text-center">
          <p className="text-gray-600">¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-medium text-gray-900 hover:text-gray-700">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
