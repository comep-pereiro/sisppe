import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MaskedInput } from '@/components/ui/masked-input';
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
  User,
  BookOpen,
  Calendar,
  Search,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatCPF, formatPhone, formatCEP } from '@/utils/formatters';

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

// Opções de seleção
const VINCULOS = ['EFETIVO', 'CONTRATADO', 'TEMPORÁRIO', 'CEDIDO'];
const FUNCOES = ['PROFESSOR', 'COORDENADOR PEDAGÓGICO', 'PROFESSOR DE AEE'];
const SEXOS = ['MASCULINO', 'FEMININO'];
const ESTADOS_CIVIS = ['SOLTEIRO(A)', 'CASADO(A)', 'DIVORCIADO(A)', 'VIÚVO(A)', 'UNIÃO ESTÁVEL'];
const TIPOS_FORMACAO = ['GRADUAÇÃO', 'ESPECIALIZAÇÃO', 'MESTRADO', 'DOUTORADO', 'MAGISTÉRIO'];
const ETAPAS = ['EDUCAÇÃO INFANTIL', 'ENSINO FUNDAMENTAL - ANOS INICIAIS', 'ENSINO FUNDAMENTAL - ANOS FINAIS', 'EJA'];
const HABILITACOES = ['HABILITADO', 'NÃO HABILITADO'];
const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];

const DISCIPLINAS = [
  'PORTUGUÊS', 'MATEMÁTICA', 'HISTÓRIA', 'GEOGRAFIA', 'CIÊNCIAS', 
  'ARTE', 'EDUCAÇÃO FÍSICA', 'INGLÊS', 'ENSINO RELIGIOSO',
  'POLIVALENTE', 'LITERATURA', 'REDAÇÃO'
];

