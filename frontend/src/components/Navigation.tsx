/**
 * Role-based Navigation Component
 * Displays navigation options based on user role
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavItem {
  label: string;
  path: string;
}

const getNavItemsForRole = (role: UserRole | null): NavItem[] => {
  if (!role) return [];

  switch (role) {
    case 'Employee':
      return [
        { label: 'Submit Ideas', path: '/employee/submit' },
        { label: 'My Ideas', path: '/employee/ideas' },
      ];
    case 'Reviewer':
      return [
        { label: 'Review Ideas', path: '/reviewer/review' },
        { label: 'Assign Ideas', path: '/reviewer/assign' },
      ];
    case 'Implementer':
      return [
        { label: 'My Assigned Ideas', path: '/implementer/assigned' },
      ];
    case 'Admin':
      return [
        { label: 'All Ideas', path: '/admin/ideas' },
        { label: 'User Management', path: '/admin/users' },
      ];
    default:
      return [];
  }
};

export const Navigation: React.FC = () => {
  const { role, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return null;
  }

  const navItems = getNavItemsForRole(role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.brand}>
          <img 
            src="/mps-logo.png" 
            alt="MPS Logo" 
            style={styles.logo}
          />
          <h1 style={styles.brandText}>Ideas Management</h1>
          {role && <span style={styles.roleTag}>{role}</span>}
        </div>

        <div style={styles.navItems}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={styles.navLink}
            >
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '60px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    height: '35px',
    width: 'auto',
    objectFit: 'contain' as const,
    display: 'block',
  },
  brandText: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold' as const,
  },
  roleTag: {
    backgroundColor: '#34495e',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500' as const,
  },
  navItems: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500' as const,
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};
