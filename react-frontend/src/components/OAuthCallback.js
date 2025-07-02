import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken, clearError, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing authentication...');
  const [hasProcessed, setHasProcessed] = useState(false); // Prevent multiple executions

  useEffect(() => {
    const processOAuthCallback = async () => {
      if (hasProcessed) {
        console.log('[OAuthCallback] Already processed, skipping...');
        return;
      }

      // If already authenticated, redirect to dashboard
      if (isAuthenticated) {
        console.log('[OAuthCallback] Already authenticated, redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
        return;
      }

      // Check if we already have a token in storage
      const existingToken = localStorage.getItem('projecthuman_token');
      if (existingToken) {
        console.log('[OAuthCallback] Token already exists, redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
        return;
      }

      setHasProcessed(true);
      
      try {
        // Clear any previous errors if the function is available
        if (clearError && typeof clearError === 'function') {
          clearError();
        }
        
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');
        const errorMessage = urlParams.get('message');

        if (error) {
          setStatus('error');
          setMessage(errorMessage || 'Authentication failed');
          setTimeout(() => navigate('/', { replace: true }), 3000);
          return;
        }

        if (token) {
          setStatus('processing');
          setMessage('Completing authentication...');
          
          // Use the OAuth login function from AuthContext
          const result = await loginWithToken(token);
          
          if (result.success) {
            setStatus('success');
            setMessage('Authentication successful! Redirecting to dashboard...');
            setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
          } else {
            setStatus('error');
            setMessage(result.error || 'Failed to complete authentication');
            setTimeout(() => navigate('/', { replace: true }), 3000);
          }
        } else {
          setStatus('error');
          setMessage('No authentication token received');
          setTimeout(() => navigate('/', { replace: true }), 3000);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred');
        setTimeout(() => navigate('/', { replace: true }), 3000);
      }
    };

    processOAuthCallback();
  }, []); // Remove dependencies to prevent re-execution

  const getStatusEmoji = () => {
    switch (status) {
      case 'processing':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return '#3498db';
      case 'success':
        return '#27ae60';
      case 'error':
        return '#e74c3c';
      default:
        return '#3498db';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          {getStatusEmoji()}
        </div>
        
        <h2 style={{
          color: getStatusColor(),
          marginBottom: '15px',
          fontSize: '24px'
        }}>
          {status === 'processing' && 'Processing...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Failed'}
        </h2>
        
        <p style={{
          color: '#666',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>
        
        {status === 'processing' && (
          <div style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}
        
        {status === 'error' && (
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
      
      {/* Add CSS animation for spinner */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
};

export default OAuthCallback;
