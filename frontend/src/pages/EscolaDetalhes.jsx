import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { escolasAPI, docentesAPI, quadroAdminAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  School, 
  LayoutDashboard, 
  LogOut,
  Menu,
  X,
  ArrowLeft,
  ClipboardList,
  Shield,
  GraduationCap,
  Users,
  MapPin,
  Phone,
  Mail,
  FileText,
  Calendar,
  Lock,
  Unlock,
  Bell,
  AlertTriangle
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
            const isActive = location.pathname.startsWith(item.path);
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

export default function EscolaDetalhes() {
  const { escolaId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [escola, setEscola] = useState(null);
  const [docentes, setDocentes] = useState([]);
  const [quadroAdmin, setQuadroAdmin] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [parecer, setParecer] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [escolaId]);

  const fetchData = async () => {
    try {
      const [escolaRes, docentesRes, quadroRes, usuariosRes] = await Promise.all([
        escolasAPI.getById(escolaId),
        docentesAPI.listar(escolaId),
        quadroAdminAPI.listar(escolaId),
        escolasAPI.listarUsuarios(escolaId)
      ]);
      setEscola(escolaRes.data);
      setDocentes(docentesRes.data);
      setQuadroAdmin(quadroRes.data);
      setUsuarios(usuariosRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados da escola');
      navigate('/admin/escolas');
    } finally {
      setLoading(false);
    }
  };

  const handleSituacaoChange = async (situacao) => {
    try {
      await escolasAPI.atualizarSituacao(escolaId, situacao);
      setEscola({ ...escola, situacao });
      toast.success('Situação atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar situação');
    }
  };

  const handleBloquear = async () => {
    if (!motivo.trim()) {
      toast.error('Informe o motivo do bloqueio');
      return;
    }
    setProcessing(true);
    try {
      await escolasAPI.bloquear(escolaId, motivo);
      setEscola({ ...escola, bloqueado: true, motivo_bloqueio: motivo });
      toast.success('Escola bloqueada com sucesso!');
      setShowBlockModal(false);
      setMotivo('');
    } catch (error) {
      toast.error('Erro ao bloquear escola');
    } finally {
      setProcessing(false);
    }
  };

  const handleDesbloquear = async () => {
    setProcessing(true);
    try {
      await escolasAPI.desbloquear(escolaId, parecer || null);
      setEscola({ ...escola, bloqueado: false, motivo_bloqueio: null });
      toast.success('Escola desbloqueada com sucesso!');
      setShowUnblockModal(false);
      setParecer('');
    } catch (error) {
      toast.error('Erro ao desbloquear escola');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="escola-detalhes">
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
                <Link 
                  to="/admin/escolas"
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
                      {escola?.nome}
                    </h1>
                    {escola?.bloqueado && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        <Lock className="w-3 h-3" />
                        Bloqueado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">INEP: {escola?.codigo_inep}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {escola?.bloqueado ? (
                  <Button
                    onClick={() => setShowUnblockModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    data-testid="btn-desbloquear"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Desbloquear
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowBlockModal(true)}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    data-testid="btn-bloquear"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Bloquear para Análise
                  </Button>
                )}
                <Select value={escola?.situacao} onValueChange={handleSituacaoChange}>
                  <SelectTrigger className="w-36" data-testid="select-situacao">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </header>

          <div className="p-6">
            <div className="space-y-6 animate-fadeIn">
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Endereço</p>
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{escola?.endereco}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Telefone</p>
                      <p className="text-sm font-medium text-slate-900">{escola?.telefone || '-'}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{escola?.email || '-'}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Última Atualização</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(escola?.data_atualizacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="docentes" className="w-full">
                <TabsList className="grid w-full max-w-xl grid-cols-3">
                  <TabsTrigger value="docentes" className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Docentes ({docentes.length})
                  </TabsTrigger>
                  <TabsTrigger value="quadro" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Quadro Admin ({quadroAdmin.length})
                  </TabsTrigger>
                  <TabsTrigger value="usuarios" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Usuários ({usuarios.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="docentes" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Corpo Docente</CardTitle>
                      <CardDescription>Professores cadastrados na escola</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {docentes.length === 0 ? (
                        <div className="text-center py-8">
                          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500">Nenhum docente cadastrado</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>CPF</TableHead>
                              <TableHead>Formação</TableHead>
                              <TableHead>Disciplinas</TableHead>
                              <TableHead>Vínculo</TableHead>
                              <TableHead>CH</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {docentes.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium">{doc.nome}</TableCell>
                                <TableCell>{doc.cpf}</TableCell>
                                <TableCell>{doc.formacao}</TableCell>
                                <TableCell>{doc.disciplinas.join(', ')}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    doc.vinculo === 'Efetivo' ? 'bg-emerald-100 text-emerald-800' :
                                    doc.vinculo === 'Contratado' ? 'bg-blue-100 text-blue-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {doc.vinculo}
                                  </span>
                                </TableCell>
                                <TableCell>{doc.carga_horaria}h</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="quadro" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quadro Administrativo</CardTitle>
                      <CardDescription>Direção e coordenação da escola</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {quadroAdmin.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500">Nenhum membro cadastrado</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>CPF</TableHead>
                              <TableHead>Cargo</TableHead>
                              <TableHead>Formação</TableHead>
                              <TableHead>Contato</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quadroAdmin.map((membro) => (
                              <TableRow key={membro.id}>
                                <TableCell className="font-medium">{membro.nome}</TableCell>
                                <TableCell>{membro.cpf}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    membro.cargo === 'Diretor' ? 'bg-teal-100 text-teal-800' :
                                    membro.cargo === 'Vice-Diretor' ? 'bg-blue-100 text-blue-800' :
                                    membro.cargo === 'Secretário' ? 'bg-amber-100 text-amber-800' :
                                    'bg-slate-100 text-slate-800'
                                  }`}>
                                    {membro.cargo}
                                  </span>
                                </TableCell>
                                <TableCell>{membro.formacao}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {membro.email && <p>{membro.email}</p>}
                                    {membro.telefone && <p className="text-slate-400">{membro.telefone}</p>}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="usuarios" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Usuários com Acesso</CardTitle>
                      <CardDescription>Diretores e secretários com acesso ao sistema</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {usuarios.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500">Nenhum usuário cadastrado</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>CPF</TableHead>
                              <TableHead>Cargo</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Telefone</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {usuarios.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.nome}</TableCell>
                                <TableCell>{user.cpf}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    user.cargo === 'Diretor' ? 'bg-teal-100 text-teal-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {user.cargo}
                                  </span>
                                </TableCell>
                                <TableCell>{user.email || '-'}</TableCell>
                                <TableCell>{user.telefone || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Bloqueio Alert */}
              {escola?.bloqueado && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900">Escola Bloqueada para Análise</h3>
                      <p className="text-sm text-red-700 mt-1">
                        <strong>Motivo:</strong> {escola.motivo_bloqueio}
                      </p>
                      <p className="text-xs text-red-600 mt-2">
                        A escola não pode fazer alterações enquanto estiver bloqueada.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Modalidades */}
              {escola?.modalidades?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Modalidades de Ensino
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {escola.modalidades.map((mod, idx) => (
                        <span key={idx} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
                          {mod}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Block Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
              <Lock className="w-5 h-5 text-red-600" />
              Bloquear Escola para Análise
            </DialogTitle>
            <DialogDescription>
              A escola não poderá fazer edições enquanto estiver bloqueada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                Escola: <strong>{escola?.nome}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo do Bloqueio *</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Análise de documentação para regularização..."
                rows={3}
                data-testid="input-motivo-bloqueio"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBloquear} 
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
              data-testid="btn-confirmar-bloqueio"
            >
              {processing ? 'Bloqueando...' : 'Bloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock Modal */}
      <Dialog open={showUnblockModal} onOpenChange={setShowUnblockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
              <Unlock className="w-5 h-5 text-emerald-600" />
              Desbloquear Escola
            </DialogTitle>
            <DialogDescription>
              A escola poderá fazer edições novamente após o desbloqueio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                Escola: <strong>{escola?.nome}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parecer">Parecer (opcional)</Label>
              <Textarea
                id="parecer"
                value={parecer}
                onChange={(e) => setParecer(e.target.value)}
                placeholder="Ex: Documentação aprovada. Escola regularizada..."
                rows={3}
                data-testid="input-parecer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnblockModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDesbloquear} 
              disabled={processing}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="btn-confirmar-desbloqueio"
            >
              {processing ? 'Desbloqueando...' : 'Desbloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
