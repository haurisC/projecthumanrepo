import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Logout from './components/Logout';

// Main App Content Component (inside AuthProvider)
function AppContent() {
  const { user, isAuthenticated, isLoading, apiClient } = useAuth();
  const [message, setMessage] = useState('');
  const [protectedData, setProtectedData] = useState(null);

  useEffect(() => {
    // Fetch welcome message from backend
    apiClient.get('/')
      .then(response => {
        setMessage(response.data.message);
      })
      .catch(error => {
        console.error('Error fetching message:', error);
        setMessage('Unable to connect to backend');
      });
  }, [apiClient]);

  // Fetch protected data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/api/protected')
        .then(response => {
          setProtectedData(response.data);
        })
        .catch(error => {
          console.error('Error fetching protected data:', error);
        });
    } else {
      setProtectedData(null);
    }
  }, [isAuthenticated, apiClient]);

  if (isLoading) {
    return (
      <div className="App">
        <header className="App-header">
          <div className="loading-spinner">
            <h2>Loading...</h2>
            <p>Initializing ProjectHuman...</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>ProjectHuman</h1>
          <p className="subtitle">{message}</p>
          
          {isAuthenticated && (
            <div className="user-header">
              <Logout />
            </div>
          )}
        </div>
        
        <main className="main-content">
          {!isAuthenticated ? (
            <Login />
          ) : (
            <div className="dashboard">
              <div className="welcome-section">
                <h2>Welcome back, {user?.username}! 👋</h2>
                <div className="user-info">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Account created:</strong> {
                    user?.created_at 
                      ? new Date(user.created_at).toLocaleDateString() 
                      : 'N/A'
                  }</p>
                  <p><strong>Status:</strong> 
                    <span className={`status ${user?.is_active ? 'active' : 'inactive'}`}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>

              {protectedData && (
                <div className="protected-section">
                  <h3>Protected Content</h3>
                  <div className="protected-data">
                    <p>{protectedData.message}</p>
                    {protectedData.user && (
                      <div className="api-user-info">
                        <h4>API User Info:</h4>
                        <pre>{JSON.stringify(protectedData.user, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="actions-section">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button 
                    className="action-btn primary"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Data
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => {
                      apiClient.get('/api/auth/me')
                        .then(response => {
                          alert('Profile synced successfully!');
                        })
                        .catch(error => {
                          alert('Failed to sync profile');
                        });
                    }}
                  >
                    Sync Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </header>
    </div>
  );
}

// Main App Component (wraps AuthProvider)
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
