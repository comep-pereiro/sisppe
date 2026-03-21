import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { KeyRound, ArrowLeft, Mail } from 'lucide-react';

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('escola');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await authAPI.recuperarSenha({ email, tipo });
      setSubmitted(true);
      toast.success('Instruções enviadas para o email!');
    } catch (error) {
      toast.error('Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" data-testid="recuperar-success">
        <Card className="max-w-lg w-full animate-slideInBottom">
          <CardContent className="pt-10 pb-8 text-center">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope' }}>
              Email Enviado!
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Se o email estiver cadastrado no sistema, você receberá instruções para recuperação de senha em breve.
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" data-testid="recuperar-senha-page">
      <Card className="max-w-md w-full animate-slideInBottom">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-teal-700" />
          </div>
          <CardTitle className="text-2xl" style={{ fontFamily: 'Manrope' }}>
            Recuperar Senha
          </CardTitle>
          <CardDescription>
            Digite seu email para receber instruções de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Tipo de Conta</Label>
              <RadioGroup value={tipo} onValueChange={setTipo} className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="escola" id="escola" data-testid="radio-escola" />
                  <Label htmlFor="escola" className="font-normal cursor-pointer">
                    Escola
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" data-testid="radio-admin" />
                  <Label htmlFor="admin" className="font-normal cursor-pointer">
                    Administrador
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
                placeholder="Digite seu email cadastrado"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="btn-recuperar"
              className="w-full bg-teal-700 hover:bg-teal-800"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Enviar Instruções'
              )}
            </Button>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                data-testid="link-voltar"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
