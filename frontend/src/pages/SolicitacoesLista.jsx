import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { solicitacoesAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  School, 
  LayoutDashboard, 
  LogOut,
  Menu,
  X,
  Search,
  ClipboardList,
  Shield,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye
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
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Manrope' }}>SISPPe</h1>
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

export default function SolicitacoesLista() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [senhaInicial, setSenhaInicial] = useState('');
  const [observacao, setObservacao] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSolicitacoes();
  }, [filterStatus]);

  const fetchSolicitacoes = async () => {
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const response = await solicitacoesAPI.listar(status);
      setSolicitacoes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async () => {
    if (!senhaInicial || senhaInicial.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setProcessing(true);
    try {
      await solicitacoesAPI.aprovar(selectedSolicitacao.id, senhaInicial);
      toast.success('Solicitação aprovada! Escola cadastrada com sucesso.');
      setShowApproveModal(false);
      setSenhaInicial('');
      fetchSolicitacoes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao aprovar solicitação');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejeitar = async () => {
    if (!observacao.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    setProcessing(true);
    try {
      await solicitacoesAPI.rejeitar(selectedSolicitacao.id, observacao);
      toast.success('Solicitação rejeitada');
      setShowRejectModal(false);
      setObservacao('');
      fetchSolicitacoes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao rejeitar solicitação');
    } finally {
      setProcessing(false);
    }
  };

  const filteredSolicitacoes = solicitacoes.filter(s => 
    s.nome_escola.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.codigo_censo.includes(searchTerm) ||
    s.nome_responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const config = {
      pendente: { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock, label: 'Pendente' },
      aprovada: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle, label: 'Aprovada' },
      rejeitada: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejeitada' },
    };
    const { bg, text, icon: Icon, label } = config[status] || config.pendente;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="solicitacoes-lista">
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
                    Solicitações de Cadastro
                  </h1>
                  <p className="text-sm text-slate-500">Analise e aprove novas escolas</p>
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
                  placeholder="Buscar por escola, código ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-solicitacao"
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40" data-testid="filter-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="aprovada">Aprovadas</SelectItem>
                    <SelectItem value="rejeitada">Rejeitadas</SelectItem>
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
                ) : filteredSolicitacoes.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhuma solicitação encontrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código Censo</TableHead>
                        <TableHead>Escola</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSolicitacoes.map((solicitacao) => (
                        <TableRow key={solicitacao.id} data-testid={`solicitacao-row-${solicitacao.id}`}>
                          <TableCell className="font-mono text-sm">{solicitacao.codigo_censo}</TableCell>
                          <TableCell className="font-medium">{solicitacao.nome_escola}</TableCell>
                          <TableCell>{solicitacao.nome_responsavel}</TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>{getStatusBadge(solicitacao.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedSolicitacao(solicitacao); setShowDetailModal(true); }}
                                data-testid={`btn-ver-${solicitacao.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {solicitacao.status === 'pendente' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSelectedSolicitacao(solicitacao); setShowApproveModal(true); }}
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    data-testid={`btn-aprovar-${solicitacao.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSelectedSolicitacao(solicitacao); setShowRejectModal(true); }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    data-testid={`btn-rejeitar-${solicitacao.id}`}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope' }}>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {selectedSolicitacao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Código de Censo</p>
                  <p className="font-medium">{selectedSolicitacao.codigo_censo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  {getStatusBadge(selectedSolicitacao.status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Nome da Escola</p>
                <p className="font-medium">{selectedSolicitacao.nome_escola}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Endereço</p>
                <p className="font-medium">{selectedSolicitacao.endereco}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Telefone</p>
                  <p className="font-medium">{selectedSolicitacao.telefone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email da Escola</p>
                  <p className="font-medium">{selectedSolicitacao.email_escola || '-'}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Dados do Responsável</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Nome</p>
                    <p className="font-medium">{selectedSolicitacao.nome_responsavel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">CPF</p>
                    <p className="font-medium">{selectedSolicitacao.cpf_responsavel}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{selectedSolicitacao.email_responsavel}</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-slate-500">Justificativa</p>
                <p className="font-medium">{selectedSolicitacao.justificativa}</p>
              </div>
              {selectedSolicitacao.observacao_analise && (
                <div className="border-t pt-4">
                  <p className="text-sm text-slate-500">Observação da Análise</p>
                  <p className="font-medium text-red-600">{selectedSolicitacao.observacao_analise}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope' }}>Aprovar Solicitação</DialogTitle>
            <DialogDescription>
              Defina uma senha inicial para a escola acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                Escola: <strong>{selectedSolicitacao?.nome_escola}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha_inicial">Senha Inicial *</Label>
              <Input
                id="senha_inicial"
                type="text"
                value={senhaInicial}
                onChange={(e) => setSenhaInicial(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                data-testid="input-senha-inicial"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAprovar} 
              disabled={processing}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="btn-confirmar-aprovar"
            >
              {processing ? 'Aprovando...' : 'Aprovar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope' }}>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                Escola: <strong>{selectedSolicitacao?.nome_escola}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao">Motivo da Rejeição *</Label>
              <Textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
                data-testid="input-observacao"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRejeitar} 
              disabled={processing}
              variant="destructive"
              data-testid="btn-confirmar-rejeitar"
            >
              {processing ? 'Rejeitando...' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