export default function Professores() {
  const { token, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [professores, setProfessores] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  
  const [formData, setFormData] = useState({
    // Dados pessoais
    nome: '',
    cpf: '',
    rg: '',
    orgao_emissor: '',
    data_nascimento: '',
    sexo: '',
    estado_civil: '',
    naturalidade: '',
    // Contato
    telefone: '',
    celular: '',
    email: '',
    // Endereço
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    municipio: '',
    // Dados profissionais
    vinculo: 'EFETIVO',
    funcao: 'PROFESSOR',
    data_admissao: '',
    carga_horaria_semanal: 40,
    // Formações
    formacoes: [],
    // Atribuições
    atribuicoes: []
  });

  // Estado para formação temporária
  const [novaFormacao, setNovaFormacao] = useState({
    tipo: '',
    curso: '',
    instituicao: '',
    ano_conclusao: '',
    registro: '',
    parecer: ''
  });

  // Estado para atribuição temporária
  const [novaAtribuicao, setNovaAtribuicao] = useState({
    etapa: '',
    turma: '',
    disciplina: '',
    dias_semana: [],
    carga_horaria: 0,
    habilitacao: 'HABILITADO',
    autorizacao: ''
  });

  const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchProfessores();
  }, []);

  const fetchProfessores = async () => {
    try {
      const response = await api.get('/docentes-completos');
      setProfessores(response.data);
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
      toast.error('Erro ao carregar professores');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      rg: '',
      orgao_emissor: '',
      data_nascimento: '',
      sexo: '',
      estado_civil: '',
      naturalidade: '',
      telefone: '',
      celular: '',
      email: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      municipio: '',
      vinculo: 'EFETIVO',
      funcao: 'PROFESSOR',
      data_admissao: '',
      carga_horaria_semanal: 40,
      formacoes: [],
      atribuicoes: []
    });
    setNovaFormacao({ tipo: '', curso: '', instituicao: '', ano_conclusao: '', registro: '', parecer: '' });
    setNovaAtribuicao({ etapa: '', turma: '', disciplina: '', dias_semana: [], carga_horaria: 0, habilitacao: 'HABILITADO', autorizacao: '' });
    setEditingId(null);
  };

  const openDialog = (professor = null) => {
    if (professor) {
      setFormData({
        ...professor,
        formacoes: professor.formacoes || [],
        atribuicoes: professor.atribuicoes || []
      });
      setEditingId(professor.id);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const openViewDialog = (professor) => {
    setSelectedProfessor(professor);
    setViewDialogOpen(true);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFormacao = () => {
    if (!novaFormacao.tipo || !novaFormacao.curso) {
      toast.error('Preencha tipo e curso da formação');
      return;
    }
    setFormData(prev => ({
      ...prev,
      formacoes: [...prev.formacoes, { ...novaFormacao }]
    }));
    setNovaFormacao({ tipo: '', curso: '', instituicao: '', ano_conclusao: '', registro: '', parecer: '' });
    toast.success('Formação adicionada');
  };

  const removeFormacao = (index) => {
    setFormData(prev => ({
      ...prev,
      formacoes: prev.formacoes.filter((_, i) => i !== index)
    }));
  };

  const addAtribuicao = () => {
    if (!novaAtribuicao.etapa || !novaAtribuicao.disciplina) {
      toast.error('Preencha etapa e disciplina');
      return;
    }
    setFormData(prev => ({
      ...prev,
      atribuicoes: [...prev.atribuicoes, { ...novaAtribuicao }]
    }));
    setNovaAtribuicao({ etapa: '', turma: '', disciplina: '', dias_semana: [], carga_horaria: 0, habilitacao: 'HABILITADO', autorizacao: '' });
    toast.success('Atribuição adicionada');
  };

  const removeAtribuicao = (index) => {
    setFormData(prev => ({
      ...prev,
      atribuicoes: prev.atribuicoes.filter((_, i) => i !== index)
    }));
  };

  const toggleDiaSemana = (dia) => {
    setNovaAtribuicao(prev => {
      const dias = prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter(d => d !== dia)
        : [...prev.dias_semana, dia];
      return { ...prev, dias_semana: dias };
    });
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.cpf) {
      toast.error('Preencha nome e CPF');
      return;
    }

    try {
      const payload = {
        ...formData,
        carga_horaria_semanal: parseInt(formData.carga_horaria_semanal) || 40,
        escola_id: user.escola_id
      };

      if (editingId) {
        await api.put(`/docentes-completos/${editingId}`, payload);
        toast.success('Professor atualizado com sucesso!');
      } else {
        await api.post('/docentes-completos', payload);
        toast.success('Professor cadastrado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      fetchProfessores();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      if (error.response?.status === 403) {
        toast.error('Escola bloqueada para edição');
      } else {
        toast.error('Erro ao salvar professor');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este professor?')) return;

    try {
      await api.delete(`/docentes-completos/${id}`);
      toast.success('Professor removido com sucesso!');
      fetchProfessores();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      if (error.response?.status === 403) {
        toast.error('Escola bloqueada para edição');
      } else {
        toast.error('Erro ao remover professor');
      }
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtro de busca
  const filteredProfessores = professores.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cpf && p.cpf.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="professores-page">
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
                    Professores
                  </h1>
                  <p className="text-sm text-slate-500">Corpo docente da escola</p>
                </div>
              </div>
              <Button 
                onClick={() => openDialog()}
                className="bg-teal-700 hover:bg-teal-800"
                data-testid="btn-novo-professor"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Professor
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
                {/* Busca */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-busca-professor"
                  />
                </div>

                {/* Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Total de Professores</p>
                          <p className="text-2xl font-bold text-slate-900">{professores.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Efetivos</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {professores.filter(p => p.vinculo === 'EFETIVO').length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Contratados</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {professores.filter(p => p.vinculo === 'CONTRATADO').length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de Professores */}
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Professores</CardTitle>
                    <CardDescription>
                      {filteredProfessores.length} professor(es) encontrado(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredProfessores.length === 0 ? (
                      <div className="text-center py-12">
                        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhum professor cadastrado</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => openDialog()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Cadastrar primeiro professor
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10"></TableHead>
                              <TableHead>Nome</TableHead>
                              <TableHead>CPF</TableHead>
                              <TableHead>Telefone</TableHead>
                              <TableHead>Vínculo</TableHead>
                              <TableHead>Função</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProfessores.map((prof) => (
                              <>
                                <TableRow key={prof.id} data-testid={`professor-row-${prof.id}`}>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleRowExpand(prof.id)}
                                    >
                                      {expandedRows[prof.id] ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="font-medium">{prof.nome}</TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {formatCPF(prof.cpf)}
                                  </TableCell>
                                  <TableCell>
                                    {formatPhone(prof.telefone || prof.celular) || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={prof.vinculo === 'EFETIVO' ? 'default' : 'secondary'}>
                                      {prof.vinculo}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{prof.funcao}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openViewDialog(prof)}
                                        data-testid={`btn-ver-${prof.id}`}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDialog(prof)}
                                        data-testid={`btn-editar-${prof.id}`}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(prof.id)}
                                        data-testid={`btn-excluir-${prof.id}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {/* Linha expandida com atribuições */}
                                {expandedRows[prof.id] && (
                                  <TableRow className="bg-slate-50">
                                    <TableCell colSpan={7} className="p-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Formações */}
                                        <div>
                                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4" />
                                            Formações
                                          </h4>
                                          {prof.formacoes?.length > 0 ? (
                                            <ul className="space-y-1 text-sm">
                                              {prof.formacoes.map((f, i) => (
                                                <li key={i} className="text-slate-600">
                                                  • {f.tipo}: {f.curso} - {f.instituicao}
                                                </li>
                                              ))}
                                            </ul>
                                          ) : (
                                            <p className="text-sm text-slate-400">Nenhuma formação cadastrada</p>
                                          )}
                                        </div>
                                        {/* Atribuições */}
                                        <div>
                                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Atribuições
                                          </h4>
                                          {prof.atribuicoes?.length > 0 ? (
                                            <ul className="space-y-1 text-sm">
                                              {prof.atribuicoes.map((a, i) => (
                                                <li key={i} className="text-slate-600">
                                                  • {a.disciplina} - {a.etapa} ({a.dias_semana?.join(', ')})
                                                  <Badge 
                                                    variant={a.habilitacao === 'HABILITADO' ? 'default' : 'destructive'}
                                                    className="ml-2 text-xs"
                                                  >
                                                    {a.habilitacao}
                                                  </Badge>
                                                </li>
                                              ))}
                                            </ul>
                                          ) : (
                                            <p className="text-sm text-slate-400">Nenhuma atribuição cadastrada</p>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
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

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Professor' : 'Novo Professor'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados completos do professor
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="pessoais" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="profissionais">Profissional</TabsTrigger>
              <TabsTrigger value="formacoes">Formações</TabsTrigger>
              <TabsTrigger value="atribuicoes">Atribuições</TabsTrigger>
            </TabsList>

            {/* Tab Dados Pessoais */}
            <TabsContent value="pessoais" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder="Nome completo do professor"
                    data-testid="input-nome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <MaskedInput
                    id="cpf"
                    mask="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleChange('cpf', e.target.value)}
                    placeholder="123.456.789-00"
                    data-testid="input-cpf"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg || ''}
                    onChange={(e) => handleChange('rg', e.target.value)}
                    placeholder="Número do RG"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgao_emissor">Órgão Emissor</Label>
                  <Input
                    id="orgao_emissor"
                    value={formData.orgao_emissor || ''}
                    onChange={(e) => handleChange('orgao_emissor', e.target.value)}
                    placeholder="SSP/CE"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento || ''}
                    onChange={(e) => handleChange('data_nascimento', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select value={formData.sexo || ''} onValueChange={(v) => handleChange('sexo', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SEXOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado_civil">Estado Civil</Label>
                  <Select value={formData.estado_civil || ''} onValueChange={(v) => handleChange('estado_civil', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_CIVIS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="naturalidade">Naturalidade</Label>
                  <Input
                    id="naturalidade"
                    value={formData.naturalidade || ''}
                    onChange={(e) => handleChange('naturalidade', e.target.value)}
                    placeholder="Cidade/Estado"
                  />
                </div>

                {/* Contato */}
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <MaskedInput
                    id="telefone"
                    mask="phone"
                    value={formData.telefone || ''}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                    placeholder="(88) 3527-1580"
                    data-testid="input-telefone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="celular">Celular</Label>
                  <MaskedInput
                    id="celular"
                    mask="phone"
                    value={formData.celular || ''}
                    onChange={(e) => handleChange('celular', e.target.value)}
                    placeholder="(88) 99999-9999"
                    data-testid="input-celular"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    data-testid="input-email"
                  />
                </div>

                {/* Endereço */}
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <MaskedInput
                    id="cep"
                    mask="cep"
                    value={formData.cep || ''}
                    onChange={(e) => handleChange('cep', e.target.value)}
                    placeholder="63460-000"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco || ''}
                    onChange={(e) => handleChange('endereco', e.target.value)}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero || ''}
                    onChange={(e) => handleChange('numero', e.target.value)}
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro || ''}
                    onChange={(e) => handleChange('bairro', e.target.value)}
                    placeholder="Centro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="municipio">Município</Label>
                  <Input
                    id="municipio"
                    value={formData.municipio || ''}
                    onChange={(e) => handleChange('municipio', e.target.value)}
                    placeholder="Pereiro"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab Dados Profissionais */}
            <TabsContent value="profissionais" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vinculo">Vínculo</Label>
                  <Select value={formData.vinculo} onValueChange={(v) => handleChange('vinculo', v)}>
                    <SelectTrigger data-testid="select-vinculo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VINCULOS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funcao">Função</Label>
                  <Select value={formData.funcao} onValueChange={(v) => handleChange('funcao', v)}>
                    <SelectTrigger data-testid="select-funcao">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNCOES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_admissao">Data de Admissão</Label>
                  <Input
                    id="data_admissao"
                    type="date"
                    value={formData.data_admissao || ''}
                    onChange={(e) => handleChange('data_admissao', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carga_horaria_semanal">Carga Horária Semanal</Label>
                  <Input
                    id="carga_horaria_semanal"
                    type="number"
                    value={formData.carga_horaria_semanal}
                    onChange={(e) => handleChange('carga_horaria_semanal', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab Formações */}
            <TabsContent value="formacoes" className="space-y-4">
              {/* Formulário para adicionar formação */}
              <Card className="bg-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Adicionar Formação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select value={novaFormacao.tipo} onValueChange={(v) => setNovaFormacao(p => ({ ...p, tipo: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_FORMACAO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Curso *</Label>
                      <Input
                        value={novaFormacao.curso}
                        onChange={(e) => setNovaFormacao(p => ({ ...p, curso: e.target.value }))}
                        placeholder="Nome do curso"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Instituição</Label>
                      <Input
                        value={novaFormacao.instituicao}
                        onChange={(e) => setNovaFormacao(p => ({ ...p, instituicao: e.target.value }))}
                        placeholder="Nome da instituição"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ano de Conclusão</Label>
                      <Input
                        type="number"
                        value={novaFormacao.ano_conclusao}
                        onChange={(e) => setNovaFormacao(p => ({ ...p, ano_conclusao: e.target.value }))}
                        placeholder="2020"
                      />
                    </div>
                  </div>

                  <Button type="button" onClick={addFormacao} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Formação
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de formações */}
              {formData.formacoes.length > 0 && (
                <div className="space-y-2">
                  <Label>Formações Cadastradas</Label>
                  {formData.formacoes.map((f, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div>
                        <p className="font-medium">{f.tipo}: {f.curso}</p>
                        <p className="text-sm text-slate-500">{f.instituicao} {f.ano_conclusao && `(${f.ano_conclusao})`}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFormacao(index)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab Atribuições */}
            <TabsContent value="atribuicoes" className="space-y-4">
              {/* Formulário para adicionar atribuição */}
              <Card className="bg-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Adicionar Atribuição</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Etapa *</Label>
                      <Select value={novaAtribuicao.etapa} onValueChange={(v) => setNovaAtribuicao(p => ({ ...p, etapa: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ETAPAS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Disciplina *</Label>
                      <Select value={novaAtribuicao.disciplina} onValueChange={(v) => setNovaAtribuicao(p => ({ ...p, disciplina: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DISCIPLINAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Turma</Label>
                      <Input
                        value={novaAtribuicao.turma}
                        onChange={(e) => setNovaAtribuicao(p => ({ ...p, turma: e.target.value }))}
                        placeholder="1° ao 5°"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Carga Horária</Label>
                      <Input
                        type="number"
                        value={novaAtribuicao.carga_horaria}
                        onChange={(e) => setNovaAtribuicao(p => ({ ...p, carga_horaria: parseInt(e.target.value) || 0 }))}
                        placeholder="20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Habilitação</Label>
                      <Select value={novaAtribuicao.habilitacao} onValueChange={(v) => setNovaAtribuicao(p => ({ ...p, habilitacao: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HABILITACOES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Dias da Semana</Label>
                      <div className="flex flex-wrap gap-2">
                        {DIAS_SEMANA.map(dia => (
                          <Button
                            key={dia}
                            type="button"
                            variant={novaAtribuicao.dias_semana.includes(dia) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleDiaSemana(dia)}
                            className="w-12"
                          >
                            {dia}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button type="button" onClick={addAtribuicao} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Atribuição
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de atribuições */}
              {formData.atribuicoes.length > 0 && (
                <div className="space-y-2">
                  <Label>Atribuições Cadastradas</Label>
                  {formData.atribuicoes.map((a, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div>
                        <p className="font-medium">{a.disciplina} - {a.etapa}</p>
                        <p className="text-sm text-slate-500">
                          Turma: {a.turma || '-'} | {a.dias_semana?.join(', ')} | {a.carga_horaria}h
                          <Badge 
                            variant={a.habilitacao === 'HABILITADO' ? 'default' : 'destructive'}
                            className="ml-2"
                          >
                            {a.habilitacao}
                          </Badge>
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeAtribuicao(index)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-teal-700 hover:bg-teal-800">
              {editingId ? 'Salvar Alterações' : 'Cadastrar Professor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Professor</DialogTitle>
          </DialogHeader>

          {selectedProfessor && (
            <div className="space-y-6">
              {/* Dados Pessoais */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Nome</p>
                    <p className="font-medium">{selectedProfessor.nome}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">CPF</p>
                    <p className="font-medium font-mono">{formatCPF(selectedProfessor.cpf)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Telefone</p>
                    <p className="font-medium">{formatPhone(selectedProfessor.telefone) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">E-mail</p>
                    <p className="font-medium">{selectedProfessor.email || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Dados Profissionais */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Dados Profissionais
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Vínculo</p>
                    <Badge>{selectedProfessor.vinculo}</Badge>
                  </div>
                  <div>
                    <p className="text-slate-500">Função</p>
                    <p className="font-medium">{selectedProfessor.funcao}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Carga Horária</p>
                    <p className="font-medium">{selectedProfessor.carga_horaria_semanal}h/semana</p>
                  </div>
                </div>
              </div>

              {/* Formações */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Formações ({selectedProfessor.formacoes?.length || 0})
                </h3>
                {selectedProfessor.formacoes?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProfessor.formacoes.map((f, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm">
                        <p className="font-medium">{f.tipo}: {f.curso}</p>
                        <p className="text-slate-500">{f.instituicao} {f.ano_conclusao && `(${f.ano_conclusao})`}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Nenhuma formação cadastrada</p>
                )}
              </div>

              {/* Atribuições */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Atribuições ({selectedProfessor.atribuicoes?.length || 0})
                </h3>
                {selectedProfessor.atribuicoes?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProfessor.atribuicoes.map((a, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{a.disciplina}</p>
                          <Badge variant={a.habilitacao === 'HABILITADO' ? 'default' : 'destructive'}>
                            {a.habilitacao}
                          </Badge>
                        </div>
                        <p className="text-slate-500">
                          {a.etapa} | Turma: {a.turma || '-'} | {a.dias_semana?.join(', ')} | {a.carga_horaria}h
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Nenhuma atribuição cadastrada</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => { setViewDialogOpen(false); openDialog(selectedProfessor); }} className="bg-teal-700 hover:bg-teal-800">
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
