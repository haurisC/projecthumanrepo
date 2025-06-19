import React from 'react';
import { useAuth } from '../contexts/AuthContext';

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

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontSize: '14px'
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  };

  const userInfoStyle = {
    fontSize: '14px',
    color: '#666'
  };

  return (
    <div style={containerStyle}>
      <div style={userInfoStyle}>
        Welcome, {user.username || user.email}
      </div>
      <button
        onClick={handleLogout}
        disabled={isLoading}
        style={buttonStyle}
        title="Sign out of your account"
      >
        {isLoading ? 'Signing out...' : 'Logout'}
      </button>
    </div>
  );
};

export default Logout;
