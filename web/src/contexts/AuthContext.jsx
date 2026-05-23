import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/apiClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated on mount
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setUserRole(user.role);
      setIsAuthenticated(true);
    }
    setInitialLoading(false);
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password, role });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setCurrentUser(user);
      setUserRole(user.role);
      setIsAuthenticated(true);
      
      return { success: true, role: user.role };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Invalid email or password');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    isAuthenticated,
    initialLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
