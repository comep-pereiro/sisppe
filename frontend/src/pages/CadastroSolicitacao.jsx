import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { solicitacoesAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { School, ArrowLeft, CheckCircle } from 'lucide-react';

export default function CadastroSolicitacao() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    codigo_censo: '',
    nome_escola: '',
    endereco: '',
    telefone: '',
    email_escola: '',
    nome_responsavel: '',
    cpf_responsavel: '',
    email_responsavel: '',
    justificativa: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await solicitacoesAPI.criar(formData);
      setSubmitted(true);
      toast.success('Solicitação enviada com sucesso!');
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao enviar solicitação';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" data-testid="cadastro-success">
        <Card className="max-w-lg w-full animate-slideInBottom">
          <CardContent className="pt-10 pb-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope' }}>
              Solicitação Enviada!
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Sua solicitação de cadastro foi recebida com sucesso. O COMEP analisará suas informações e entrará em contato através do email informado.
            </p>
            <Button
              onClick={() => navigate('/')}
              data-testid="btn-voltar-login"
              className="bg-teal-700 hover:bg-teal-800"
            >
              Voltar para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4" data-testid="cadastro-page">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slideInBottom">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
            data-testid="link-voltar"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-700 rounded-xl flex items-center justify-center shadow-lg">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
                Solicitação de Cadastro
              </h1>
              <p className="text-sm text-slate-500">COMEP - Pereiro/CE</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="animate-slideInBottom stagger-1">
          <CardHeader>
            <CardTitle>Dados da Escola</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para solicitar o cadastro da sua escola no sistema COMEP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados da Escola */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo_censo">Código de Censo *</Label>
                  <Input
                    id="codigo_censo"
                    name="codigo_censo"
                    value={formData.codigo_censo}
                    onChange={handleChange}
                    required
                    data-testid="input-codigo-censo"
                    placeholder="Ex: 23456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_escola">Nome da Escola *</Label>
                  <Input
                    id="nome_escola"
                    name="nome_escola"
                    value={formData.nome_escola}
                    onChange={handleChange}
                    required
                    data-testid="input-nome-escola"
                    placeholder="Ex: Escola Municipal..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo *</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  required
                  data-testid="input-endereco"
                  placeholder="Rua, número, bairro, cidade - CE"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    data-testid="input-telefone"
                    placeholder="(88) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_escola">Email da Escola</Label>
                  <Input
                    id="email_escola"
                    name="email_escola"
                    type="email"
                    value={formData.email_escola}
                    onChange={handleChange}
                    data-testid="input-email-escola"
                    placeholder="escola@email.com"
                  />
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>
                  Dados do Responsável
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_responsavel">Nome Completo *</Label>
                  <Input
                    id="nome_responsavel"
                    name="nome_responsavel"
                    value={formData.nome_responsavel}
                    onChange={handleChange}
                    required
                    data-testid="input-nome-responsavel"
                    placeholder="Nome do diretor(a)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf_responsavel">CPF *</Label>
                  <Input
                    id="cpf_responsavel"
                    name="cpf_responsavel"
                    value={formData.cpf_responsavel}
                    onChange={handleChange}
                    required
                    data-testid="input-cpf-responsavel"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_responsavel">Email do Responsável *</Label>
                <Input
                  id="email_responsavel"
                  name="email_responsavel"
                  type="email"
                  value={formData.email_responsavel}
                  onChange={handleChange}
                  required
                  data-testid="input-email-responsavel"
                  placeholder="responsavel@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa do Cadastro *</Label>
                <Textarea
                  id="justificativa"
                  name="justificativa"
                  value={formData.justificativa}
                  onChange={handleChange}
                  required
                  data-testid="input-justificativa"
                  placeholder="Descreva o motivo da solicitação de cadastro..."
                  rows={4}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  data-testid="btn-cancelar"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="btn-enviar-solicitacao"
                  className="bg-teal-700 hover:bg-teal-800"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    'Enviar Solicitação'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
