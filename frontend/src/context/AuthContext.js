import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load auth state from localStorage on mount
    const storedToken = localStorage.getItem('comep_token');
    const storedUser = localStorage.getItem('comep_user');
    const storedUserType = localStorage.getItem('comep_user_type');

    if (storedToken && storedUser && storedUserType) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setUserType(storedUserType);
    }
    setLoading(false);
  }, []);

  const login = useCallback((accessToken, userData, type) => {
    setToken(accessToken);
    setUser(userData);
    setUserType(type);
    
    localStorage.setItem('comep_token', accessToken);
    localStorage.setItem('comep_user', JSON.stringify(userData));
    localStorage.setItem('comep_user_type', type);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setUserType(null);
    
    localStorage.removeItem('comep_token');
    localStorage.removeItem('comep_user');
    localStorage.removeItem('comep_user_type');
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('comep_user', JSON.stringify(userData));
  }, []);

  const value = {
    user,
    token,
    userType,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
    isEscola: userType === 'escola',
    isAdmin: userType === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
