import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// Pages
import LoginEscola from "@/pages/LoginEscola";
import LoginAdmin from "@/pages/LoginAdmin";
import CadastroSolicitacao from "@/pages/CadastroSolicitacao";
import RecuperarSenha from "@/pages/RecuperarSenha";
import DashboardEscola from "@/pages/DashboardEscola";
import DashboardAdmin from "@/pages/DashboardAdmin";
import GestaoDocentes from "@/pages/GestaoDocentes";
import GestaoQuadroAdmin from "@/pages/GestaoQuadroAdmin";
import EscolasLista from "@/pages/EscolasLista";
import EscolaDetalhes from "@/pages/EscolaDetalhes";
import SolicitacoesLista from "@/pages/SolicitacoesLista";
import RelatoriosPage from "@/pages/RelatoriosPage";
import NotificacoesPage from "@/pages/NotificacoesPage";
import FichaEscolar from "@/pages/FichaEscolar";
import DependenciasFisicas from "@/pages/DependenciasFisicas";
import MobiliarioEquipamento from "@/pages/MobiliarioEquipamento";
import Professores from "@/pages/Professores";

// Context
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Protected Route Components
const ProtectedEscolaRoute = ({ children }) => {
  const { user, userType, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user || userType !== 'escola') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  const { user, userType, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user || userType !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-600">Carregando...</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LoginEscola />} />
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route path="/cadastro" element={<CadastroSolicitacao />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />
      
      {/* Escola Routes */}
      <Route path="/escola/dashboard" element={
        <ProtectedEscolaRoute>
          <DashboardEscola />
        </ProtectedEscolaRoute>
      } />
      <Route path="/escola/docentes" element={
        <ProtectedEscolaRoute>
          <GestaoDocentes />
        </ProtectedEscolaRoute>
      } />
      <Route path="/escola/quadro-administrativo" element={
        <ProtectedEscolaRoute>
          <GestaoQuadroAdmin />
        </ProtectedEscolaRoute>
      } />
      <Route path="/escola/ficha-escolar" element={
        <ProtectedEscolaRoute>
          <FichaEscolar />
        </ProtectedEscolaRoute>
      } />
      <Route path="/escola/dependencias" element={
        <ProtectedEscolaRoute>
          <DependenciasFisicas />
        </ProtectedEscolaRoute>
      } />
      <Route path="/escola/mobiliario" element={
        <ProtectedEscolaRoute>
          <MobiliarioEquipamento />
        </ProtectedEscolaRoute>
      } />
      <Route path="/escola/professores" element={
        <ProtectedEscolaRoute>
          <Professores />
        </ProtectedEscolaRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedAdminRoute>
          <DashboardAdmin />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/escolas" element={
        <ProtectedAdminRoute>
          <EscolasLista />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/escolas/:escolaId" element={
        <ProtectedAdminRoute>
          <EscolaDetalhes />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/solicitacoes" element={
        <ProtectedAdminRoute>
          <SolicitacoesLista />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/relatorios" element={
        <ProtectedAdminRoute>
          <RelatoriosPage />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/notificacoes" element={
        <ProtectedAdminRoute>
          <NotificacoesPage />
        </ProtectedAdminRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
