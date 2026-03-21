import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
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
  Plus,
  Pencil,
  Trash2,
  Home,
  Boxes,
  Building
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Sidebar Component
const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/escola/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/escola/ficha-escolar', icon: FileText, label: 'Ficha Escolar' },
    { path: '/escola/dependencias', icon: Home, label: 'Dependências Físicas' },
    { path: '/escola/mobiliario', icon: Boxes, label: 'Mobiliário/Equipamento' },
    { path: '/escola/professores', icon: GraduationCap, label: 'Professores' },
    { path: '/escola/quadro-administrativo', icon: Users, label: 'Quadro Administrativo' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
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
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <School className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Manrope' }}>COMEP</h1>
                <p className="text-xs text-slate-400">Área da Escola</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-slate-400">Escola</p>
            <p className="text-white font-medium truncate">{user?.escola_nome || 'Carregando...'}</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto">
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
                <span className="font-medium text-sm">{item.label}</span>
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

// Tipos de dependências
const TIPOS_DEPENDENCIA = [
  'SALA DE AULA',
  'SALA DOS PROFESSORES',
  'SALA DE DIREÇÃO',
  'SECRETARIA',
  'BIBLIOTECA',
  'LABORATÓRIO DE INFORMÁTICA',
  'LABORATÓRIO DE CIÊNCIAS',
  'QUADRA ESPORTIVA COBERTA',
  'QUADRA ESPORTIVA DESCOBERTA',
  'PÁTIO COBERTO',
  'PÁTIO DESCOBERTO',
  'COZINHA',
  'REFEITÓRIO',
  'DEPÓSITO',
  'ALMOXARIFADO',
  'BANHEIRO MASCULINO',
  'BANHEIRO FEMININO',
  'BANHEIRO PNE',
  'AUDITÓRIO',
  'SALA DE LEITURA',
  'SALA DE RECURSOS',
  'SALA DE ATENDIMENTO ESPECIAL',
  'ÁREA DE SERVIÇO',
  'OUTROS'
];

export default function DependenciasFisicas() {
  const { token, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dependencias, setDependencias] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    tipo: '',
    quantidade: 1,
    area_m2: '',
    anexo: '',
    observacao: ''
  });

  const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchDependencias();
  }, []);

  const fetchDependencias = async () => {
    try {
      const response = await api.get('/dependencias-fisicas');
      setDependencias(response.data);
    } catch (error) {
      console.error('Erro ao carregar dependências:', error);
      toast.error('Erro ao carregar dependências');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: '',
      quantidade: 1,
      area_m2: '',
      anexo: '',
      observacao: ''
    });
    setEditingId(null);
  };

  const openDialog = (dependencia = null) => {
    if (dependencia) {
      setFormData({
        tipo: dependencia.tipo,
        quantidade: dependencia.quantidade,
        area_m2: dependencia.area_m2 || '',
        anexo: dependencia.anexo || '',
        observacao: dependencia.observacao || ''
      });
      setEditingId(dependencia.id);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.tipo) {
      toast.error('Selecione o tipo de dependência');
      return;
    }

    try {
      const payload = {
        ...formData,
        quantidade: parseInt(formData.quantidade) || 1,
        area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : null,
        anexo: formData.anexo ? parseInt(formData.anexo) : null,
        escola_id: user.escola_id
      };

      if (editingId) {
        await api.put(`/dependencias-fisicas/${editingId}`, payload);
        toast.success('Dependência atualizada com sucesso!');
      } else {
        await api.post('/dependencias-fisicas', payload);
        toast.success('Dependência cadastrada com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      fetchDependencias();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      if (error.response?.status === 403) {
        toast.error('Escola bloqueada para edição');
      } else {
        toast.error('Erro ao salvar dependência');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta dependência?')) return;

    try {
      await api.delete(`/dependencias-fisicas/${id}`);
      toast.success('Dependência removida com sucesso!');
      fetchDependencias();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      if (error.response?.status === 403) {
        toast.error('Escola bloqueada para edição');
      } else {
        toast.error('Erro ao remover dependência');
      }
    }
  };

  // Calcula totais
  const totalArea = dependencias.reduce((sum, d) => sum + (parseFloat(d.area_m2) || 0), 0);
  const totalDependencias = dependencias.reduce((sum, d) => sum + (d.quantidade || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dependencias-fisicas">
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
                    Dependências Físicas
                  </h1>
                  <p className="text-sm text-slate-500">Salas, laboratórios e espaços da escola</p>
                </div>
              </div>
              <Button 
                onClick={() => openDialog()}
                className="bg-teal-700 hover:bg-teal-800"
                data-testid="btn-nova-dependencia"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Dependência
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
                {/* Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                          <Building className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Total de Espaços</p>
                          <p className="text-2xl font-bold text-slate-900">{totalDependencias}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Home className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Área Total</p>
                          <p className="text-2xl font-bold text-slate-900">{totalArea.toFixed(2)} m²</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Tipos Cadastrados</p>
                          <p className="text-2xl font-bold text-slate-900">{dependencias.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela */}
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Dependências</CardTitle>
                    <CardDescription>Espaços físicos cadastrados na escola</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {dependencias.length === 0 ? (
                      <div className="text-center py-12">
                        <Home className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhuma dependência cadastrada</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => openDialog()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Cadastrar primeira dependência
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-center">Quantidade</TableHead>
                            <TableHead className="text-right">Área (m²)</TableHead>
                            <TableHead className="text-center">Anexo</TableHead>
                            <TableHead>Observação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dependencias.map((dep, index) => (
                            <TableRow key={dep.id} data-testid={`dependencia-row-${dep.id}`}>
                              <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                              <TableCell className="font-medium">{dep.tipo}</TableCell>
                              <TableCell className="text-center">{dep.quantidade}</TableCell>
                              <TableCell className="text-right">
                                {dep.area_m2 ? `${parseFloat(dep.area_m2).toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell className="text-center">{dep.anexo || '-'}</TableCell>
                              <TableCell className="text-slate-500 max-w-xs truncate">
                                {dep.observacao || '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDialog(dep)}
                                    data-testid={`btn-editar-${dep.id}`}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(dep.id)}
                                    data-testid={`btn-excluir-${dep.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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
            )}
          </div>
        </main>
      </div>

      {/* Dialog de cadastro/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Dependência' : 'Nova Dependência'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do espaço físico
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Dependência *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v }))}
              >
                <SelectTrigger data-testid="select-tipo-dependencia">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DEPENDENCIA.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
                  data-testid="input-quantidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area_m2">Área (m²)</Label>
                <Input
                  id="area_m2"
                  type="number"
                  step="0.01"
                  value={formData.area_m2}
                  onChange={(e) => setFormData(prev => ({ ...prev, area_m2: e.target.value }))}
                  placeholder="Ex: 48.50"
                  data-testid="input-area"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anexo">Anexo (se aplicável)</Label>
              <Input
                id="anexo"
                type="number"
                value={formData.anexo}
                onChange={(e) => setFormData(prev => ({ ...prev, anexo: e.target.value }))}
                placeholder="Número do anexo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Input
                id="observacao"
                value={formData.observacao}
                onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                placeholder="Observações adicionais"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-teal-700 hover:bg-teal-800">
              {editingId ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
