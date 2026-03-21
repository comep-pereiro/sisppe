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
    try {
      const storedToken = localStorage.getItem('comep_token');
      const storedUser = localStorage.getItem('comep_user');
      const storedUserType = localStorage.getItem('comep_user_type');

      if (storedToken && storedUser && storedUserType) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === 'object') {
          setToken(storedToken);
          setUser(parsedUser);
          setUserType(storedUserType);
        } else {
          // Invalid user data, clear storage
          localStorage.removeItem('comep_token');
          localStorage.removeItem('comep_user');
          localStorage.removeItem('comep_user_type');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error);
      // Clear potentially corrupted storage
      localStorage.removeItem('comep_token');
      localStorage.removeItem('comep_user');
      localStorage.removeItem('comep_user_type');
    }
    setLoading(false);
  }, []);

  const login = useCallback((accessToken, userData, type) => {
    if (!accessToken || !userData || !type) {
      console.error('Dados de login inválidos');
      return false;
    }
    
    setToken(accessToken);
    setUser(userData);
    setUserType(type);
    
    try {
      localStorage.setItem('comep_token', accessToken);
      localStorage.setItem('comep_user', JSON.stringify(userData));
      localStorage.setItem('comep_user_type', type);
    } catch (error) {
      console.error('Erro ao salvar dados de autenticação:', error);
    }
    
    return true;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setUserType(null);
    
    try {
      localStorage.removeItem('comep_token');
      localStorage.removeItem('comep_user');
      localStorage.removeItem('comep_user_type');
    } catch (error) {
      console.error('Erro ao remover dados de autenticação:', error);
    }
  }, []);

  const updateUser = useCallback((userData) => {
    if (!userData) return;
    
    setUser(userData);
    try {
      localStorage.setItem('comep_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
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
