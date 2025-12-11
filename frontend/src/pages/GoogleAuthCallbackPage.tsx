import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { loginSuccess } from '../features/auth/authSlice';
import customFetch from '../api/customFetch'; // Importar la instancia de axios
import toast from 'react-hot-toast';

const GoogleAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const hasProcessedToken = useRef(false);

  useEffect(() => {
    if (hasProcessedToken.current) {
        return; // Prevenir que se ejecute múltiples veces
    }

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    const fetchUserAndLogin = async (authToken: string) => {
      try {
        // Guardar el token en localStorage para que futuras llamadas a la API estén autenticadas
        localStorage.setItem('token', authToken);

        // Pedir los datos del usuario al endpoint /api/auth/me
        const response = await customFetch.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const user = response.data;

        // Ahora sí, despachar loginSuccess con el usuario y el token
        dispatch(loginSuccess({ user, token: authToken }));
        toast.success('Sesión iniciada con Google exitosamente.');
        navigate('/'); // Redirigir al inicio
      } catch (apiError) {
        console.error('Falló al obtener datos del usuario después de la autenticación de Google:', apiError);
        toast.error('No se pudo obtener la información del usuario.');
        localStorage.removeItem('token'); // Limpiar en caso de fallo
        navigate('/login');
      }
    };

    if (token) {
      hasProcessedToken.current = true;
      fetchUserAndLogin(token);
    } else if (error) {
      hasProcessedToken.current = true;
      toast.error(`Error de autenticación con Google: ${error}`);
      navigate('/login');
    } else {
      hasProcessedToken.current = true;
      toast.error('Error desconocido en la autenticación con Google.');
      navigate('/login');
    }
  }, [navigate, location.search, dispatch]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-xl text-gray-700">Iniciando sesión con Google...</h1>
        <p className="text-gray-500">Espera un momento.</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallbackPage;