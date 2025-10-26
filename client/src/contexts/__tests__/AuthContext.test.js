import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout, register, forgotPassword } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      
      <button 
        data-testid="login-button"
        onClick={() => login({ email: 'test@example.com', password: 'password123' })}
      >
        Login
      </button>
      
      <button 
        data-testid="register-button"
        onClick={() => register({ 
          name: 'Test User', 
          email: 'test@example.com', 
          password: 'password123',
          department: 'Testing'
        })}
      >
        Register
      </button>
      
      <button 
        data-testid="forgot-password-button"
        onClick={() => forgotPassword('test@example.com')}
      >
        Forgot Password
      </button>
      
      <button 
        data-testid="logout-button"
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
  });
  
  test('should start with not authenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
  });
  
  test('should authenticate user on successful login', async () => {
    // Mock successful login response
    axios.post.mockResolvedValueOnce({
      data: {
        token: 'fake-token',
        user: { id: '123', email: 'test@example.com', name: 'Test User' }
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // User email should be displayed
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    
    // Check that axios was called with correct parameters
    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
  });
  
  test('should register a new user', async () => {
    // Mock successful registration response
    axios.post.mockResolvedValueOnce({
      data: { message: 'Registration successful' }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click register button
    fireEvent.click(screen.getByTestId('register-button'));
    
    // Wait for registration to complete
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        department: 'Testing'
      });
    });
  });
  
  test('should handle forgot password request', async () => {
    // Mock successful forgot password response
    axios.post.mockResolvedValueOnce({
      data: { message: 'Password reset email sent' }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click forgot password button
    fireEvent.click(screen.getByTestId('forgot-password-button'));
    
    // Wait for forgot password request to complete
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'test@example.com'
      });
    });
  });
  
  test('should logout user', async () => {
    // Setup authenticated state first
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: '123', email: 'test@example.com' }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should start authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Click logout button
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Should be logged out
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    
    // LocalStorage should be cleared
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});