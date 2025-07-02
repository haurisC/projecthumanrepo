import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('projecthuman_token', token);
      // Optionally, update your auth context here
      navigate('/dashboard');
    } else {
      // Handle error - navigate to home page (which shows login)
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we complete your Google sign-in.</p>
      </div>
    </div>
  );
}

export default GoogleCallback;