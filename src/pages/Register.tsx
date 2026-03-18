import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Clock, Building2, User, Mail, Lock, Check } from 'lucide-react';
import Button from '../components/Button';
import toast from 'react-hot-toast';

const Register = () => {
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [plan, setPlan] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const plans = [
    { id: 'basic', name: 'Basic', price: 49.90, features: ['Até 10 funcionários', 'Relatórios básicos', 'Suporte via email'] },
    { id: 'professional', name: 'Professional', price: 149.90, features: ['Até 30 funcionários', 'Relatórios avançados', 'Suporte prioritário'] },
    { id: 'enterprise', name: 'Enterprise', price: 399.90, features: ['Até 100 funcionários', 'Relatórios customizados', 'Suporte 24/7'] }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, userName, email, password, plan })
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.user, data.token);
        toast.success('Cadastro realizado! Vamos configurar seu teste grátis.');
        navigate(`/admin/checkout?plan=${plan}`);
      } else {
        toast.error(data.message || 'Erro ao realizar cadastro');
      }
    } catch (error) {
      toast.error('Erro de conexão ao realizar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Info */}
        <div className="hidden lg:block space-y-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter uppercase italic">Olha o Ponto</span>
          </div>
          
          <h1 className="text-6xl font-black text-white leading-tight tracking-tighter uppercase italic">
            Controle de ponto <span className="text-indigo-500">inteligente</span> para sua empresa.
          </h1>
          
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-4 text-zinc-400">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-lg">Teste grátis por 7 dias sem compromisso</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-lg">Cancele a qualquer momento antes da cobrança</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-lg">Suporte especializado para sua implantação</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[80px] -z-10" />
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Crie sua conta</h2>
            <p className="text-zinc-400">Preencha os dados abaixo para iniciar seu teste de 7 dias.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome da Empresa</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    required
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="Minha Empresa LTDA"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Seu Nome</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    required
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="Nome completo"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  required
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="password"
                    required
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Confirmar Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="password"
                    required
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="space-y-4 pt-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Escolha seu Plano</label>
              <div className="grid grid-cols-1 gap-3">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                      plan === p.id 
                        ? 'bg-indigo-500/10 border-indigo-500 text-white ring-4 ring-indigo-500/5' 
                        : 'bg-zinc-950/30 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        plan === p.id ? 'border-indigo-500' : 'border-zinc-700'
                      }`}>
                        {plan === p.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-base">{p.name}</p>
                        <p className="text-xs opacity-50">{p.features[0]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg">R$ {p.price.toFixed(2)}</p>
                      <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest">por mês</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-start gap-2 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Ao clicar em continuar, você será redirecionado para inserir seus dados de pagamento. 
                  <span className="text-indigo-400 font-bold"> Nenhuma cobrança será feita nos primeiros 7 dias.</span>
                </p>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-5 text-xl font-black uppercase italic tracking-tighter shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : 'Iniciar Teste Grátis'}
            </Button>

            <p className="text-center text-zinc-500 text-sm">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-indigo-500 font-bold hover:underline">
                Fazer Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
