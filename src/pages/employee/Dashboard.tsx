import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, LogIn, LogOut, Coffee, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../../components/Button';

const EmployeeDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [punchNotes, setPunchNotes] = useState('');
  const [pendingPunchType, setPendingPunchType] = useState<string | null>(null);
  const [tempLocation, setTempLocation] = useState<{lat: number, lng: number} | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    type: 'in',
    reason: ''
  });
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [pendingAdjustments, setPendingAdjustments] = useState<any[]>([]);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const { token, user } = useAuthStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchDashboardData();
    fetchPendingAdjustments();
    
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/employee/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTodayRecords(data.todayRecords);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchPendingAdjustments = async () => {
    try {
      const res = await fetch('/api/employee/adjustments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter only pending adjustments
        setPendingAdjustments((data.adjustments || []).filter((adj: any) => adj.status === 'pending').slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    }
  };

  const handlePunchClock = async (type: string) => {
    setIsLoading(true);
    try {
      // Solicitar localização explicitamente
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocalização não suportada pelo navegador.'));
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setTempLocation(currentLocation);
      setPendingPunchType(type);
      setIsConfirmModalOpen(true);
    } catch (error: any) {
      console.error('Error getting location:', error);
      if (error.code === 1) { // PERMISSION_DENIED
        toast.error('Permissão de localização negada. É necessário permitir o acesso à sua localização para bater o ponto.', { duration: 5000 });
      } else if (error.code === 2 || error.code === 3) { // POSITION_UNAVAILABLE or TIMEOUT
        toast.error('Não foi possível obter sua localização. Verifique seu GPS ou conexão.', { duration: 5000 });
      } else {
        toast.error(error.message || 'Erro ao obter localização.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPunchClock = async () => {
    if (!pendingPunchType || !tempLocation) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/employee/time-record', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          type: pendingPunchType, 
          location: tempLocation,
          notes: punchNotes
        })
      });

      if (res.ok) {
        setLocation(tempLocation);
        fetchDashboardData();
        setShowSuccessFeedback(true);
        setIsConfirmModalOpen(false);
        setPendingPunchType(null);
        setPunchNotes('');
        setTimeout(() => {
          setShowSuccessFeedback(false);
        }, 3000);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Erro ao registrar ponto');
      }
    } catch (error: any) {
      console.error('Error punching clock:', error);
      toast.error(error.message || 'Erro ao registrar ponto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const proposedTimestamp = new Date(`${adjustmentForm.date}T${adjustmentForm.time}:00`).toISOString();
      const res = await fetch('/api/employee/adjustments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          proposedTimestamp,
          proposedType: adjustmentForm.type,
          reason: adjustmentForm.reason
        })
      });

      if (res.ok) {
        setIsAdjustmentModalOpen(false);
        setAdjustmentForm({
          date: format(new Date(), 'yyyy-MM-dd'),
          time: format(new Date(), 'HH:mm'),
          type: 'in',
          reason: ''
        });
        toast.success('Ajuste solicitado com sucesso!');
        fetchPendingAdjustments();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Erro ao solicitar ajuste');
      }
    } catch (error) {
      console.error('Error submitting adjustment:', error);
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecordIcon = (type: string) => {
    switch(type) {
      case 'in': return <LogIn className="w-5 h-5 text-emerald-500" />;
      case 'out': return <LogOut className="w-5 h-5 text-rose-500" />;
      case 'break_start': return <Coffee className="w-5 h-5 text-amber-500" />;
      case 'break_end': return <Coffee className="w-5 h-5 text-sky-500" />;
      default: return <LogIn className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getRecordLabel = (type: string) => {
    switch(type) {
      case 'in': return 'Entrada';
      case 'out': return 'Saída';
      case 'break_start': return 'Início Intervalo';
      case 'break_end': return 'Fim Intervalo';
      default: return 'Registro';
    }
  };

  type WorkedHoursSummary = {
    worked: string;
    balance: string;
    isOvertime: boolean;
    progress: number;
  };

  const calculateWorkedHours = (): WorkedHoursSummary => {
    if (todayRecords.length === 0) {
      return { worked: '00:00', balance: '00:00', isOvertime: false, progress: 0 };
    }

    let totalMs = 0;
    let lastInTimeMs: number | null = null;

    for (const record of todayRecords) {
      const time = new Date(record.timestamp);
      if (record.type === 'in' || record.type === 'break_end') {
        lastInTimeMs = time.getTime();
      } else if ((record.type === 'out' || record.type === 'break_start') && lastInTimeMs !== null) {
        totalMs += time.getTime() - lastInTimeMs;
        lastInTimeMs = null;
      }
    }

    // If currently working
    if (lastInTimeMs !== null) {
      totalMs += currentTime.getTime() - lastInTimeMs;
    }

    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Assuming 8 hours workday
    const expectedMs = 8 * 60 * 60 * 1000;
    const balanceMs = totalMs - expectedMs;
    const isOvertime = balanceMs > 0;
    const absBalanceMs = Math.abs(balanceMs);
    
    const balanceHours = Math.floor(absBalanceMs / (1000 * 60 * 60));
    const balanceMinutes = Math.floor((absBalanceMs % (1000 * 60 * 60)) / (1000 * 60));

    // Calculate progress percentage (max 100%)
    const progress = Math.min(100, (totalMs / expectedMs) * 100);

    return {
      worked: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      balance: `${balanceHours.toString().padStart(2, '0')}:${balanceMinutes.toString().padStart(2, '0')}`,
      isOvertime,
      progress
    };
  };

  const summary = calculateWorkedHours();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col w-full"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4">
        <h1 className="text-xl font-bold">Página Inicial</h1>
      </div>

      {/* Success Feedback Overlay */}
      <AnimatePresence>
        {showSuccessFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-3 font-bold"
          >
            <CheckCircle className="w-5 h-5" />
            Ponto Registrado!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clock Area */}
      <div className="p-6 border-b border-zinc-800 flex flex-col items-center justify-center py-8">
        <h2 className="text-zinc-500 font-medium mb-2 uppercase tracking-wider text-sm">
          {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h2>
        <div className="text-6xl sm:text-7xl font-black text-white tracking-tighter mb-8 font-mono">
          {format(currentTime, 'HH:mm:ss')}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePunchClock('in')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-linear-to-br from-zinc-900 to-zinc-900 hover:from-blue-900/40 hover:to-purple-900/40 transition-all duration-300 border border-zinc-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 group"
          >
            <LogIn className="w-6 h-6 mb-2 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-bold text-sm group-hover:text-blue-200 transition-colors">Entrada</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePunchClock('break_start')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-linear-to-br from-zinc-900 to-zinc-900 hover:from-blue-900/40 hover:to-purple-900/40 transition-all duration-300 border border-zinc-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 group"
          >
            <Coffee className="w-6 h-6 mb-2 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-bold text-sm group-hover:text-blue-200 transition-colors">Pausa</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePunchClock('break_end')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-linear-to-br from-zinc-900 to-zinc-900 hover:from-blue-900/40 hover:to-purple-900/40 transition-all duration-300 border border-zinc-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 group"
          >
            <Coffee className="w-6 h-6 mb-2 text-sky-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-bold text-sm group-hover:text-blue-200 transition-colors">Retorno</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePunchClock('out')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-linear-to-br from-zinc-900 to-zinc-900 hover:from-blue-900/40 hover:to-purple-900/40 transition-all duration-300 border border-zinc-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 group"
          >
            <LogOut className="w-6 h-6 mb-2 text-rose-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-bold text-sm group-hover:text-blue-200 transition-colors">Saída</span>
          </motion.button>
        </div>

        {isLoading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-sky-500 font-medium">
            <MapPin className="w-4 h-4 animate-bounce" />
            Obtendo localização e registrando...
          </div>
        )}

        {location && !isLoading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <MapPin className="w-4 h-4" />
            Última localização capturada: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
        )}
      </div>

      {/* Summary Area */}
      <div className="p-4 border-b border-zinc-800">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Horas Trabalhadas</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {summary.worked}
            </div>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {summary.isOvertime ? 'Horas Extras' : 'Horas Restantes'}
              </span>
            </div>
            <div className={`text-2xl font-bold font-mono ${summary.isOvertime ? 'text-emerald-500' : 'text-amber-500'}`}>
              {summary.isOvertime ? '+' : ''}{summary.balance}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-zinc-900 rounded-full h-2.5 mb-1 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full transition-all duration-1000 ${summary.isOvertime ? 'bg-emerald-500' : 'bg-sky-500'}`}
            style={{ width: `${summary.progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-zinc-500 font-medium">
          <span>00:00</span>
          <span>Meta: 08:00</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 border-b border-zinc-800">
        <button
          onClick={() => setIsAdjustmentModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors text-zinc-300 font-medium group"
        >
          <Clock className="w-5 h-5 text-sky-500 group-hover:scale-110 transition-transform" />
          Solicitar Ajuste
        </button>
      </div>

      {/* Feed (Today's Records) */}
      <div>
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold">Registros de Hoje</h2>
          <span className="text-xs font-medium bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full">
            {todayRecords.length} registros
          </span>
        </div>
        {todayRecords.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 border-b border-zinc-800">
            Nenhum registro hoje.
          </div>
        ) : (
          [...todayRecords].reverse().map((record, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={record._id} 
              className="p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                {getRecordIcon(record.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{user?.name}</span>
                  <span className="text-zinc-500 text-sm">@{user?.role}</span>
                  <span className="text-zinc-500 text-sm">·</span>
                  <span className="text-zinc-500 text-sm">{format(new Date(record.timestamp), "HH:mm")}</span>
                </div>
                <p className="text-zinc-200 mt-1">
                  Registrou <span className="font-bold">{getRecordLabel(record.type)}</span>
                </p>
                {record.notes && (
                  <p className="text-zinc-400 text-sm mt-1 italic">
                    "{record.notes}"
                  </p>
                )}
                {record.location && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-sky-500">
                    <MapPin className="w-3 h-3" />
                    {record.location.lat.toFixed(4)}, {record.location.lng.toFixed(4)}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pending Adjustments */}
      {pendingAdjustments.length > 0 && (
        <div>
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Ajustes Pendentes
            </h2>
          </div>
          {pendingAdjustments.map((adj, index) => (
            <div key={adj._id} className="p-4 border-b border-zinc-800 bg-amber-500/5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{getRecordLabel(adj.proposedType)}</span>
                  <span className="text-zinc-500 text-sm">·</span>
                  <span className="text-zinc-300 text-sm">{format(new Date(adj.proposedTimestamp), "dd/MM 'às' HH:mm")}</span>
                </div>
                <span className="text-xs font-bold bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full uppercase tracking-wider">
                  Em Análise
                </span>
              </div>
              <p className="text-zinc-400 text-sm">"{adj.reason}"</p>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-black border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-sky-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Confirmar Localização</h2>
              <p className="text-zinc-400 mb-6">
                Sua localização atual foi detectada. Verifique se as coordenadas abaixo estão corretas antes de registrar sua <span className="text-white font-bold">{getRecordLabel(pendingPunchType || '')}</span>.
              </p>
              
              <div className="w-full bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-500">Latitude:</span>
                  <span className="text-white font-mono">{tempLocation?.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Longitude:</span>
                  <span className="text-white font-mono">{tempLocation?.lng.toFixed(6)}</span>
                </div>
              </div>

              <div className="w-full mb-6">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-left text-xs text-zinc-500 uppercase tracking-wider font-bold">Observação (opcional)</label>
                  <span className={`text-[10px] font-mono ${punchNotes.length >= 450 ? 'text-rose-500' : 'text-zinc-600'}`}>
                    {punchNotes.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Ex: Almoço com cliente, atraso por trânsito..."
                  value={punchNotes}
                  onChange={e => setPunchNotes(e.target.value)}
                  maxLength={500}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none text-sm transition-all"
                />
              </div>

              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setPendingPunchType(null);
                    setPunchNotes('');
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmPunchClock}
                  isLoading={isLoading}
                  variant="primary"
                  className="flex-1"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-black border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-500" />
                Solicitar Ajuste
              </h2>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-900">
                &times;
              </button>
            </div>
            <form onSubmit={handleAdjustmentSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={adjustmentForm.date}
                    onChange={e => setAdjustmentForm({...adjustmentForm, date: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={adjustmentForm.time}
                    onChange={e => setAdjustmentForm({...adjustmentForm, time: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tipo de Registro</label>
                <select
                  value={adjustmentForm.type}
                  onChange={e => setAdjustmentForm({...adjustmentForm, type: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                >
                  <option value="in">Entrada</option>
                  <option value="break_start">Início Intervalo</option>
                  <option value="break_end">Fim Intervalo</option>
                  <option value="out">Saída</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Motivo / Justificativa</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Esqueci de bater o ponto na entrada..."
                  value={adjustmentForm.reason}
                  onChange={e => setAdjustmentForm({...adjustmentForm, reason: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  variant="primary"
                  size="full"
                >
                  Enviar Solicitação
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EmployeeDashboard;
