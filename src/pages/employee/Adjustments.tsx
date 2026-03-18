import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { format, parse, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Clock, AlertCircle, CheckCircle, XCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';

const EmployeeAdjustments = () => {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [totalAdjustments, setTotalAdjustments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const { token } = useAuthStore();
  const itemsPerPage = 20;

  const calendarRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    date: new Date(),
    time: format(new Date(), 'HH:mm'),
    proposedType: 'in',
    reason: ''
  });

  useEffect(() => {
    fetchAdjustments(currentPage);

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setIsTimePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currentPage]);

  const fetchAdjustments = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employee/adjustments?page=${page}&limit=${itemsPerPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdjustments(data.adjustments);
        setTotalAdjustments(data.total);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      const proposedTimestamp = new Date(`${dateStr}T${formData.time}:00`).toISOString();
      
      const res = await fetch('/api/employee/adjustments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          proposedTimestamp,
          proposedType: formData.proposedType,
          reason: formData.reason
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ ...formData, reason: '' });
        fetchAdjustments(1);
        setCurrentPage(1);
        toast.success('Ajuste solicitado com sucesso!');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Erro ao solicitar ajuste');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-rose-500" />;
      default: return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return 'Pendente';
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'in': return 'Entrada';
      case 'out': return 'Saída';
      case 'break_start': return 'Início Intervalo';
      case 'break_end': return 'Fim Intervalo';
      default: return 'Registro';
    }
  };

  return (
    <div className="flex flex-col w-full relative">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Ajustes de Ponto</h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          size="sm"
          className="hidden sm:flex"
        >
          <Plus className="w-4 h-4" />
          Novo Ajuste
        </Button>
      </div>

      <div>
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Carregando...</div>
        ) : adjustments.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 border-b border-zinc-800 flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-zinc-800 mb-4" />
            <p>Nenhuma solicitação de ajuste encontrada.</p>
          </div>
        ) : (
          adjustments.map((adj) => (
            <div key={adj._id} className="p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                {getStatusIcon(adj.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{getTypeLabel(adj.proposedType)}</span>
                  <span className="text-zinc-500 text-sm">·</span>
                  <span className="text-zinc-500 text-sm">{format(new Date(adj.proposedTimestamp), "dd/MM/yyyy HH:mm")}</span>
                </div>
                <p className="text-zinc-300 mt-1 text-sm">
                  Motivo: {adj.reason}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    adj.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                    adj.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {getStatusText(adj.status)}
                  </span>
                  <span className="text-zinc-500 text-xs">
                    Solicitado em {format(new Date(adj.createdAt), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-black/50 backdrop-blur-sm sticky bottom-0">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-sky-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-sky-600 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-black border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Solicitar Ajuste</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-900">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-visible">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative" ref={calendarRef}>
                  <label className="block text-xs text-zinc-500 mb-1">Data</label>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="w-full bg-black border border-zinc-700 rounded-md px-4 py-3 text-white flex items-center justify-between hover:border-zinc-500 transition-colors"
                  >
                    <span>{format(formData.date, "dd/MM/yyyy")}</span>
                    <CalendarIcon className="w-4 h-4 text-zinc-500" />
                  </button>
                  
                  <AnimatePresence>
                    {isCalendarOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 z-[60] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2"
                      >
                        <DayPicker
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => {
                            if (date) {
                              setFormData({ ...formData, date });
                              setIsCalendarOpen(false);
                            }
                          }}
                          locale={ptBR}
                          className="m-0"
                          styles={{
                            caption: { color: 'white' },
                            head_cell: { color: '#71717a' },
                            cell: { color: 'white' },
                            day: { borderRadius: '8px' },
                            day_selected: { backgroundColor: '#0ea5e9', color: 'white' },
                            day_today: { color: '#0ea5e9', fontWeight: 'bold' }
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative" ref={timePickerRef}>
                  <label className="block text-xs text-zinc-500 mb-1">Hora</label>
                  <button
                    type="button"
                    onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                    className="w-full bg-black border border-zinc-700 rounded-md px-4 py-3 text-white flex items-center justify-between hover:border-zinc-500 transition-colors"
                  >
                    <span className="font-mono">{formData.time}</span>
                    <Clock className="w-4 h-4 text-zinc-500" />
                  </button>

                  <AnimatePresence>
                    {isTimePickerOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 z-[60] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 w-64"
                      >
                        <div className="grid grid-cols-2 gap-4 h-64">
                          <div className="overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-[10px] uppercase text-zinc-500 mb-2 sticky top-0 bg-zinc-900 py-1">Hora</p>
                            {Array.from({ length: 24 }).map((_, i) => {
                              const h = i.toString().padStart(2, '0');
                              const currentH = formData.time.split(':')[0];
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    const m = formData.time.split(':')[1];
                                    setFormData({ ...formData, time: `${h}:${m}` });
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${h === currentH ? 'bg-sky-500 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
                                >
                                  {h}h
                                </button>
                              );
                            })}
                          </div>
                          <div className="overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-[10px] uppercase text-zinc-500 mb-2 sticky top-0 bg-zinc-900 py-1">Min</p>
                            {Array.from({ length: 12 }).map((_, i) => {
                              const m = (i * 5).toString().padStart(2, '0');
                              const currentM = formData.time.split(':')[1];
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    const h = formData.time.split(':')[0];
                                    setFormData({ ...formData, time: `${h}:${m}` });
                                    setIsTimePickerOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${m === currentM ? 'bg-sky-500 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
                                >
                                  {m}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Tipo de Registro</label>
                <select
                  value={formData.proposedType}
                  onChange={e => setFormData({...formData, proposedType: e.target.value})}
                  className="w-full bg-black border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                >
                  <option value="in">Entrada</option>
                  <option value="break_start">Início Intervalo</option>
                  <option value="break_end">Fim Intervalo</option>
                  <option value="out">Saída</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Motivo do Ajuste</label>
                <textarea
                  required
                  maxLength={500}
                  placeholder="Ex: Esqueci de bater o ponto na entrada"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="w-full bg-black border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none min-h-[100px]"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
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
    </div>
  );
};

export default EmployeeAdjustments;
