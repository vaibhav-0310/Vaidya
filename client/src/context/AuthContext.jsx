
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; 

const AuthContext = createContext(null);

axios.defaults.withCredentials = true; 

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth-status'); 
      const data = response.data; 
      if (data.isAuthenticated) {
        setIsAuthenticated(true);
        setUser(data.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/login', { username, password }); 
      const data = response.data;

      if (response.status === 200 && data.success) { 
        await checkAuthStatus(); 
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsAuthenticated(false);
      setUser(null);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message); 
      }
      throw new Error('An unexpected error occurred during login.'); 
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/logout');
      if (response.status === 200) { 
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};