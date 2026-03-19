import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Users, UserCheck, UserX, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Pagamento processado com sucesso! Sua assinatura está ativa.', {
        duration: 5000,
        icon: <CheckCircle2 className="text-emerald-500" />
      });
    } else if (paymentStatus === 'failure') {
      toast.error('Ocorreu um erro ao processar seu pagamento. Tente novamente.', {
        duration: 5000,
        icon: <AlertCircle className="text-rose-500" />
      });
    } else if (paymentStatus === 'pending') {
      toast('Seu pagamento está sendo processado. Avisaremos quando for aprovado.', {
        duration: 5000,
        icon: '⏳'
      });
    }
  }, [searchParams]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Erro ao carregar dashboard');
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  if (!stats) return <div className="p-8 text-center text-zinc-500">Carregando dashboard...</div>;

  return (
    <div className="flex flex-col w-full">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Visão Geral</h1>
        {stats.accessBlocked ? (
          <div className="bg-rose-500/10 border border-rose-500/50 px-3 py-1 rounded-full flex items-center gap-2 text-rose-400 text-xs font-bold">
            <AlertCircle className="w-3 h-3" />
            Assinatura Bloqueada
          </div>
        ) : stats.plan !== 'free' && stats.subscriptionStatus !== 'paid' && (
          <div className="bg-amber-500/10 border border-amber-500/50 px-3 py-1 rounded-full flex items-center gap-2 text-amber-500 text-xs font-bold">
            <Activity className="w-3 h-3" />
            Pagamento Pendente
          </div>
        )}
      </div>

      <div className="p-4 border-b border-zinc-800">
        {stats.accessBlocked && (
          <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4">
            <p className="text-sm font-semibold text-rose-300">Assinatura bloqueada por falta de pagamento.</p>
            <p className="mt-1 text-sm text-zinc-300">
              O período de teste terminou em {stats.trialEndsAt ? format(new Date(stats.trialEndsAt), 'dd/MM/yyyy HH:mm') : '--'}.
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin/payments')}
              className="mt-3 text-sm font-bold text-sky-400 hover:underline"
            >
              Ir para pagamentos
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-900/30">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-sky-500" />
              <p className="text-sm font-medium text-zinc-400">Total Funcionários</p>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.totalEmployees} <span className="text-sm text-zinc-500 font-normal">/ {stats.employeesLimit}</span>
            </p>
          </div>

          <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-900/30">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-medium text-zinc-400">Presentes Hoje</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.presentToday}</p>
          </div>

          <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-900/30">
            <div className="flex items-center gap-3 mb-2">
              <UserX className="w-5 h-5 text-rose-500" />
              <p className="text-sm font-medium text-zinc-400">Ausentes Hoje</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.absentToday}</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-sky-500" />
          Atividade Recente
        </h2>
      </div>

      <div>
        {stats.recentActivity && stats.recentActivity.length > 0 ? (
          stats.recentActivity.map((record: any) => (
            <div key={record._id} className="p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-white">
                {record.userId?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{record.userId?.name || 'Desconhecido'}</span>
                  <span className="text-zinc-500 text-sm">·</span>
                  <span className="text-zinc-500 text-sm">{format(new Date(record.timestamp), "HH:mm")}</span>
                </div>
                <p className="text-zinc-200 mt-1">
                  Registrou <span className="font-bold text-sky-500">{
                    record.type === 'in' ? 'Entrada' : 
                    record.type === 'out' ? 'Saída' : 
                    record.type === 'break_start' ? 'Início Intervalo' : 'Fim Intervalo'
                  }</span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-zinc-500 border-b border-zinc-800">
            Nenhuma atividade recente hoje.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
