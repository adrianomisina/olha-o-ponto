import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Calendar, Filter, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Button from '../../components/Button';

const AdminReports = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [eventType, setEventType] = useState('all');
  const { token } = useAuthStore();
  const itemsPerPage = 20;

  useEffect(() => {
    fetchReports(currentPage);
  }, [startDate, endDate, eventType, currentPage]);

  const fetchReports = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?startDate=${startDate}&endDate=${endDate}&type=${eventType}&page=${page}&limit=${itemsPerPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
        setTotalRecords(data.total);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    setCurrentPage(1);
    fetchReports(1);
  };

  // Process data for chart
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: format(d, 'dd/MM'),
      count: 0
    };
  });

  records.forEach(record => {
    const date = format(new Date(record.timestamp), 'dd/MM');
    const existing = chartData.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    }
  });

  return (
    <div className="flex flex-col w-full">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Relatórios</h1>
        <Button
          variant="primary"
          size="sm"
          className="hidden sm:flex shrink-0"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="p-4 border-b border-zinc-800">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(220px,260px)_auto] gap-3 items-end">
          <div className="w-full">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
              Data inicial
            </label>
            <div className="flex items-center gap-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5">
              <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white outline-none w-full min-w-0"
              />
            </div>
          </div>

          <div className="hidden lg:flex h-full items-center justify-center pb-3 text-zinc-500 font-medium">
            até
          </div>

          <div className="w-full">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
              Data final
            </label>
            <div className="flex items-center gap-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5">
              <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white outline-none w-full min-w-0"
              />
            </div>
          </div>

          <div className="w-full">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
              Evento
            </label>
            <div className="flex items-center gap-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5">
              <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="bg-transparent text-white outline-none w-full min-w-0"
              >
                <option value="all">Todos os Eventos</option>
                <option value="in">Entrada</option>
                <option value="out">Saída</option>
                <option value="break_start">Início Intervalo</option>
                <option value="break_end">Fim Intervalo</option>
              </select>
            </div>
          </div>

          <Button 
            onClick={handleFilter}
            isLoading={isLoading}
            variant="secondary"
            size="sm"
            className="w-full lg:w-auto lg:min-w-[120px] whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </Button>
        </div>

        <div className="mt-3 flex lg:hidden items-center gap-2 text-zinc-500 text-sm">
          <span>Período selecionado:</span>
          <span>{format(new Date(startDate), 'dd/MM/yyyy')}</span>
          <span>até</span>
          <span>{format(new Date(endDate), 'dd/MM/yyyy')}</span>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="p-4 border-b border-zinc-800 h-64">
          <h2 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-wider">Atividade nos últimos dias</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Carregando relatórios...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-zinc-800 mb-4" />
            <p>Nenhum registro encontrado no período.</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record._id} className="p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-white">
                {record.userId?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{record.userId?.name || 'Desconhecido'}</span>
                  <span className="text-zinc-500 text-sm">·</span>
                  <span className="text-zinc-500 text-sm">{format(new Date(record.timestamp), "dd/MM/yyyy")}</span>
                </div>
                <p className="text-zinc-200 mt-1">
                  Registrou <span className="font-bold text-sky-500">{
                    record.type === 'in' ? 'Entrada' : 
                    record.type === 'out' ? 'Saída' : 
                    record.type === 'break_start' ? 'Início Intervalo' : 'Fim Intervalo'
                  }</span> às <span className="font-mono">{format(new Date(record.timestamp), "HH:mm:ss")}</span>
                </p>
                {record.notes && (
                  <p className="text-zinc-400 text-sm mt-1 italic bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50">
                    "{record.notes}"
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-black/50 backdrop-blur-sm">
          <p className="text-xs text-zinc-500">
            Mostrando <span className="font-bold text-zinc-300">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-zinc-300">{Math.min(currentPage * itemsPerPage, totalRecords)}</span> de <span className="font-bold text-zinc-300">{totalRecords}</span> registros
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
  );
};

export default AdminReports;
