import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { LogIn, LogOut, Coffee, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const EmployeeHistory = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useAuthStore();
  const itemsPerPage = 20;

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);

  const fetchHistory = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employee/time-records?page=${page}&limit=${itemsPerPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
        setTotalRecords(data.total);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col w-full"
    >
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4">
        <h1 className="text-xl font-bold">Histórico</h1>
      </div>

      <div>
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Carregando...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 border-b border-zinc-800">Nenhum registro encontrado.</div>
        ) : (
          records.map((record, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
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
                  <span className="text-zinc-500 text-sm">{format(new Date(record.timestamp), "dd/MM/yyyy")}</span>
                </div>
                <p className="text-zinc-200 mt-1">
                  Registrou <span className="font-bold">{getRecordLabel(record.type)}</span> às <span className="font-mono">{format(new Date(record.timestamp), "HH:mm:ss")}</span>
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
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EmployeeHistory;
