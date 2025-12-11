import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../app/hooks';
import { loginSuccess } from '../features/auth/authSlice';
import { FaGoogle } from 'react-icons/fa';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await customFetch.post('/auth/login', { email, password });
      const { token, user } = response.data;
      dispatch(loginSuccess({ token, user }));
      toast.success('Sesión iniciada exitosamente.');
      navigate('/');
    } catch (error: any) {
      console.error('Error durante el login:', error);
      setError(error.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`; // Redirect to backend Google OAuth initiation
  };

  const inputContainerClass = "relative";
  const inputClass = "block px-3.5 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer";
  const labelClass = "absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">Bienvenido de nuevo</h2>
            <p className="text-gray-600 mt-2">Inicia sesión para acceder a tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className={inputContainerClass}>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleInputChange(setEmail)}
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
              onChange={handleInputChange(setPassword)}
              className={inputClass}
              placeholder=" "
              required
            />
            <label htmlFor="password" className={labelClass}>Contraseña</label>
            {error && <p className="text-red-600 text-xs mt-1 absolute">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-gray-400"></div>
            <span className="flex-shrink mx-4 text-gray-500">O</span>
            <div className="flex-grow border-t border-gray-400"></div>
        </div>

        <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50"
            disabled={loading}
        >
            <FaGoogle className="mr-2 text-google-blue" /> Continuar con Google
        </button>

        <div className="text-base text-center">
          <p className="text-gray-600">¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
