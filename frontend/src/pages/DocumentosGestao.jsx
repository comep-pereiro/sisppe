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
import { Badge } from '@/components/ui/badge';
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
  Trash2,
  Home,
  Boxes,
  Download,
  Upload,
  File,
  FileCheck,
  FolderOpen
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

// Tipos de documentos
const TIPOS_DOCUMENTOS = [
  "ATA DE APROVAÇÃO DO REGIMENTO ESCOLAR",
  "REGIMENTO ESCOLAR",
  "PROJETO POLÍTICO PEDAGÓGICO (PPP)",
  "MATRIZ CURRICULAR - EDUCAÇÃO INFANTIL",
  "MATRIZ CURRICULAR - ENSINO FUNDAMENTAL ANOS INICIAIS",
  "MATRIZ CURRICULAR - ENSINO FUNDAMENTAL ANOS FINAIS",
  "MATRIZ CURRICULAR - EJA",
  "PLANO DE GESTÃO",
  "CALENDÁRIO ESCOLAR",
  "ATA DO CONSELHO ESCOLAR",
  "OUTROS"
];

// Formatador de tamanho de arquivo
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Formatador de data
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function DocumentosGestao() {
  const { token, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentos, setDocumentos] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: '',
    descricao: '',
    arquivo: null
  });

  const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchDocumentos();
  }, []);

  const fetchDocumentos = async () => {
    try {
      const response = await api.get('/documentos-gestao');
      setDocumentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ tipo: '', descricao: '', arquivo: null });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo: 10MB');
        return;
      }
      // Validar tipo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG ou PNG.');
        return;
      }
      setFormData(prev => ({ ...prev, arquivo: file }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.tipo || !formData.arquivo) {
      toast.error('Selecione o tipo e o arquivo');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', formData.arquivo);
      
      const params = new URLSearchParams();
      params.append('tipo', formData.tipo);
      if (formData.descricao) {
        params.append('descricao', formData.descricao);
      }

      await api.post(`/documentos-gestao?${params.toString()}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Documento enviado com sucesso!');
      setDialogOpen(false);
      resetForm();
      fetchDocumentos();
    } catch (error) {
      console.error('Erro ao enviar:', error);
      if (error.response?.status === 403) {
        toast.error('Escola bloqueada para edição');
      } else {
        toast.error(error.response?.data?.detail || 'Erro ao enviar documento');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(`/documentos-gestao/${doc.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.nome_arquivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este documento?')) return;

    try {
      await api.delete(`/documentos-gestao/${id}`);
      toast.success('Documento excluído com sucesso!');
      fetchDocumentos();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      if (error.response?.status === 403) {
        toast.error('Escola bloqueada para edição');
      } else {
        toast.error('Erro ao excluir documento');
      }
    }
  };

  // Agrupar documentos por tipo
  const documentosPorTipo = documentos.reduce((acc, doc) => {
    if (!acc[doc.tipo]) acc[doc.tipo] = [];
    acc[doc.tipo].push(doc);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50" data-testid="documentos-gestao">
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
                    Instrumentos de Gestão
                  </h1>
                  <p className="text-sm text-slate-500">Documentos pedagógicos e administrativos</p>
                </div>
              </div>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="bg-teal-700 hover:bg-teal-800"
                data-testid="btn-novo-documento"
              >
                <Upload className="w-4 h-4 mr-2" />
                Enviar Documento
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
                          <FileCheck className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Total de Documentos</p>
                          <p className="text-2xl font-bold text-slate-900">{documentos.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FolderOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Categorias</p>
                          <p className="text-2xl font-bold text-slate-900">{Object.keys(documentosPorTipo).length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                          <File className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Tamanho Total</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {formatFileSize(documentos.reduce((sum, d) => sum + (d.tamanho || 0), 0))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela de documentos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos Enviados</CardTitle>
                    <CardDescription>
                      Instrumentos de gestão da escola (PPP, Regimento, Matrizes Curriculares, etc.)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {documentos.length === 0 ? (
                      <div className="text-center py-12">
                        <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhum documento enviado</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setDialogOpen(true)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Enviar primeiro documento
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Aspecto Pedagógico</TableHead>
                            <TableHead>Nome do Arquivo</TableHead>
                            <TableHead className="text-center">Tamanho</TableHead>
                            <TableHead className="text-center">Data do Cadastro</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documentos.map((doc, index) => (
                            <TableRow key={doc.id} data-testid={`documento-row-${doc.id}`}>
                              <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-normal">
                                  {doc.tipo}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium max-w-xs truncate">
                                {doc.nome_arquivo}
                              </TableCell>
                              <TableCell className="text-center text-slate-500">
                                {formatFileSize(doc.tamanho)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatDate(doc.data_cadastro)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                    data-testid={`btn-download-${doc.id}`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(doc.id)}
                                    data-testid={`btn-excluir-${doc.id}`}
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

      {/* Dialog de Upload */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar Documento</DialogTitle>
            <DialogDescription>
              Selecione o tipo e faça upload do arquivo (PDF, DOC, DOCX, JPG ou PNG - máx. 10MB)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Documento *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v }))}
              >
                <SelectTrigger data-testid="select-tipo-documento">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTOS.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição adicional do documento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arquivo">Arquivo *</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                <input
                  id="arquivo"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-arquivo"
                />
                <label htmlFor="arquivo" className="cursor-pointer">
                  {formData.arquivo ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileCheck className="w-8 h-8 text-teal-600" />
                      <div className="text-left">
                        <p className="font-medium text-slate-700">{formData.arquivo.name}</p>
                        <p className="text-sm text-slate-500">{formatFileSize(formData.arquivo.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">Clique para selecionar ou arraste o arquivo</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, JPG ou PNG (máx. 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-teal-700 hover:bg-teal-800"
              disabled={uploading}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
