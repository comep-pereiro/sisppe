import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { escolasAPI, dashboardAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  School, 
  Users, 
  GraduationCap, 
  FileText, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2
} from 'lucide-react';

// Sidebar Component
const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/escola/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/escola/docentes', icon: GraduationCap, label: 'Corpo Docente' },
    { path: '/escola/quadro-administrativo', icon: Users, label: 'Quadro Administrativo' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logout realizado com sucesso');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <School className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Manrope' }}>COMEP</h1>
                <p className="text-xs text-slate-400">Área da Escola</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* School Info */}
        <div className="p-4 border-b border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-slate-400">Escola</p>
            <p className="text-white font-medium truncate" data-testid="escola-nome">
              {user?.nome || 'Carregando...'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-teal-700 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            data-testid="btn-logout"
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

// Stats Card Component
const StatCard = ({ icon: Icon, label, value, color = 'teal' }) => {
  const colorClasses = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
              {value}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardEscola() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [escola, setEscola] = useState(null);
  const [stats, setStats] = useState({ total_docentes: 0, total_quadro_admin: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [escolaRes, statsRes] = await Promise.all([
          escolasAPI.getMinhaEscola(),
          dashboardAPI.getEscolaStats()
        ]);
        setEscola(escolaRes.data);
        setStats(statsRes.data);
      } catch (error) {
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dashboard-escola">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  data-testid="btn-menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
                    Dashboard
                  </h1>
                  <p className="text-sm text-slate-500">Visão geral da escola</p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {/* Welcome */}
                <Card className="bg-gradient-to-r from-teal-700 to-teal-600">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-white">
                        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>
                          Bem-vindo(a)!
                        </h2>
                        <p className="text-teal-100">{escola?.nome}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    icon={GraduationCap} 
                    label="Corpo Docente" 
                    value={stats.total_docentes}
                    color="teal"
                  />
                  <StatCard 
                    icon={Users} 
                    label="Quadro Administrativo" 
                    value={stats.total_quadro_admin}
                    color="blue"
                  />
                  <StatCard 
                    icon={FileText} 
                    label="Código Censo" 
                    value={escola?.codigo_censo || '-'}
                    color="amber"
                  />
                  <div className="md:col-span-1">
                    <Card className="card-hover h-full">
                      <CardContent className="p-6 flex flex-col justify-center h-full">
                        <p className="text-sm text-slate-500 mb-1">Situação</p>
                        <span className={`
                          inline-flex items-center self-start px-3 py-1 rounded-full text-sm font-medium
                          ${escola?.situacao === 'ativa' ? 'bg-emerald-100 text-emerald-800' : ''}
                          ${escola?.situacao === 'inativa' ? 'bg-red-100 text-red-800' : ''}
                          ${escola?.situacao === 'em_analise' ? 'bg-amber-100 text-amber-800' : ''}
                        `}>
                          {escola?.situacao === 'ativa' ? 'Ativa' : ''}
                          {escola?.situacao === 'inativa' ? 'Inativa' : ''}
                          {escola?.situacao === 'em_analise' ? 'Em Análise' : ''}
                        </span>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-teal-600" />
                        Corpo Docente
                      </CardTitle>
                      <CardDescription>
                        Gerencie os professores da sua escola
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/escola/docentes">
                        <Button 
                          variant="outline" 
                          className="w-full justify-between group"
                          data-testid="btn-ir-docentes"
                        >
                          Gerenciar Docentes
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Quadro Administrativo
                      </CardTitle>
                      <CardDescription>
                        Gerencie diretores, secretários e coordenadores
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/escola/quadro-administrativo">
                        <Button 
                          variant="outline" 
                          className="w-full justify-between group"
                          data-testid="btn-ir-quadro-admin"
                        >
                          Gerenciar Quadro
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                {/* School Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dados da Escola</CardTitle>
                    <CardDescription>Informações cadastradas no sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Endereço</p>
                        <p className="text-slate-900">{escola?.endereco || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Telefone</p>
                        <p className="text-slate-900">{escola?.telefone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Email</p>
                        <p className="text-slate-900">{escola?.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Modalidades</p>
                        <div className="flex flex-wrap gap-2">
                          {escola?.modalidades?.length > 0 ? (
                            escola.modalidades.map((mod, idx) => (
                              <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                                {mod}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">Não informado</span>
                          )}
                        </div>
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
