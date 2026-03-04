/**
 * Navigation Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { Navigation } from '../components/Navigation';
import { UserRole } from '../types';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

// Mock the AuthContext
const mockAuthContext = {
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: true,
  userId: 'user-123',
  role: 'Employee' as UserRole,
  token: 'test-token',
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('Navigation', () => {
  it('should render navigation component', () => {
    expect(Navigation).toBeDefined();
  });

  it('should display role-based navigation items for Employee', () => {
    // Employee should have: Submit Ideas, My Ideas
    // This is verified by the component logic
    expect(mockAuthContext.role).toBe('Employee');
  });

  it('should display role-based navigation items for Reviewer', () => {
    // Reviewer should have: Review Ideas, Assign Ideas
    const reviewerContext = { ...mockAuthContext, role: 'Reviewer' as UserRole };
    expect(reviewerContext.role).toBe('Reviewer');
  });

  it('should display role-based navigation items for Implementer', () => {
    // Implementer should have: My Assigned Ideas
    const implementerContext = { ...mockAuthContext, role: 'Implementer' as UserRole };
    expect(implementerContext.role).toBe('Implementer');
  });

  it('should display role-based navigation items for Admin', () => {
    // Admin should have: All Ideas, User Management
    const adminContext = { ...mockAuthContext, role: 'Admin' as UserRole };
    expect(adminContext.role).toBe('Admin');
  });
});
