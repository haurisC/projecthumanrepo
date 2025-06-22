import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Logout from './components/Logout';

// Tailwind class constants
const appClass = "text-center min-h-screen bg-gradient-to-br from-indigo-400 to-purple-600";
const appHeaderClass = "bg-white/95 p-5 text-gray-800 min-h-screen flex flex-col items-center justify-start shadow-lg";
const headerContentClass = "w-full max-w-6xl flex justify-between items-center mb-8 flex-wrap";
const headerTitleClass = "m-0 text-[#2c3e50] text-4xl font-bold";
const subtitleClass = "text-gray-500 text-[1.1rem] my-1.5";
const userHeaderClass = "flex items-center";
const mainContentClass = "w-full max-w-6xl flex-1";
const loadingSpinnerClass = "p-12";
const loadingTitleClass = "text-blue-500 mb-2";
const dashboardClass = "grid gap-8 p-5";
const welcomeSectionClass = "bg-white p-8 rounded-xl shadow-lg text-left text-2xl font-bold";
const welcomeSectionH2Class = "text-[#2c3e50] mb-5 text-2xl";
const userInfoClass = "grid gap-2 text-[1.1rem]";
const userInfoPClass = "m-0 flex items-center gap-2";
const statusClass = "px-3 py-1 rounded-full text-[0.9rem] font-semibold uppercase";
const statusActiveClass = `${statusClass} bg-green-100 text-green-800`;
const statusInactiveClass = `${statusClass} bg-red-100 text-red-800`;
const protectedSectionClass = "bg-white p-8 rounded-xl shadow-lg text-left";
const protectedSectionH3Class = "text-[#2c3e50] mb-5 text-xl font-bold";
const protectedDataClass = "bg-gray-100 p-5 rounded-lg border-l-4 border-blue-400";
const apiUserInfoClass = "mt-5";
const apiUserInfoH4Class = "text-[#34495e] mb-2 font-semibold";
const apiUserInfoPreClass = "bg-[#2c3e50] text-[#ecf0f1] p-4 rounded overflow-x-auto text-[0.9rem] leading-relaxed";
const actionsSectionClass = "bg-white p-8 rounded-xl shadow-lg text-left";
const actionsSectionH3Class = "text-[#2c3e50] mb-5 text-xl font-bold";
const actionButtonsClass = "flex gap-4 flex-wrap";
const actionBtnClass = "py-3 px-6 border-none rounded-md text-base font-semibold cursor-pointer transition-all duration-300 min-w-[120px]";
const actionBtnPrimaryClass = `${actionBtnClass} bg-blue-500 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg`;
const actionBtnSecondaryClass = `${actionBtnClass} bg-gray-400 text-white hover:bg-gray-600 hover:-translate-y-0.5 hover:shadow-lg`;

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
      <div className={appClass}>
        <header className={appHeaderClass}>
          <div className={loadingSpinnerClass}>
            <h2 className={loadingTitleClass}>Loading...</h2>
            <p>Initializing ProjectHuman...</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className={appClass}>
      <header className={appHeaderClass}>
        <div className={headerContentClass}>
          <h1 className={headerTitleClass}>ProjectHuman</h1>
          <p className={subtitleClass}>{message}</p>
          {isAuthenticated && (
            <div className={userHeaderClass}>
              <Logout />
            </div>
          )}
        </div>
        <main className={mainContentClass}>
          {!isAuthenticated ? (
            <Login />
          ) : (
            <div className={dashboardClass}>
              <div className={welcomeSectionClass}>
                <h2 className={welcomeSectionH2Class}>Welcome back, {user?.username}! 👋</h2>
                <div className={userInfoClass}>
                  <p className={userInfoPClass}><strong>Email:</strong> {user?.email}</p>
                  <p className={userInfoPClass}><strong>Account created:</strong> {
                    user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : 'N/A'
                  }</p>
                  <p className={userInfoPClass}><strong>Status:</strong>
                    <span className={user?.is_active ? statusActiveClass : statusInactiveClass}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>

              {protectedData && (
                <div className={protectedSectionClass}>
                  <h3 className={protectedSectionH3Class}>Protected Content</h3>
                  <div className={protectedDataClass}>
                    <p>{protectedData.message}</p>
                    {protectedData.user && (
                      <div className={apiUserInfoClass}>
                        <h4 className={apiUserInfoH4Class}>API User Info:</h4>
                        <pre className={apiUserInfoPreClass}>{JSON.stringify(protectedData.user, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={actionsSectionClass}>
                <h3 className={actionsSectionH3Class}>Quick Actions</h3>
                <div className={actionButtonsClass}>
                  <button
                    className={actionBtnPrimaryClass}
                    onClick={() => window.location.reload()}
                  >
                    Refresh Data
                  </button>
                  <button
                    className={actionBtnSecondaryClass}
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
