import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Send,
  AlertTriangle,
  CheckCircle,
  Clock
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

export default function NotificacoesPage() {
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [escolasDesatualizadas, setEscolasDesatualizadas] = useState([]);
  const [historico, setHistorico] = useState([]);

  const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [desatualizadasRes, historicoRes] = await Promise.all([
        api.get('/notificacoes/escolas-desatualizadas'),
        api.get('/notificacoes/historico')
      ]);
      setEscolasDesatualizadas(desatualizadasRes.data.escolas || []);
      setHistorico(historicoRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarLembretes = async () => {
    if (!window.confirm('Deseja enviar lembretes de atualização para todas as escolas desatualizadas?')) {
      return;
    }

    setSending(true);
    try {
      const response = await api.post('/notificacoes/enviar-lembretes');
      toast.success(`${response.data.enviados} lembretes enviados com sucesso!`);
      if (response.data.erros > 0) {
        toast.warning(`${response.data.erros} emails não puderam ser enviados`);
      }
      fetchData();
    } catch (error) {
      toast.error('Erro ao enviar lembretes');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="notificacoes-page">
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
                    Notificações
                  </h1>
                  <p className="text-sm text-slate-500">Gerencie lembretes de atualização</p>
                </div>
              </div>
              <Button
                onClick={handleEnviarLembretes}
                disabled={sending || escolasDesatualizadas.length === 0}
                className="bg-teal-700 hover:bg-teal-800"
                data-testid="btn-enviar-lembretes"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Lembretes
                  </>
                )}
              </Button>
            </div>
          </header>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {/* Alert Card */}
                {escolasDesatualizadas.length > 0 && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-amber-900">Escolas com Dados Desatualizados</h3>
                        <p className="text-sm text-amber-700">
                          {escolasDesatualizadas.length} escola(s) não atualizam seus dados há mais de 90 dias.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Outdated Schools */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-600" />
                      Escolas Desatualizadas (+ de 90 dias)
                    </CardTitle>
                    <CardDescription>
                      Lista de escolas que precisam atualizar seus dados no sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {escolasDesatualizadas.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">Todas as escolas estão atualizadas!</p>
                        <p className="text-slate-400 text-sm">Nenhuma escola com dados desatualizados</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Escola</TableHead>
                            <TableHead>Código Censo</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Dias sem Atualizar</TableHead>
                            <TableHead>Última Atualização</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {escolasDesatualizadas.map((escola) => (
                            <TableRow key={escola.id}>
                              <TableCell className="font-medium">{escola.nome}</TableCell>
                              <TableCell>{escola.codigo_censo}</TableCell>
                              <TableCell>{escola.email || '-'}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  escola.dias_sem_atualizar > 180 ? 'bg-red-100 text-red-800' :
                                  escola.dias_sem_atualizar > 120 ? 'bg-amber-100 text-amber-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {escola.dias_sem_atualizar} dias
                                </span>
                              </TableCell>
                              <TableCell className="text-slate-500">
                                {new Date(escola.data_atualizacao).toLocaleDateString('pt-BR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Notification History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" />
                      Histórico de Notificações
                    </CardTitle>
                    <CardDescription>
                      Últimos lembretes enviados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {historico.length === 0 ? (
                      <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhuma notificação enviada ainda</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Escola</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historico.slice(0, 20).map((notif, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-slate-500">
                                {new Date(notif.data_envio).toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell className="font-medium">{notif.escola_nome}</TableCell>
                              <TableCell>{notif.email}</TableCell>
                              <TableCell>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  Lembrete de Atualização
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs">
                                  Enviado
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
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
