import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../app/hooks';
import { loginSuccess } from '../features/auth/authSlice';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await customFetch.post('/auth/login', { email, password });
      const { token, user } = response.data;
      dispatch(loginSuccess({ token, user }));
      toast.success('Sesión iniciada exitosamente.');
      navigate('/');
    } catch (error: any) {
      console.error('Error durante el login:', error);
      toast.error(error.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
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
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-base text-center">
          <p className="text-gray-600">¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-medium text-gray-900 hover:text-gray-700">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
