import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

const AdminRoute: React.FC = () => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience
        // than dropping them off on the home page.
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'ADMIN') {
        // If the user is authenticated but not an admin, redirect them to the home page.
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
