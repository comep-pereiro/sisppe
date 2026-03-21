import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos de timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('comep_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Handle auth errors and network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Erro de timeout
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout na requisição');
      error.message = 'A requisição demorou muito. Verifique sua conexão.';
    }
    
    // Erro de rede
    if (!error.response) {
      console.error('Erro de rede:', error.message);
      error.message = 'Erro de conexão com o servidor. Verifique sua internet.';
      return Promise.reject(error);
    }
    
    // Erro de autenticação
    if (error.response?.status === 401) {
      localStorage.removeItem('comep_token');
      localStorage.removeItem('comep_user');
      localStorage.removeItem('comep_user_type');
      // Só redireciona se não estiver na página de login
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    // Erro de permissão (escola bloqueada)
    if (error.response?.status === 403) {
      console.warn('Acesso negado:', error.response.data?.detail);
    }
    
    // Erro de validação
    if (error.response?.status === 422) {
      console.error('Erro de validação:', error.response.data?.detail);
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  loginEscola: (data) => api.post('/auth/escola/login', data),
  loginAdmin: (data) => api.post('/auth/admin/login', data),
  recuperarSenha: (data) => api.post('/auth/recuperar-senha', data),
};

// Escolas APIs
export const escolasAPI = {
  listar: (situacao) => api.get('/escolas', { params: { situacao } }),
  getById: (id) => api.get(`/escolas/${id}`),
  getMinhaEscola: () => api.get('/escolas/me'),
  atualizar: (data) => api.put('/escolas/me', data),
  atualizarSituacao: (id, situacao) => api.put(`/escolas/${id}/situacao`, null, { params: { situacao } }),
  bloquear: (id, motivo) => api.put(`/escolas/${id}/bloquear`, { motivo }),
  desbloquear: (id, parecer) => api.put(`/escolas/${id}/desbloquear`, null, { params: { parecer } }),
  listarUsuarios: (id) => api.get(`/escolas/${id}/usuarios`),
};

// Solicitações APIs
export const solicitacoesAPI = {
  criar: (data) => api.post('/solicitacoes', data),
  listar: (status) => api.get('/solicitacoes', { params: { status } }),
  aprovar: (id, senhaInicial) => api.put(`/solicitacoes/${id}/aprovar`, null, { params: { senha_inicial: senhaInicial } }),
  rejeitar: (id, observacao) => api.put(`/solicitacoes/${id}/rejeitar`, null, { params: { observacao } }),
};

// Docentes APIs
export const docentesAPI = {
  criar: (data) => api.post('/docentes', data),
  listar: (escolaId) => api.get('/docentes', { params: { escola_id: escolaId } }),
  atualizar: (id, data) => api.put(`/docentes/${id}`, data),
  remover: (id) => api.delete(`/docentes/${id}`),
};

// Quadro Administrativo APIs
export const quadroAdminAPI = {
  criar: (data) => api.post('/quadro-admin', data),
  listar: (escolaId) => api.get('/quadro-admin', { params: { escola_id: escolaId } }),
  atualizar: (id, data) => api.put(`/quadro-admin/${id}`, data),
  remover: (id) => api.delete(`/quadro-admin/${id}`),
};

// Dashboard APIs
export const dashboardAPI = {
  getAdminStats: () => api.get('/dashboard/stats'),
  getEscolaStats: () => api.get('/dashboard/escola/stats'),
};

// Admins APIs
export const adminsAPI = {
  criar: (data) => api.post('/admins', data),
  listar: () => api.get('/admins'),
};

// Seed API (for testing)
export const seedAPI = {
  seed: () => api.post('/seed'),
};

export default api;
