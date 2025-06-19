import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error
    clearError();
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Registration-specific validations
    if (!isLoginMode) {
      if (!formData.username) {
        errors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let result;
      
      if (isLoginMode) {
        result = await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        result = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
      }

      if (result.success) {
        console.log(isLoginMode ? 'Login successful' : 'Registration successful');
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Toggle between login and register modes
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({
      email: '',
      password: '',
      username: '',
      confirmPassword: ''
    });
    setFormErrors({});
    clearError();
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#e74c3c'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    marginTop: '10px'
  };

  const toggleButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline'
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2>{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
        <p style={{ color: '#666' }}>
          {isLoginMode 
            ? 'Sign in to your ProjectHuman account' 
            : 'Join ProjectHuman today'
          }
        </p>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isLoginMode && (
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              style={formErrors.username ? errorInputStyle : inputStyle}
              placeholder="Enter your username"
              disabled={isLoading}
            />
            {formErrors.username && (
              <span style={{ color: '#e74c3c', fontSize: '12px' }}>
                {formErrors.username}
              </span>
            )}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            style={formErrors.email ? errorInputStyle : inputStyle}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {formErrors.email && (
            <span style={{ color: '#e74c3c', fontSize: '12px' }}>
              {formErrors.email}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={formErrors.password ? errorInputStyle : inputStyle}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              disabled={isLoading}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {formErrors.password && (
            <span style={{ color: '#e74c3c', fontSize: '12px' }}>
              {formErrors.password}
            </span>
          )}
        </div>

        {!isLoginMode && (
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={formErrors.confirmPassword ? errorInputStyle : inputStyle}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {formErrors.confirmPassword && (
              <span style={{ color: '#e74c3c', fontSize: '12px' }}>
                {formErrors.confirmPassword}
              </span>
            )}
          </div>
        )}

        <button type="submit" style={buttonStyle} disabled={isLoading}>
          {isLoading 
            ? (isLoginMode ? 'Signing In...' : 'Creating Account...') 
            : (isLoginMode ? 'Sign In' : 'Create Account')
          }
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ color: '#666' }}>
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            style={toggleButtonStyle}
            onClick={toggleMode}
            disabled={isLoading}
          >
            {isLoginMode ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      {isLoginMode && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <strong>Demo credentials:</strong><br />
            Email: demo@projecthuman.com<br />
            Password: demo123
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
