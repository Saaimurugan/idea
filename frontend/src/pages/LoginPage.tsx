/**
 * Login Page
 * Displays the login form and handles navigation after successful login
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleLoginSuccess = () => {
    // Navigate to appropriate dashboard based on role
    switch (role) {
      case 'Employee':
        navigate('/employee');
        break;
      case 'Reviewer':
        navigate('/reviewer');
        break;
      case 'Implementer':
        navigate('/implementer');
        break;
      case 'Admin':
        navigate('/admin');
        break;
      default:
        navigate('/');
    }
  };

  return <LoginForm onLoginSuccess={handleLoginSuccess} />;
};
