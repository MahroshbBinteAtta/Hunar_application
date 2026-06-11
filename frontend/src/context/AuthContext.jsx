import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth as authApi } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Initialize and check token validity
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      const { access_token, role, user_id } = res.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Fetch user profile immediately
      const meRes = await authApi.getMe();
      setUser(meRes.data);
      return meRes.data;
    } catch (err) {
      throw err;
    }
  };

  const register = async (name, email, password, role, otp) => {
    try {
      const res = await authApi.register(name, email, password, role, otp);
      const { access_token } = res.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Fetch user profile immediately
      const meRes = await authApi.getMe();
      setUser(meRes.data);
      return meRes.data;
    } catch (err) {
      throw err;
    }
  };

  const loginWithToken = (customToken, customUser) => {
    localStorage.setItem('token', customToken);
    setToken(customToken);
    setUser(customUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
