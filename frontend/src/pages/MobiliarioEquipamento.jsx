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
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle
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

// Tipos de mobiliário/equipamento
const TIPOS_MOBILIARIO = [
  'AR-CONDICIONADO',
  'ARMÁRIO',
  'BEBEDOURO',
  'CADEIRA',
  'CADEIRA DE RODAS',
  'CARTEIRA ESCOLAR',
  'COMPUTADOR',
  'DATASHOW / PROJETOR',
  'ESTANTE',
  'FOGÃO',
  'FREEZER',
  'GELADEIRA',
  'IMPRESSORA',
  'LOUSA / QUADRO',
  'MESA',
  'MESA DE PROFESSOR',
  'MESA DE REFEITÓRIO',
  'MICRO-ONDAS',
  'NOTEBOOK',
  'QUADRO BRANCO',
  'ROTEADOR WIFI',
  'SERVIDOR',
  'TABLET',
  'TELEVISÃO',
  'VENTILADOR',
  'OUTROS'
];

export default function MobiliarioEquipamento() {
  const { token, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    tipo: '',
    qtd_excelente: 0,
    qtd_bom: 0,
    qtd_regular: 0,
    qtd_pessimo: 0,
    observacao: ''
  });

  const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchItens();
  }, []);

  const fetchItens = async () => {
    try {
      const response = await api.get('/mobiliario-equipamento');
      setItens(response.data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      toast.error('Erro ao carregar mobiliário/equipamentos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: '',
      qtd_excelente: 0,
      qtd_bom: 0,
      qtd_regular: 0,
      qtd_pessimo: 0,
      observacao: ''
    });
    setEditingId(null);
  };

  const openDialog = (item = null) => {
    if (item) {
      setFormData({
        tipo: item.tipo,
        qtd_excelente: item.qtd_excelente || 0,
        qtd_bom: item.qtd_bom || 0,
        qtd_regular: item.qtd_regular || 0,
        qtd_pessimo: item.qtd_pessimo || 0,
        observacao: item.observacao || ''
      });
      setEditingId(item.id);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.tipo) {
      toast.error('Selecione o tipo de item');
      return;
    }

    try {
      const payload = {
        ...formData,
        qtd_excelente: parseInt(formData.qtd_excelente) || 0,
        qtd_bom: parseInt(formData.qtd_bom) || 0,
        qtd_regular: parseInt(formData.qtd_regular) || 0,
        qtd_pessimo: parseInt(formData.qtd_pessimo) || 0,
        escola_id: user.escola_id
      };

      if (editingId) {
        await api.put(`/mobiliario-equipamento/${editingId}`, payload);
        toast.success('Item atualizado com sucesso!');
      } else {
        await api.post('/mobiliario-equipamento', payload);
        toast.success('Item cadastrado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      fetchItens();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      if (error.response?.status === 403) {
        toast.error('Escola bloqueada para edição');
      } else {
        toast.error('Erro ao salvar item');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este item?')) return;

    try {
      await api.delete(`/mobiliario-equipamento/${id}`);
      toast.success('Item removido com sucesso!');
      fetchItens();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      if (error.response?.status === 403) {
        toast.error('Escola bloqueada para edição');
      } else {
        toast.error('Erro ao remover item');
      }
    }
  };

  // Calcula totais por condição
  const totais = itens.reduce((acc, item) => ({
    excelente: acc.excelente + (item.qtd_excelente || 0),
    bom: acc.bom + (item.qtd_bom || 0),
    regular: acc.regular + (item.qtd_regular || 0),
    pessimo: acc.pessimo + (item.qtd_pessimo || 0),
    total: acc.total + (item.qtd_total || 0)
  }), { excelente: 0, bom: 0, regular: 0, pessimo: 0, total: 0 });

  return (
    <div className="min-h-screen bg-slate-50" data-testid="mobiliario-equipamento">
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
                    Mobiliário e Equipamentos
                  </h1>
                  <p className="text-sm text-slate-500">Inventário de bens da escola</p>
                </div>
              </div>
              <Button 
                onClick={() => openDialog()}
                className="bg-teal-700 hover:bg-teal-800"
                data-testid="btn-novo-item"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Item
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
                {/* Resumo por condição */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Excelente</p>
                          <p className="text-xl font-bold text-emerald-600">{totais.excelente}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Bom</p>
                          <p className="text-xl font-bold text-blue-600">{totais.bom}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Regular</p>
                          <p className="text-xl font-bold text-amber-600">{totais.regular}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Péssimo</p>
                          <p className="text-xl font-bold text-red-600">{totais.pessimo}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Total</p>
                          <p className="text-xl font-bold text-slate-900">{totais.total}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela */}
                <Card>
                  <CardHeader>
                    <CardTitle>Inventário</CardTitle>
                    <CardDescription>Lista de mobiliário e equipamentos por condição</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {itens.length === 0 ? (
                      <div className="text-center py-12">
                        <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhum item cadastrado</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => openDialog()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Cadastrar primeiro item
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead className="text-center bg-emerald-50">Excelente</TableHead>
                              <TableHead className="text-center bg-blue-50">Bom</TableHead>
                              <TableHead className="text-center bg-amber-50">Regular</TableHead>
                              <TableHead className="text-center bg-red-50">Péssimo</TableHead>
                              <TableHead className="text-center font-bold">Total</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {itens.map((item, index) => (
                              <TableRow key={item.id} data-testid={`item-row-${item.id}`}>
                                <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                                <TableCell className="font-medium">{item.tipo}</TableCell>
                                <TableCell className="text-center bg-emerald-50/50">
                                  <span className="text-emerald-700 font-medium">{item.qtd_excelente || 0}</span>
                                </TableCell>
                                <TableCell className="text-center bg-blue-50/50">
                                  <span className="text-blue-700 font-medium">{item.qtd_bom || 0}</span>
                                </TableCell>
                                <TableCell className="text-center bg-amber-50/50">
                                  <span className="text-amber-700 font-medium">{item.qtd_regular || 0}</span>
                                </TableCell>
                                <TableCell className="text-center bg-red-50/50">
                                  <span className="text-red-700 font-medium">{item.qtd_pessimo || 0}</span>
                                </TableCell>
                                <TableCell className="text-center font-bold">{item.qtd_total || 0}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openDialog(item)}
                                      data-testid={`btn-editar-${item.id}`}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDelete(item.id)}
                                      data-testid={`btn-excluir-${item.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
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
              {editingId ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
            <DialogDescription>
              Informe a quantidade por estado de conservação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Item *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v }))}
              >
                <SelectTrigger data-testid="select-tipo-item">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_MOBILIARIO.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qtd_excelente" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Excelente
                </Label>
                <Input
                  id="qtd_excelente"
                  type="number"
                  min="0"
                  value={formData.qtd_excelente}
                  onChange={(e) => setFormData(prev => ({ ...prev, qtd_excelente: e.target.value }))}
                  data-testid="input-qtd-excelente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qtd_bom" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Bom
                </Label>
                <Input
                  id="qtd_bom"
                  type="number"
                  min="0"
                  value={formData.qtd_bom}
                  onChange={(e) => setFormData(prev => ({ ...prev, qtd_bom: e.target.value }))}
                  data-testid="input-qtd-bom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qtd_regular" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  Regular
                </Label>
                <Input
                  id="qtd_regular"
                  type="number"
                  min="0"
                  value={formData.qtd_regular}
                  onChange={(e) => setFormData(prev => ({ ...prev, qtd_regular: e.target.value }))}
                  data-testid="input-qtd-regular"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qtd_pessimo" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Péssimo
                </Label>
                <Input
                  id="qtd_pessimo"
                  type="number"
                  min="0"
                  value={formData.qtd_pessimo}
                  onChange={(e) => setFormData(prev => ({ ...prev, qtd_pessimo: e.target.value }))}
                  data-testid="input-qtd-pessimo"
                />
              </div>
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
