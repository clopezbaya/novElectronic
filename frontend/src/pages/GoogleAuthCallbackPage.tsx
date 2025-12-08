import React, { useEffect, useRef } from 'react'; // Import useRef
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { loginSuccess } from '../features/auth/authSlice';
import toast from 'react-hot-toast';

const GoogleAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const hasProcessedToken = useRef(false); // Ref to track if token has been processed

  useEffect(() => {
    if (hasProcessedToken.current) {
        return; // Prevent running effect multiple times
    }

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      hasProcessedToken.current = true; // Mark token as processed
      dispatch(loginSuccess({ token })); 
      toast.success('Sesión iniciada con Google exitosamente.');
      navigate('/'); // Redirect to home page
      return; // Exit early after navigation
    } else if (error) {
      hasProcessedToken.current = true; // Mark as processed even on error
      toast.error(`Error de autenticación con Google: ${error}`);
      navigate('/login'); // Redirect to login page on error
      return; // Exit early after navigation
    } else {
      hasProcessedToken.current = true; // Mark as processed
      toast.error('Error desconocido en la autenticación con Google.');
      navigate('/login');
      return; // Exit early after navigation
    }
  }, [navigate, location.search, dispatch]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-xl text-gray-700">Iniciando sesión con Google...</h1>
    </div>
  );
};

export default GoogleAuthCallbackPage;
