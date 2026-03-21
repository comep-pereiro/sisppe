import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { School, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginEscola() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    codigo_inep: '',
    cpf: '',
    senha: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e) => {
    setCapsLock(e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast.error('Você deve aceitar os termos de uso para continuar');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.loginEscola(formData);
      const { access_token, user_data, user_type } = response.data;
      
      login(access_token, user_data, user_type);
      toast.success('Login realizado com sucesso!');
      navigate('/escola/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao realizar login';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" data-testid="login-escola-page">
      {/* Left Panel - Form */}
      <div className="flex flex-col justify-center px-8 lg:px-16 py-12 bg-white">
        <div className="max-w-md mx-auto w-full animate-slideInLeft">
          {/* Logo and Title */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                <School className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>
                  COMEP
                </h1>
                <p className="text-sm text-slate-500">Pereiro - CE</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope' }}>
              Área da Escola
            </h2>
            <p className="text-slate-600">
              Sistema de Monitoramento das Escolas Municipais
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="codigo_inep" className="text-sm font-medium text-slate-700">
                Código INEP
              </Label>
              <Input
                id="codigo_inep"
                name="codigo_inep"
                type="text"
                placeholder="Digite o código INEP da escola"
                value={formData.codigo_inep}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                required
                data-testid="input-codigo-inep"
                className="h-12 border-slate-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-sm font-medium text-slate-700">
                CPF
              </Label>
              <Input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="Digite seu CPF"
                value={formData.cpf}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                required
                data-testid="input-cpf"
                className="h-12 border-slate-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-sm font-medium text-slate-700">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={formData.senha}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  required
                  data-testid="input-senha"
                  className="h-12 pr-12 border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  data-testid="toggle-password"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {capsLock && (
                <div className="flex items-center gap-2 text-amber-600 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Caps Lock Ativado</span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                data-testid="checkbox-terms"
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                Declaro ter lido e aceitado os{' '}
                <a href="#" className="text-teal-700 hover:underline font-medium">
                  Termos de uso do sistema
                </a>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="btn-login"
              className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-sm transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-3 text-center">
            <Link
              to="/recuperar-senha"
              className="block text-sm text-teal-700 hover:text-teal-800 font-medium transition-colors"
              data-testid="link-recuperar-senha"
            >
              Esqueci minha senha
            </Link>
            <Link
              to="/cadastro"
              className="block text-sm text-slate-600 hover:text-slate-900 transition-colors"
              data-testid="link-cadastro"
            >
              Ainda não possui cadastro? <span className="font-medium text-teal-700">Solicite aqui</span>
            </Link>
          </div>

          {/* Admin Link */}
          <div className="mt-10 pt-6 border-t border-slate-200">
            <Link
              to="/admin/login"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              data-testid="link-admin"
            >
              Área Administrativa (acesso restrito aos funcionários do COMEP)
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-400">
            <p>Conselho Municipal de Educação de Pereiro - COMEP</p>
            <p className="mt-1">Versão 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Hero Image */}
      <div className="hidden lg:block relative">
        <img
          src="https://images.pexels.com/photos/5211446/pexels-photo-5211446.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="Estudantes em sala de aula"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 login-hero-overlay flex flex-col justify-end p-12">
          <div className="animate-slideInRight">
            <h3 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope' }}>
              Sistema de Monitoramento Escolar
            </h3>
            <p className="text-teal-100 text-lg max-w-lg leading-relaxed">
              Plataforma integrada para gestão e acompanhamento das escolas da rede municipal de ensino de Pereiro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
