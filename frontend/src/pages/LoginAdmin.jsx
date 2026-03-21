import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginAdmin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  });
  const [showPassword, setShowPassword] = useState(false);
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
    setLoading(true);
    
    try {
      const response = await authAPI.loginAdmin(formData);
      const { access_token, user_data, user_type } = response.data;
      
      login(access_token, user_data, user_type);
      toast.success('Login realizado com sucesso!');
      navigate('/admin/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao realizar login';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" data-testid="login-admin-page">
      {/* Left Panel - Form */}
      <div className="flex flex-col justify-center px-8 lg:px-16 py-12 bg-white">
        <div className="max-w-md mx-auto w-full animate-slideInLeft">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
            data-testid="link-voltar"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para área da escola
          </Link>

          {/* Logo and Title */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>
                  COMEP
                </h1>
                <p className="text-sm text-slate-500">Área Administrativa</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope' }}>
              Acesso Restrito
            </h2>
            <p className="text-slate-600">
              Área exclusiva para funcionários do Conselho Municipal de Educação
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Digite seu email institucional"
                value={formData.email}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                required
                data-testid="input-email"
                className="h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
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
                  className="h-12 pr-12 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
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

            <Button
              type="submit"
              disabled={loading}
              data-testid="btn-login-admin"
              className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white font-medium shadow-sm transition-all duration-200"
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
          <div className="mt-6 text-center">
            <Link
              to="/recuperar-senha"
              className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
              data-testid="link-recuperar-senha-admin"
            >
              Esqueci minha senha
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
            <p>Conselho Municipal de Educação de Pereiro - COMEP</p>
            <p className="mt-1">Acesso exclusivo para funcionários autorizados</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Hero Image */}
      <div className="hidden lg:block relative">
        <img
          src="https://images.pexels.com/photos/6683991/pexels-photo-6683991.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="Administração escolar"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-800/95 flex flex-col justify-end p-12">
          <div className="animate-slideInRight">
            <h3 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope' }}>
              Gestão Educacional
            </h3>
            <p className="text-slate-300 text-lg max-w-lg leading-relaxed">
              Monitore e gerencie todas as escolas da rede municipal em uma única plataforma integrada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
