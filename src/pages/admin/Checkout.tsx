import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { CreditCard, ShieldCheck, CheckCircle2, ArrowLeft, ShoppingCart, Zap, Star, Crown, Calendar, Info } from 'lucide-react';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);

  const plan = searchParams.get('plan') || 'basic';

  const planDetails: Record<string, any> = {
    basic: {
      name: 'Basic',
      price: 49.90,
      icon: Zap,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
      features: ['Até 10 funcionários', 'Relatórios básicos', 'Suporte via email']
    },
    professional: {
      name: 'Professional',
      price: 149.90,
      icon: Star,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      features: ['Até 30 funcionários', 'Relatórios avançados', 'Suporte prioritário']
    },
    enterprise: {
      name: 'Enterprise',
      price: 399.90,
      icon: Crown,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      features: ['Até 100 funcionários', 'Relatórios customizados', 'Suporte 24/7']
    }
  };

  const currentPlan = planDetails[plan] || planDetails.basic;

  useEffect(() => {
    if (token) {
      fetchCompany();
    }
  }, [token]);

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
      } else {
        const errorData = await res.json();
        console.error('Error fetching company:', errorData);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  };

  const handlePayment = async () => {
    if (!company) {
      toast.error('Aguarde o carregamento dos dados da empresa...');
      fetchCompany();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan })
      });
      
      const data = await res.json();
      
      if (res.ok && data.init_point) {
        // Redirect to Mercado Pago
        window.location.href = data.init_point;
      } else {
        toast.error(data.message || 'Erro ao iniciar checkout');
      }
    } catch (error: any) {
      console.error('Error starting payment:', error);
      toast.error(error.message || 'Erro de conexão ao iniciar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const PlanIcon = currentPlan.icon;

  return (
    <div className="flex flex-col w-full min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-zinc-800/50 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-zinc-900 rounded-2xl transition-all active:scale-90"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter">Finalizar Pedido</h1>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Passo 2 de 2: Pagamento e Ativação</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Ambiente 100% Seguro</span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-12 max-w-3xl mx-auto w-full flex flex-col gap-10">
        {/* Plan Summary */}
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-sky-500" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Resumo do Plano</h2>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[60px] -z-10" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex gap-5">
                  <div className={`p-4 rounded-2xl ${currentPlan.bgColor} shrink-0`}>
                    <PlanIcon className={`w-10 h-10 ${currentPlan.color}`} />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl uppercase italic tracking-tighter">Plano {currentPlan.name}</h3>
                    <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                      <Calendar className="w-4 h-4" />
                      Assinatura Mensal
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black tracking-tight">R$ {currentPlan.price.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">por mês</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-800/50 pt-8">
                {currentPlan.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-zinc-400">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>

              <div className="mt-8 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-4">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-indigo-400 mb-1">Período de Teste Grátis</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Sua assinatura inclui <strong>7 dias de acesso total gratuito</strong>. 
                    O Mercado Pago solicitará a autorização do seu cartão, mas a primeira cobrança de 
                    <strong> R$ {currentPlan.price.toFixed(2)}</strong> só ocorrerá após o término do período de teste.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-4 p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
            <p className="text-xs text-zinc-500 leading-relaxed">
              Utilizamos a tecnologia do <strong>Mercado Pago</strong> para garantir que seus dados financeiros nunca sejam armazenados em nossos servidores. 
              Sua segurança é nossa prioridade máxima.
            </p>
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Pagamento</h2>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 space-y-8">
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Selecione o método de pagamento para ativar sua conta e iniciar seu teste.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-5 border border-indigo-500 bg-indigo-500/5 rounded-2xl transition-all">
                    <div className="w-12 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">Cartão de Crédito</p>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Visa, Master, Elo, etc.</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-5 border border-zinc-800 rounded-2xl bg-zinc-950/30 opacity-40 cursor-not-allowed">
                    <div className="w-12 h-8 bg-zinc-800 rounded-lg flex items-center justify-center font-black text-[10px] italic">
                      PIX
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">PIX</p>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Não disponível para teste</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-zinc-500 font-medium">Total hoje</span>
                  <span className="text-emerald-500 font-black text-xl uppercase italic tracking-tighter">R$ 0,00</span>
                </div>
                <div className="flex justify-between items-center px-2 border-t border-zinc-800 pt-4">
                  <span className="text-zinc-500 font-medium">Após 7 dias</span>
                  <span className="text-white font-black text-xl uppercase italic tracking-tighter">R$ {currentPlan.price.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                isLoading={isLoading}
                variant="primary"
                size="full"
                className="py-6 text-xl font-black uppercase italic tracking-tighter shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isLoading ? 'Processando...' : 'Confirmar e Iniciar Teste'}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                  Cobrança recorrente mensal
                </p>
                <p className="text-[9px] text-zinc-600 leading-relaxed px-4">
                  Ao confirmar, você autoriza o Mercado Pago a processar a cobrança automática após o período de teste. 
                  Você pode cancelar a qualquer momento nas configurações.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
