import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { dashboardAPI, seedAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import axios from 'axios';
import { 
  School, 
  Users, 
  GraduationCap, 
  FileText, 
  LayoutDashboard, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Bell,
  TrendingUp
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Sidebar Component
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
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
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
            <button 
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-slate-400">Administrador</p>
            <p className="text-white font-medium truncate" data-testid="admin-nome">
              {user?.nome || 'Carregando...'}
            </p>
            <p className="text-xs text-slate-500">{user?.cargo}</p>
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
                data-testid={`nav-${item.label.toLowerCase()}`}
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            data-testid="btn-logout-admin"
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

// Stats Card
const StatCard = ({ icon: Icon, label, value, color = 'teal', trend }) => {
  const colorClasses = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
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
            {trend && (
              <p className={`text-xs mt-1 ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}% este mês
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardAdmin() {
  const { user, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [evolucao, setEvolucao] = useState(null);
  const [loading, setLoading] = useState(true);

  const CHART_COLORS = ['#0F766E', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First try to seed the database
        try {
          await seedAPI.seed();
        } catch (e) {
          // Ignore if already seeded
        }
        
        const response = await dashboardAPI.getAdminStats();
        setStats(response.data);

        // Fetch evolution data
        try {
          const api = axios.create({
            baseURL: `${BACKEND_URL}/api`,
            headers: { Authorization: `Bearer ${token}` }
          });
          const evolucaoRes = await api.get('/dashboard/evolucao');
          setEvolucao(evolucaoRes.data);
        } catch (e) {
          console.error('Error fetching evolution data:', e);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dashboard-admin">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 min-h-screen">
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  data-testid="btn-menu-admin"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
                    Painel Administrativo
                  </h1>
                  <p className="text-sm text-slate-500">Visão geral do sistema</p>
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
                {/* Welcome */}
                <Card className="bg-gradient-to-r from-slate-800 to-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-white">
                        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>
                          Olá, {user?.nome?.split(' ')[0]}!
                        </h2>
                        <p className="text-slate-300">Conselho Municipal de Educação de Pereiro</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <StatCard 
                    icon={School} 
                    label="Total de Escolas" 
                    value={stats?.total_escolas || 0}
                    color="teal"
                  />
                  <StatCard 
                    icon={CheckCircle} 
                    label="Escolas Ativas" 
                    value={stats?.escolas_ativas || 0}
                    color="emerald"
                  />
                  <StatCard 
                    icon={Clock} 
                    label="Em Análise" 
                    value={stats?.escolas_em_analise || 0}
                    color="amber"
                  />
                  <StatCard 
                    icon={GraduationCap} 
                    label="Docentes" 
                    value={stats?.total_docentes || 0}
                    color="blue"
                  />
                  <StatCard 
                    icon={Users} 
                    label="Alunos (est.)" 
                    value={stats?.total_alunos_estimado || 0}
                    color="teal"
                  />
                  <StatCard 
                    icon={AlertTriangle} 
                    label="Pendentes" 
                    value={stats?.solicitacoes_pendentes || 0}
                    color={stats?.solicitacoes_pendentes > 0 ? 'red' : 'emerald'}
                  />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <School className="w-5 h-5 text-teal-600" />
                        Escolas
                      </CardTitle>
                      <CardDescription>
                        Gerencie as escolas da rede municipal
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/admin/escolas">
                        <Button 
                          variant="outline" 
                          className="w-full justify-between group"
                          data-testid="btn-ir-escolas"
                        >
                          Ver Escolas
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-amber-600" />
                        Solicitações
                      </CardTitle>
                      <CardDescription>
                        Analise solicitações de cadastro
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/admin/solicitacoes">
                        <Button 
                          variant="outline" 
                          className="w-full justify-between group"
                          data-testid="btn-ir-solicitacoes"
                        >
                          {stats?.solicitacoes_pendentes > 0 && (
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              {stats.solicitacoes_pendentes} pendente(s)
                            </span>
                          )}
                          {!stats?.solicitacoes_pendentes && 'Ver Solicitações'}
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Relatórios
                      </CardTitle>
                      <CardDescription>
                        Gere relatórios do sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/admin/relatorios">
                        <Button 
                          variant="outline" 
                          className="w-full justify-between group"
                          data-testid="btn-relatorios"
                        >
                          Gerar Relatórios
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                {evolucao && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Evolution Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-teal-600" />
                          Evolução Mensal
                        </CardTitle>
                        <CardDescription>
                          Crescimento de escolas e docentes nos últimos 6 meses
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={evolucao.evolucao_mensal}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                              <YAxis stroke="#64748b" fontSize={12} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#fff', 
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px'
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="escolas" 
                                stroke="#0F766E" 
                                strokeWidth={2}
                                dot={{ fill: '#0F766E', strokeWidth: 2 }}
                                name="Escolas"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="docentes" 
                                stroke="#3B82F6" 
                                strokeWidth={2}
                                dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                                name="Docentes"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Distribution Charts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          Distribuição de Vínculos
                        </CardTitle>
                        <CardDescription>
                          Tipo de vínculo dos docentes
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          {evolucao.distribuicao_vinculos?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={evolucao.distribuicao_vinculos}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                  label={({ name, value }) => `${name}: ${value}`}
                                >
                                  {evolucao.distribuicao_vinculos.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                              Sem dados disponíveis
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Info Card */}
                <Card className="bg-teal-50 border-teal-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-teal-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-teal-900 mb-1" style={{ fontFamily: 'Manrope' }}>
                          Sistema de Monitoramento
                        </h3>
                        <p className="text-sm text-teal-700 leading-relaxed">
                          O COMEP permite o acompanhamento das escolas da rede municipal de Pereiro, 
                          incluindo dados do corpo docente, quadro administrativo e situação de regularização.
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
