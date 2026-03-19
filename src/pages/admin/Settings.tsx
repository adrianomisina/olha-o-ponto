import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Building2, Mail, Phone, MapPin, Users, Save, Bell, BellOff } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { registerServiceWorker, subscribeUserToPush } from '../../utils/pushNotifications';
import Button from '../../components/Button';

const AdminSettings = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [company, setCompany] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    employeesLimit: 10,
    plan: 'basic',
    subscriptionStatus: 'pending',
    trialEndsAt: '',
  });

  const planPrices = {
    basic: 49.90,
    professional: 149.90,
    enterprise: 399.90
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompany({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          employeesLimit: data.employeesLimit || 3,
          plan: data.plan || 'free',
          subscriptionStatus: data.subscriptionStatus || 'active',
          trialEndsAt: data.trialEndsAt || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(company)
      });
      if (res.ok) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar configurações.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro de conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayment = () => {
    navigate(`/admin/checkout?plan=${company.plan}`);
  };

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        await registerServiceWorker();
        await subscribeUserToPush(token!);
        toast.success('Notificações ativadas!');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Erro ao ativar notificações');
    }
  };

  const handleTestNotification = async () => {
    setIsTestingPush(true);
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Notificação de teste enviada!');
      } else {
        toast.error('Erro ao enviar notificação de teste');
      }
    } catch (error) {
      console.error('Error testing notification:', error);
      toast.error('Erro de conexão');
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleCancelSubscription = () => {
    if (window.confirm('Tem certeza que deseja cancelar sua assinatura? Você voltará para o plano gratuito ao final do período.')) {
      toast.success('Solicitação de cancelamento enviada. Nossa equipe entrará em contato.');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-500">Carregando configurações...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col w-full"
    >
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4">
        <h1 className="text-xl font-bold">Configurações da Empresa</h1>
      </div>

      <div className="p-6">
        {company.subscriptionStatus === 'blocked' && (
          <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4">
            <p className="text-sm font-semibold text-rose-300">Acesso bloqueado por falta de pagamento.</p>
            <p className="mt-1 text-sm text-zinc-300">
              O teste gratuito terminou em {company.trialEndsAt ? new Date(company.trialEndsAt).toLocaleString('pt-BR') : '--'}.
            </p>
            <button
              type="button"
              onClick={handlePayment}
              className="mt-3 text-sm font-bold text-sky-400 hover:underline"
            >
              Regularizar assinatura
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">Dados Gerais</h2>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Nome da Empresa</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={company.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Nome da Empresa"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Email de Contato</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={company.email}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Telefone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={company.phone}
                  onChange={handleChange}
                  maxLength={20}
                  className="block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Endereço</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  name="address"
                  value={company.address}
                  onChange={handleChange}
                  maxLength={200}
                  className="block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Endereço completo"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">Notificações</h2>
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${notificationPermission === 'granted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                    {notificationPermission === 'granted' ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-white">Push Notifications</p>
                    <p className="text-xs text-zinc-500">
                      {notificationPermission === 'granted' 
                        ? 'Você está inscrito para receber notificações importantes.' 
                        : 'Ative para receber alertas sobre aprovações e pagamentos.'}
                    </p>
                  </div>
                </div>
                {notificationPermission !== 'granted' ? (
                  <Button
                    type="button"
                    onClick={handleEnableNotifications}
                    variant="secondary"
                    size="sm"
                  >
                    Ativar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleTestNotification}
                    isLoading={isTestingPush}
                    variant="secondary"
                    size="sm"
                  >
                    Testar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">Assinatura</h2>
            
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-zinc-400 text-sm">Plano Atual:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white uppercase">{company.plan}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      company.subscriptionStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {company.subscriptionStatus === 'paid' ? 'Ativo' : 'Pagamento Pendente'}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 mt-1">
                    R$ {planPrices[company.plan as keyof typeof planPrices]?.toFixed(2)} / mês
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleCancelSubscription}
                    variant="outline"
                    size="sm"
                    className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                  >
                    Cancelar Assinatura
                  </Button>
                  <Button
                    type="button"
                    onClick={() => navigate('/admin/payments')}
                    variant="secondary"
                    size="sm"
                  >
                    Gerenciar Planos
                  </Button>
                </div>
              </div>

              {company.subscriptionStatus !== 'paid' && (
                <div className="mt-6 p-4 border border-sky-500/30 bg-sky-500/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-white">Pagamento Pendente</p>
                    <p className="text-xs text-zinc-400">Seu plano {company.plan} requer pagamento para continuar ativo.</p>
                  </div>
                  <Button
                    type="button"
                    onClick={handlePayment}
                    variant="primary"
                    size="sm"
                  >
                    Ir para o Checkout
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              isLoading={isSaving}
              variant="primary"
              size="full"
            >
              <Save className="w-5 h-5" />
              Salvar Configurações
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
