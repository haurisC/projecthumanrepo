import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// Tailwind class constants
const containerClass = "flex items-center gap-4";
const userInfoClass = "text-sm text-gray-600";
const buttonClass = "px-4 py-2 bg-red-600 text-white rounded cursor-pointer text-sm border-none transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed";

const Logout = () => {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return null; // Don't render if no user is logged in
  }

  return (
    <div className={containerClass}>
      <div className={userInfoClass}>
        Welcome, {user.username || user.email}
      </div>
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={buttonClass}
        title="Sign out of your account"
      >
        {isLoading ? 'Signing out...' : 'Logout'}
      </button>
    </div>
  );
};

export default Logout;
