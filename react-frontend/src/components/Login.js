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

  const inputStyle = "w-full px-3 py-2 mt-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const errorInputStyle = inputStyle + " border-red-500";

  const buttonStyle = `w-full py-3 bg-blue-600 text-white rounded text-base mt-2 
  hover:bg-blue-700 transition ${
    isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  }`;

  const toggleButtonStyle = "bg-transparent border-none text-blue-600 cursor-pointer underline p-0";

  return (
  <div className="max-w-md mx-auto my-12 p-5 bg-white rounded shadow">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-semibold">
        {isLoginMode ? 'Welcome Back' : 'Create Account'}
      </h2>
      <p className="text-gray-600">
        {isLoginMode
          ? 'Sign in to your ProjectHuman account'
          : 'Join ProjectHuman today'
        }
      </p>
    </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-2.5 rounded mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isLoginMode && (
          <div className="mb-4">
            <label htmlFor="username" className="block font-medium">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={formErrors.username ? errorInputStyle : inputStyle}
              placeholder="Enter your username"
              disabled={isLoading}
            />
            {formErrors.username && (
              <span className="text-red-500 text-xs">
                {formErrors.username}
              </span>
            )}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block font-medium">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={formErrors.email ? errorInputStyle : inputStyle}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {formErrors.email && (
            <span className="text-red-500 text-xs">
              {formErrors.email}
            </span>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={formErrors.password ? errorInputStyle : inputStyle}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-blue-600 text-xs"
              disabled={isLoading}
            >
              {showPassword ? 'Show' : 'Hide'}
            </button>
          </div>
          {formErrors.password && (
            <span className="text-red-500 text-xs">
              {formErrors.password}
            </span>
          )}
        </div>

        {!isLoginMode && (
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block font-medium">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={formErrors.confirmPassword ? errorInputStyle : inputStyle}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {formErrors.confirmPassword && (
              <span className="text-red-500 text-xs">
                {formErrors.confirmPassword}
              </span>
            )}
          </div>
        )}

        <button type="submit" className={buttonStyle} disabled={isLoading}>
          {isLoading 
            ? (isLoginMode ? 'Signing In...' : 'Creating Account...') 
            : (isLoginMode ? 'Sign In' : 'Create Account')
          }
        </button>
      </form>

      <div className="text-center mt-5">
        <p className="text-gray-600">
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className={toggleButtonStyle}
            onClick={toggleMode}
            disabled={isLoading}
          >
            {isLoginMode ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      {isLoginMode && (
        <div className="mt-5 p-4 bg-gray-100 rounded">
          <div className="text-sm text-gray-600">
            <strong>demo credentials:</strong><br />
            Email: test@test.com<br />
            Password: test123
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
