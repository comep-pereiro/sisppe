import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  School, 
  LayoutDashboard, 
  LogOut,
  Menu,
  X,
  ClipboardList,
  Shield,
  Bell,
  FileText,
  Download,
  Building2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Admin Sidebar
const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/escolas', icon: School, label: 'Escolas' },
    { path: '/admin/solicitacoes', icon: ClipboardList, label: 'Solicitações' },
    { path: '/admin/relatorios', icon: FileText, label: 'Relatórios' },
    { path: '/admin/notificacoes', icon: Bell, label: 'Notificações' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    toast.success('Logout realizado com sucesso');
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Manrope' }}>COMEP</h1>
                <p className="text-xs text-slate-400">Administração</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-slate-400">Administrador</p>
            <p className="text-white font-medium truncate">{user?.nome || 'Carregando...'}</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive ? 'bg-teal-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default function RelatoriosPage() {
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [escolas, setEscolas] = useState([]);
  const [selectedEscola, setSelectedEscola] = useState('');

  const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchEscolas();
  }, []);

  const fetchEscolas = async () => {
    try {
      const response = await api.get('/escolas');
      setEscolas(response.data);
    } catch (error) {
      toast.error('Erro ao carregar escolas');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (type, escolaId = null) => {
    setDownloading(type);
    try {
      const url = escolaId 
        ? `/relatorios/escola/${escolaId}/pdf`
        : '/relatorios/escolas/pdf';
      
      const response = await api.get(url, { responseType: 'blob' });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const filename = escolaId 
        ? `relatorio_escola_${new Date().toISOString().split('T')[0]}.pdf`
        : `relatorio_geral_${new Date().toISOString().split('T')[0]}.pdf`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Relatório baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="relatorios-page">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 min-h-screen">
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
                    Relatórios
                  </h1>
                  <p className="text-sm text-slate-500">Gere relatórios em PDF</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {/* General Report */}
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" />
                      Relatório Geral das Escolas
                    </CardTitle>
                    <CardDescription>
                      Relatório completo com estatísticas e lista de todas as escolas da rede municipal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        <p>Inclui: Resumo estatístico, lista de escolas, situação de cada unidade</p>
                      </div>
                      <Button
                        onClick={() => downloadPDF('geral')}
                        disabled={downloading === 'geral'}
                        className="bg-teal-700 hover:bg-teal-800"
                        data-testid="btn-download-geral"
                      >
                        {downloading === 'geral' ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Gerando...
                          </span>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Baixar PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Individual School Report */}
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      Relatório Individual de Escola
                    </CardTitle>
                    <CardDescription>
                      Relatório detalhado de uma escola específica com corpo docente e quadro administrativo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Select value={selectedEscola} onValueChange={setSelectedEscola}>
                          <SelectTrigger data-testid="select-escola">
                            <SelectValue placeholder="Selecione uma escola" />
                          </SelectTrigger>
                          <SelectContent>
                            {escolas.map((escola) => (
                              <SelectItem key={escola.id} value={escola.id}>
                                {escola.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => downloadPDF('escola', selectedEscola)}
                        disabled={!selectedEscola || downloading === 'escola'}
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="btn-download-escola"
                      >
                        {downloading === 'escola' ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Gerando...
                          </span>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Baixar PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-slate-50 border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-1">Sobre os Relatórios</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Os relatórios são gerados em formato PDF e incluem todas as informações cadastradas no sistema.
                          Ideal para apresentações em reuniões do conselho, prestação de contas e arquivamento.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
