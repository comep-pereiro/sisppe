import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { quadroAdminAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  School, 
  Users, 
  GraduationCap, 
  LayoutDashboard, 
  LogOut,
  Menu,
  X,
  Plus,
  Edit,
  Trash2,
  Search
} from 'lucide-react';

// Sidebar
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

export default function GestaoQuadroAdmin() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMembro, setEditingMembro] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cargo: '',
    email: '',
    telefone: '',
    formacao: '',
  });

  useEffect(() => {
    fetchMembros();
  }, []);

  const fetchMembros = async () => {
    try {
      const response = await quadroAdminAPI.listar();
      setMembros(response.data);
    } catch (error) {
      toast.error('Erro ao carregar quadro administrativo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        escola_id: user?.id,
      };

      if (editingMembro) {
        await quadroAdminAPI.atualizar(editingMembro.id, data);
        toast.success('Membro atualizado com sucesso!');
      } else {
        await quadroAdminAPI.criar(data);
        toast.success('Membro cadastrado com sucesso!');
      }
      
      setShowModal(false);
      resetForm();
      fetchMembros();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar membro');
    }
  };

  const handleEdit = (membro) => {
    setEditingMembro(membro);
    setFormData({
      nome: membro.nome,
      cpf: membro.cpf,
      cargo: membro.cargo,
      email: membro.email || '',
      telefone: membro.telefone || '',
      formacao: membro.formacao,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este membro?')) return;
    
    try {
      await quadroAdminAPI.remover(id);
      toast.success('Membro removido com sucesso!');
      fetchMembros();
    } catch (error) {
      toast.error('Erro ao remover membro');
    }
  };

  const resetForm = () => {
    setEditingMembro(null);
    setFormData({
      nome: '',
      cpf: '',
      cargo: '',
      email: '',
      telefone: '',
      formacao: '',
    });
  };

  const filteredMembros = membros.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cpf.includes(searchTerm) ||
    m.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cargoOrder = ['Diretor', 'Vice-Diretor', 'Secretário', 'Coordenador'];
  const sortedMembros = [...filteredMembros].sort((a, b) => {
    const orderA = cargoOrder.indexOf(a.cargo);
    const orderB = cargoOrder.indexOf(b.cargo);
    return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
  });

  return (
    <div className="min-h-screen bg-slate-50" data-testid="gestao-quadro-admin">
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
                    Quadro Administrativo
                  </h1>
                  <p className="text-sm text-slate-500">Diretores, secretários e coordenadores</p>
                </div>
              </div>
              <Button 
                onClick={() => { resetForm(); setShowModal(true); }}
                data-testid="btn-novo-membro"
                className="bg-teal-700 hover:bg-teal-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Membro
              </Button>
            </div>
          </header>

          <div className="p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, CPF ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-membro"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : sortedMembros.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhum membro encontrado</p>
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
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMembros.map((membro) => (
                        <TableRow key={membro.id} data-testid={`membro-row-${membro.id}`}>
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
                              {membro.email && <p className="text-slate-600">{membro.email}</p>}
                              {membro.telefone && <p className="text-slate-400">{membro.telefone}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(membro)}
                                data-testid={`btn-edit-${membro.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(membro.id)}
                                data-testid={`btn-delete-${membro.id}`}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </main>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope' }}>
              {editingMembro ? 'Editar Membro' : 'Novo Membro'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do membro do quadro administrativo
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  data-testid="modal-input-nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  required
                  data-testid="modal-input-cpf"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <Select
                  value={formData.cargo}
                  onValueChange={(value) => setFormData({ ...formData, cargo: value })}
                >
                  <SelectTrigger data-testid="modal-select-cargo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diretor">Diretor</SelectItem>
                    <SelectItem value="Vice-Diretor">Vice-Diretor</SelectItem>
                    <SelectItem value="Secretário">Secretário</SelectItem>
                    <SelectItem value="Coordenador">Coordenador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="formacao">Formação *</Label>
                <Input
                  id="formacao"
                  value={formData.formacao}
                  onChange={(e) => setFormData({ ...formData, formacao: e.target.value })}
                  required
                  placeholder="Ex: Mestrado em Gestão Educacional"
                  data-testid="modal-input-formacao"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="modal-input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  data-testid="modal-input-telefone"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-700 hover:bg-teal-800" data-testid="modal-btn-salvar">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
