import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { escolasAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  School, 
  LayoutDashboard, 
  LogOut,
  Menu,
  X,
  Search,
  Eye,
  ClipboardList,
  Shield,
  Filter
} from 'lucide-react';

// Admin Sidebar
const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/escolas', icon: School, label: 'Escolas' },
    { path: '/admin/solicitacoes', icon: ClipboardList, label: 'Solicitações' },
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

export default function EscolasLista() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [escolas, setEscolas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSituacao, setFilterSituacao] = useState('all');

  useEffect(() => {
    fetchEscolas();
  }, [filterSituacao]);

  const fetchEscolas = async () => {
    try {
      const situacao = filterSituacao === 'all' ? undefined : filterSituacao;
      const response = await escolasAPI.listar(situacao);
      setEscolas(response.data);
    } catch (error) {
      toast.error('Erro ao carregar escolas');
    } finally {
      setLoading(false);
    }
  };

  const filteredEscolas = escolas.filter(e => 
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.codigo_censo.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="escolas-lista">
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
                    Escolas
                  </h1>
                  <p className="text-sm text-slate-500">Gerencie as escolas da rede municipal</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome ou código de censo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-escola"
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={filterSituacao} onValueChange={setFilterSituacao}>
                  <SelectTrigger className="w-40" data-testid="filter-situacao">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ativa">Ativas</SelectItem>
                    <SelectItem value="inativa">Inativas</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredEscolas.length === 0 ? (
                  <div className="text-center py-12">
                    <School className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhuma escola encontrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código Censo</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead>Atualização</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEscolas.map((escola) => (
                        <TableRow key={escola.id} data-testid={`escola-row-${escola.id}`}>
                          <TableCell className="font-mono text-sm">{escola.codigo_censo}</TableCell>
                          <TableCell className="font-medium">{escola.nome}</TableCell>
                          <TableCell className="text-slate-600 max-w-xs truncate">
                            {escola.endereco}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              escola.situacao === 'ativa' ? 'bg-emerald-100 text-emerald-800' :
                              escola.situacao === 'inativa' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {escola.situacao === 'ativa' ? 'Ativa' :
                               escola.situacao === 'inativa' ? 'Inativa' : 'Em Análise'}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {new Date(escola.data_atualizacao).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/admin/escolas/${escola.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`btn-ver-${escola.id}`}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="mt-4 text-sm text-slate-500">
              Mostrando {filteredEscolas.length} de {escolas.length} escolas
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
