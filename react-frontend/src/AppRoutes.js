import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useAuth } from './contexts/AuthContext';
import VerifyEmail from "./components/VerifyEmail";



const AppRoutes = ({
  dashboardProps // pass all your dashboard class constants and props as one object
}) => {
  const { isAuthenticated, user, apiClient } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated
            ? <Dashboard {...dashboardProps} user={user} apiClient={apiClient} />
            : <Navigate to="/" replace />
        }
      />
      <Route path="/verify-email" element={<VerifyEmail />} />
      {/* Add more routes here as needed */}
    </Routes>
    
  );
};

export default AppRoutes;