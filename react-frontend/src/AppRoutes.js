import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useAuth } from './contexts/AuthContext';
import VerifyEmail from "./components/VerifyEmail";
import OAuthCallback from "./components/OAuthCallback";
import ProfilePage from './components/ProfilePage';
import Waitlist from './components/Waitlist';


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
      <Route
        path="/profile/:userId"
        element={
          isAuthenticated
            ? <ProfilePage />
            : <Navigate to="/" replace />
        }
/>
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/waitlist" element={<Waitlist />} />
      {/* Add more routes here as needed */}
    </Routes>
    
  );
};

export default AppRoutes;