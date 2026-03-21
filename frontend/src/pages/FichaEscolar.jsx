import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  Save,
  Building2,
  MapPin,
  Phone,
  Globe,
  Settings,
  Home,
  Boxes,
  ClipboardList,
  FolderOpen
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Sidebar Component (reutilizado)
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
    { path: '/escola/documentos', icon: FolderOpen, label: 'Documentos de Gestão' },
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
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Manrope' }}>SISPPe</h1>
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

export default function FichaEscolar() {
  const { token, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Identificação
    codigo_censo: '',
    cnpj: '',
    numero_ato_criacao: '',
    data_ato_criacao: '',
    escolas_nucleadas: '',
    
    // Endereço
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    municipio: 'PEREIRO',
    estado: 'CEARÁ',
    crede: '11 - JAGUARIBE',
    
    // Contato
    telefone: '',
    fax: '',
    email: '',
    
    // Características
    acesso_internet: '',
    sistema_escrituracao_informatizado: false,
    assentamento: false,
    quilombola: false,
    indigena: false,
    rural: false,
    
    // Dados físicos
    area_total_m2: '',
    qtd_dias_letivos: 200,
    carga_horaria_semanal: 40,
    tipo_escola: 'Educação Básica',
    
    // Mantenedora
    mantenedora_cnpj: '07.570.518/0001-00',
    mantenedora_razao_social: 'PREFEITURA MUNICIPAL DE PEREIRO',
    mantenedora_nome_fantasia: 'PREFEITURA MUNICIPAL DE PEREIRO',
    mantenedora_endereco: 'RUA DR. ANTONIO AUGUSTO DE VASCONCELOS, 227',
    mantenedora_telefone: '(88) 3527-1250',
    mantenedora_email: 'pmpereiro@gmail.com',
    tipo_mantenedora: 'PÚBLICA',
    natureza_juridica: 'OUTRAS FORMAS DE ASSOCIAÇÃO',
    atividade_principal: 'ADMINISTRAÇÃO PÚBLICA EM GERAL',
  });

  const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      const response = await api.get('/escola/dados-instituicao');
      const dados = response.data;
      
      // Mescla os dados recebidos com os valores padrão
      setFormData(prev => ({
        ...prev,
        ...dados,
        // Garante que campos numéricos tenham valores
        area_total_m2: dados.area_total_m2 || '',
        qtd_dias_letivos: dados.qtd_dias_letivos || 200,
        carga_horaria_semanal: dados.carga_horaria_semanal || 40,
      }));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da instituição');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.put('/escola/dados-instituicao', formData);
      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      if (error.response?.status === 403) {
        toast.error('Escola bloqueada para edição');
      } else {
        toast.error('Erro ao salvar dados');
      }
    } finally {
      setSaving(false);
    }
  };

  const tiposInternet = [
    'FIBRA ÓPTICA',
    'ADSL',
    'CABO',
    'RÁDIO',
    'SATELITE',
    'NÃO POSSUI'
  ];

  const tiposEscola = [
    'Educação Básica',
    'Educação Infantil',
    'Ensino Fundamental',
    'EJA',
    'Outros'
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="ficha-escolar">
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
                    Ficha Escolar
                  </h1>
                  <p className="text-sm text-slate-500">Dados da Instituição</p>
                </div>
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={saving || loading}
                className="bg-teal-700 hover:bg-teal-800"
                data-testid="btn-salvar"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
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
              <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
                <Tabs defaultValue="identificacao" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
                    <TabsTrigger value="identificacao" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Identificação</span>
                    </TabsTrigger>
                    <TabsTrigger value="endereco" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="hidden sm:inline">Endereço</span>
                    </TabsTrigger>
                    <TabsTrigger value="contato" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="hidden sm:inline">Contato</span>
                    </TabsTrigger>
                    <TabsTrigger value="caracteristicas" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Características</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab Identificação */}
                  <TabsContent value="identificacao">
                    <Card>
                      <CardHeader>
                        <CardTitle>Identificação da Instituição</CardTitle>
                        <CardDescription>Dados básicos de identificação da escola</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="codigo_censo">Código de Censo</Label>
                            <Input
                              id="codigo_censo"
                              value={formData.codigo_censo || ''}
                              onChange={(e) => handleChange('codigo_censo', e.target.value)}
                              placeholder="Ex: 23274778"
                              data-testid="input-codigo-censo"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cnpj">CNPJ</Label>
                            <MaskedInput
                              id="cnpj"
                              mask="cnpj"
                              value={formData.cnpj || ''}
                              onChange={(e) => handleChange('cnpj', e.target.value)}
                              placeholder="00.000.000/0000-00"
                              data-testid="input-cnpj"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="numero_ato_criacao">Nº Ato de Criação</Label>
                            <Input
                              id="numero_ato_criacao"
                              value={formData.numero_ato_criacao || ''}
                              onChange={(e) => handleChange('numero_ato_criacao', e.target.value)}
                              placeholder="Ex: Decreto 116"
                              data-testid="input-ato-criacao"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="data_ato_criacao">Data do Ato de Criação</Label>
                            <Input
                              id="data_ato_criacao"
                              type="date"
                              value={formData.data_ato_criacao || ''}
                              onChange={(e) => handleChange('data_ato_criacao', e.target.value)}
                              data-testid="input-data-ato"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="escolas_nucleadas">Escola(s) Nucleada(s)</Label>
                            <Input
                              id="escolas_nucleadas"
                              value={formData.escolas_nucleadas || ''}
                              onChange={(e) => handleChange('escolas_nucleadas', e.target.value)}
                              placeholder="Escolas vinculadas (se houver)"
                              data-testid="input-nucleadas"
                            />
                          </div>
                        </div>

                        {/* Mantenedora */}
                        <div className="border-t pt-6 mt-6">
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Mantenedora</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="mantenedora_cnpj">CNPJ</Label>
                              <MaskedInput
                                id="mantenedora_cnpj"
                                mask="cnpj"
                                value={formData.mantenedora_cnpj || ''}
                                onChange={(e) => handleChange('mantenedora_cnpj', e.target.value)}
                                data-testid="input-mantenedora-cnpj"
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="mantenedora_razao_social">Razão Social</Label>
                              <Input
                                id="mantenedora_razao_social"
                                value={formData.mantenedora_razao_social || ''}
                                onChange={(e) => handleChange('mantenedora_razao_social', e.target.value)}
                                data-testid="input-mantenedora-razao"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="tipo_mantenedora">Tipo</Label>
                              <Select 
                                value={formData.tipo_mantenedora} 
                                onValueChange={(v) => handleChange('tipo_mantenedora', v)}
                              >
                                <SelectTrigger data-testid="select-tipo-mantenedora">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PÚBLICA">Pública</SelectItem>
                                  <SelectItem value="PRIVADA">Privada</SelectItem>
                                  <SelectItem value="FILANTRÓPICA">Filantrópica</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="natureza_juridica">Natureza Jurídica</Label>
                              <Input
                                id="natureza_juridica"
                                value={formData.natureza_juridica || ''}
                                onChange={(e) => handleChange('natureza_juridica', e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="atividade_principal">Atividade Principal</Label>
                              <Input
                                id="atividade_principal"
                                value={formData.atividade_principal || ''}
                                onChange={(e) => handleChange('atividade_principal', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab Endereço */}
                  <TabsContent value="endereco">
                    <Card>
                      <CardHeader>
                        <CardTitle>Endereço</CardTitle>
                        <CardDescription>Localização da instituição</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="cep">CEP</Label>
                            <MaskedInput
                              id="cep"
                              mask="cep"
                              value={formData.cep || ''}
                              onChange={(e) => handleChange('cep', e.target.value)}
                              placeholder="63460-000"
                              data-testid="input-cep"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Input
                              id="endereco"
                              value={formData.endereco || ''}
                              onChange={(e) => handleChange('endereco', e.target.value)}
                              placeholder="Rua, Avenida, etc."
                              data-testid="input-endereco"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="numero">Número</Label>
                            <Input
                              id="numero"
                              value={formData.numero || ''}
                              onChange={(e) => handleChange('numero', e.target.value)}
                              placeholder="123"
                              data-testid="input-numero"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="complemento">Complemento</Label>
                            <Input
                              id="complemento"
                              value={formData.complemento || ''}
                              onChange={(e) => handleChange('complemento', e.target.value)}
                              placeholder="Sala, Bloco, etc."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bairro">Bairro</Label>
                            <Input
                              id="bairro"
                              value={formData.bairro || ''}
                              onChange={(e) => handleChange('bairro', e.target.value)}
                              placeholder="Centro"
                              data-testid="input-bairro"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="municipio">Município</Label>
                            <Input
                              id="municipio"
                              value={formData.municipio || 'PEREIRO'}
                              onChange={(e) => handleChange('municipio', e.target.value)}
                              data-testid="input-municipio"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Input
                              id="estado"
                              value={formData.estado || 'CEARÁ'}
                              onChange={(e) => handleChange('estado', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="crede">CREDE</Label>
                            <Input
                              id="crede"
                              value={formData.crede || '11 - JAGUARIBE'}
                              onChange={(e) => handleChange('crede', e.target.value)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab Contato */}
                  <TabsContent value="contato">
                    <Card>
                      <CardHeader>
                        <CardTitle>Contato</CardTitle>
                        <CardDescription>Informações de contato da instituição</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            <Label htmlFor="fax">Fax</Label>
                            <MaskedInput
                              id="fax"
                              mask="phone"
                              value={formData.fax || ''}
                              onChange={(e) => handleChange('fax', e.target.value)}
                              placeholder="(88) 3527-1580"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email || ''}
                              onChange={(e) => handleChange('email', e.target.value)}
                              placeholder="escola@email.com"
                              data-testid="input-email"
                            />
                          </div>
                        </div>

                        {/* Contato Mantenedora */}
                        <div className="border-t pt-6 mt-6">
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Contato da Mantenedora</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="mantenedora_endereco">Endereço</Label>
                              <Input
                                id="mantenedora_endereco"
                                value={formData.mantenedora_endereco || ''}
                                onChange={(e) => handleChange('mantenedora_endereco', e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="mantenedora_telefone">Telefone</Label>
                              <MaskedInput
                                id="mantenedora_telefone"
                                mask="phone"
                                value={formData.mantenedora_telefone || ''}
                                onChange={(e) => handleChange('mantenedora_telefone', e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="mantenedora_email">E-mail</Label>
                              <Input
                                id="mantenedora_email"
                                type="email"
                                value={formData.mantenedora_email || ''}
                                onChange={(e) => handleChange('mantenedora_email', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab Características */}
                  <TabsContent value="caracteristicas">
                    <Card>
                      <CardHeader>
                        <CardTitle>Características</CardTitle>
                        <CardDescription>Dados físicos e características da instituição</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="area_total_m2">Área Total (m²)</Label>
                            <Input
                              id="area_total_m2"
                              type="number"
                              step="0.01"
                              value={formData.area_total_m2 || ''}
                              onChange={(e) => handleChange('area_total_m2', e.target.value)}
                              placeholder="Ex: 6000"
                              data-testid="input-area"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="qtd_dias_letivos">Qtd. Dias Letivos</Label>
                            <Input
                              id="qtd_dias_letivos"
                              type="number"
                              value={formData.qtd_dias_letivos || 200}
                              onChange={(e) => handleChange('qtd_dias_letivos', parseInt(e.target.value) || 0)}
                              data-testid="input-dias-letivos"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="carga_horaria_semanal">Carga Horária Semanal</Label>
                            <Input
                              id="carga_horaria_semanal"
                              type="number"
                              value={formData.carga_horaria_semanal || 40}
                              onChange={(e) => handleChange('carga_horaria_semanal', parseInt(e.target.value) || 0)}
                              data-testid="input-carga-horaria"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tipo_escola">Tipo de Escola</Label>
                            <Select 
                              value={formData.tipo_escola} 
                              onValueChange={(v) => handleChange('tipo_escola', v)}
                            >
                              <SelectTrigger data-testid="select-tipo-escola">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {tiposEscola.map(tipo => (
                                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="acesso_internet">Acesso à Internet</Label>
                            <Select 
                              value={formData.acesso_internet || ''} 
                              onValueChange={(v) => handleChange('acesso_internet', v)}
                            >
                              <SelectTrigger data-testid="select-internet">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {tiposInternet.map(tipo => (
                                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Características booleanas */}
                        <div className="border-t pt-6">
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Características Especiais</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                              <Label htmlFor="sistema_escrituracao" className="cursor-pointer">
                                Sistema de Escrituração Informatizado
                              </Label>
                              <Switch
                                id="sistema_escrituracao"
                                checked={formData.sistema_escrituracao_informatizado}
                                onCheckedChange={(v) => handleChange('sistema_escrituracao_informatizado', v)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                              <Label htmlFor="rural" className="cursor-pointer">Zona Rural</Label>
                              <Switch
                                id="rural"
                                checked={formData.rural}
                                onCheckedChange={(v) => handleChange('rural', v)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                              <Label htmlFor="assentamento" className="cursor-pointer">Assentamento</Label>
                              <Switch
                                id="assentamento"
                                checked={formData.assentamento}
                                onCheckedChange={(v) => handleChange('assentamento', v)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                              <Label htmlFor="quilombola" className="cursor-pointer">Quilombola</Label>
                              <Switch
                                id="quilombola"
                                checked={formData.quilombola}
                                onCheckedChange={(v) => handleChange('quilombola', v)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                              <Label htmlFor="indigena" className="cursor-pointer">Indígena</Label>
                              <Switch
                                id="indigena"
                                checked={formData.indigena}
                                onCheckedChange={(v) => handleChange('indigena', v)}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
