import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { CreditCard, Calendar, CheckCircle, XCircle, Clock, ExternalLink, ShieldCheck, Info, Zap, Star, Crown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const AdminPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const itemsPerPage = 10;

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 49.90,
      limit: 10,
      icon: Zap,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
      features: ['Até 10 funcionários', 'Relatórios básicos', 'Suporte via email']
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 149.90,
      limit: 30,
      icon: Star,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      features: ['Até 30 funcionários', 'Relatórios avançados', 'Suporte prioritário']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 399.90,
      limit: 100,
      icon: Crown,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      features: ['Até 100 funcionários', 'Relatórios customizados', 'Suporte 24/7']
    }
  ];

  useEffect(() => {
    fetchPayments(currentPage);
  }, [currentPage]);

  const fetchPayments = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payments/history?page=${page}&limit=${itemsPerPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
        setTotalPayments(data.total);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-rose-500" />;
      default: return <Clock className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  const simulatePayment = async () => {
    try {
      const res = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success('Simulação de pagamento enviada!');
        setTimeout(() => fetchPayments(currentPage), 1000);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Erro na simulação');
      }
    } catch (error) {
      toast.error('Erro na simulação');
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Histórico de Pagamentos</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={simulatePayment}
          className="text-xs border-zinc-800 hover:bg-zinc-900"
        >
          Simular Pagamento
        </Button>
      </div>

      <div className="p-6 space-y-8">
        {/* Plans Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Escolha o plano ideal para sua empresa</h2>
          <div className="space-y-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isProfessional = plan.id === 'professional';
              
              return (
                <div 
                  key={plan.id} 
                  className={`group relative bg-zinc-900/30 border ${isProfessional ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-800'} rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all duration-300 overflow-hidden`}
                >
                  {isProfessional && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-indigo-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl text-white">
                        Recomendado
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 flex-1">
                    <div className={`p-4 rounded-2xl ${plan.bgColor} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-8 h-8 ${plan.color}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        {isProfessional && <Star className="w-4 h-4 text-indigo-500 fill-indigo-500" />}
                      </div>
                      <ul className="flex flex-wrap gap-x-4 gap-y-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end gap-4 shrink-0 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-zinc-500 text-sm font-medium">R$</span>
                      <span className="text-4xl font-black text-white tracking-tight">
                        {plan.price.toFixed(2).split('.')[0]}
                      </span>
                      <span className="text-xl font-bold text-white">
                        ,{plan.price.toFixed(2).split('.')[1]}
                      </span>
                      <span className="text-zinc-500 text-xs font-medium ml-1">/mês</span>
                    </div>

                    <Button
                      variant={isProfessional ? 'primary' : 'secondary'}
                      size="md"
                      className={`w-full md:w-40 shadow-lg ${isProfessional ? 'shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-500' : 'shadow-zinc-500/5'}`}
                      onClick={() => navigate(`/admin/checkout?plan=${plan.id}`)}
                    >
                      Selecionar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-white">Pagamento Seguro</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Utilizamos o <strong>Mercado Pago</strong> para processar todos os pagamentos. Seus dados de cartão de crédito nunca são armazenados em nossos servidores.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Info className="w-4 h-4" />
              <span>O cadastro do cartão é feito no checkout do Mercado Pago.</span>
            </div>
          </div>

          <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-sky-500/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-sky-500" />
              </div>
              <h2 className="text-lg font-bold text-white">Como cadastrar cartão?</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Ao clicar em "Pagar Agora" nas configurações, você será redirecionado para o Mercado Pago. Lá você poderá:
            </p>
            <ul className="text-xs text-zinc-500 space-y-2 list-disc pl-4">
              <li>Inserir os dados do seu cartão de crédito com segurança.</li>
              <li>Salvar o cartão na sua conta Mercado Pago para futuras cobranças.</li>
              <li>Pagar via PIX ou Boleto se preferir.</li>
            </ul>
          </div>
        </div>

        <h2 className="text-lg font-bold text-white mt-8 mb-4">Histórico de Transações</h2>
        
        {isLoading ? (
          <div className="text-center text-zinc-500 py-12">Carregando histórico...</div>
        ) : payments.length === 0 ? (
          <div className="text-center text-zinc-500 py-12 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
            <CreditCard className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-lg font-medium text-zinc-400">Nenhum pagamento encontrado.</p>
            <p className="text-sm text-zinc-600 mt-1">Seus pagamentos via Mercado Pago aparecerão aqui.</p>
          </div>
        ) : (
          <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Data</th>
                    <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Plano</th>
                    <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor</th>
                    <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">ID Mercado Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-zinc-500" />
                          <span className="text-sm text-zinc-200">
                            {format(new Date(payment.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-white uppercase">
                          {payment.plan}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-mono text-white">
                          R$ {payment.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <span className={`text-sm font-medium ${
                            payment.status === 'approved' ? 'text-emerald-500' : 
                            payment.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {getStatusLabel(payment.status)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                          {payment.mercadoPagoPaymentId}
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-b-2xl">
            <p className="text-xs text-zinc-500">
              Mostrando <span className="font-bold text-zinc-300">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-zinc-300">{Math.min(currentPage * itemsPerPage, totalPayments)}</span> de <span className="font-bold text-zinc-300">{totalPayments}</span> pagamentos
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === i + 1 
                        ? 'bg-white text-black' 
                        : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 mt-4">
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center shrink-0">
            <CreditCard className="w-8 h-8 text-sky-500" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white mb-1">Precisa de ajuda com pagamentos?</h3>
            <p className="text-zinc-400 text-sm">
              Se você tiver algum problema com sua assinatura ou cobrança, entre em contato com nosso suporte ou acesse sua conta do Mercado Pago.
            </p>
          </div>
          <Button variant="primary" size="md" className="whitespace-nowrap">
            Suporte Financeiro
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
