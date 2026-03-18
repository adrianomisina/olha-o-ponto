import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/Button';

const AdminApprovals = () => {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [totalAdjustments, setTotalAdjustments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { token } = useAuthStore();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAdjustments(currentPage);
    fetchAccessRequests();
  }, [currentPage]);

  const fetchAdjustments = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/adjustments?page=${page}&limit=${itemsPerPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdjustments(data.adjustments);
        setTotalAdjustments(data.total);
        setTotalPages(data.pages);
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccessRequests = async () => {
    try {
      const res = await fetch('/api/admin/access-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAccessRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching access requests:', error);
    }
  };

  const handleResolveAccessRequest = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/access-requests/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resolutionNote: 'Solicitação tratada pelo administrador.' })
      });

      if (res.ok) {
        toast.success('Solicitação de acesso marcada como resolvida');
        fetchAccessRequests();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Erro ao resolver solicitação');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/adjustments/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success(`Solicitação ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`);
        fetchAdjustments(currentPage);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Erro ao processar solicitação');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const handleBulkAction = async (status: 'approved' | 'rejected') => {
    if (selectedIds.length === 0) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/adjustments/bulk', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds, status })
      });

      if (res.ok) {
        toast.success(`${selectedIds.length} solicitações processadas com sucesso`);
        setSelectedIds([]);
        fetchAdjustments(currentPage);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Erro ao processar solicitações');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingAdjustments.length && pendingAdjustments.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingAdjustments.map(a => a._id));
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

  const pendingAdjustments = adjustments.filter(a => a.status === 'pending');
  const historyAdjustments = adjustments.filter(a => a.status !== 'pending');
  const openAccessRequests = accessRequests.filter(request => request.status === 'open');
  const resolvedAccessRequests = accessRequests.filter(request => request.status === 'resolved');

  return (
    <div className="flex flex-col w-full relative">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4">
        <h1 className="text-xl font-bold">Aprovações de Ponto</h1>
      </div>

      <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Pendentes ({pendingAdjustments.length})
        </h2>
        
        {pendingAdjustments.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-white transition-colors">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-zinc-900"
                checked={selectedIds.length === pendingAdjustments.length && pendingAdjustments.length > 0}
                onChange={toggleSelectAll}
              />
              Selecionar Todos
            </label>
            
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                <Button
                  onClick={() => handleBulkAction('approved')}
                  variant="success"
                  size="sm"
                >
                  Aprovar ({selectedIds.length})
                </Button>
                <Button
                  onClick={() => handleBulkAction('rejected')}
                  variant="danger"
                  size="sm"
                >
                  Rejeitar ({selectedIds.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-b border-zinc-800 mt-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-sky-500" />
          Solicitações de Acesso ({openAccessRequests.length})
        </h2>
      </div>

      <div>
        {openAccessRequests.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 border-b border-zinc-800">
            Nenhuma solicitação de acesso pendente.
          </div>
        ) : (
          openAccessRequests.map((request) => (
            <div key={request._id} className="p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{request.employeeName || 'Funcionário'}</span>
                  <span className="text-zinc-500 text-sm">·</span>
                  <span className="text-zinc-500 text-sm">{request.email}</span>
                </div>
                <p className="text-zinc-300 mt-2 text-sm italic">"{request.message}"</p>
                <p className="text-zinc-500 text-xs mt-2">
                  Enviado em {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div className="flex sm:flex-col gap-2 justify-end">
                <Button
                  onClick={() => handleResolveAccessRequest(request._id)}
                  variant="success"
                  size="sm"
                >
                  Resolver
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div>
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Carregando...</div>
        ) : pendingAdjustments.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 border-b border-zinc-800 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-emerald-500/50 mb-4" />
            <p>Tudo certo! Nenhuma solicitação pendente.</p>
          </div>
        ) : (
          pendingAdjustments.map((adj) => (
            <div key={adj._id} className={`p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors flex flex-col sm:flex-row gap-4 ${selectedIds.includes(adj._id) ? 'bg-sky-500/5' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="pt-2">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-zinc-900"
                    checked={selectedIds.includes(adj._id)}
                    onChange={() => toggleSelect(adj._id)}
                  />
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-white">
                  {adj.userId?.name?.charAt(0).toUpperCase() || '?'}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{adj.userId?.name || 'Desconhecido'}</span>
                  <span className="text-zinc-500 text-sm">·</span>
                  <span className="text-zinc-500 text-sm">{format(new Date(adj.createdAt), "dd/MM/yyyy")}</span>
                </div>
                <div className="mt-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                  <p className="text-sm text-zinc-400 mb-1">Solicitou ajuste para:</p>
                  <p className="font-bold text-white">
                    {getTypeLabel(adj.proposedType)} em {format(new Date(adj.proposedTimestamp), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                  <p className="text-zinc-300 mt-2 text-sm italic">
                    "{adj.reason}"
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 justify-end sm:justify-start mt-2 sm:mt-0">
                <Button 
                  onClick={() => handleAction(adj._id, 'approved')}
                  variant="success"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar
                </Button>
                <Button 
                  onClick={() => handleAction(adj._id, 'rejected')}
                  variant="danger"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeitar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-b border-zinc-800 mt-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          Histórico Recente
        </h2>
      </div>

      <div>
        {resolvedAccessRequests.length > 0 && (
          resolvedAccessRequests.slice(0, 5).map((request) => (
            <div key={request._id} className="p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors flex gap-4 opacity-70">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-sky-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{request.employeeName || 'Funcionário'}</span>
                  <span className="text-zinc-500 text-sm">·</span>
                  <span className="text-zinc-500 text-sm">{request.email}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    Resolvido
                  </span>
                </div>
                <p className="text-zinc-400 mt-1 text-sm">
                  Solicitação tratada em {format(new Date(request.resolvedAt || request.updatedAt), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}

        {historyAdjustments.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            Nenhum histórico de aprovação/rejeição.
          </div>
        ) : (
          historyAdjustments.slice(0, 10).map((adj) => (
            <div key={adj._id} className="p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors flex gap-4 opacity-70">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                {adj.status === 'approved' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{adj.userId?.name || 'Desconhecido'}</span>
                  <span className="text-zinc-500 text-sm">·</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    adj.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {adj.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </span>
                </div>
                <p className="text-zinc-400 mt-1 text-sm">
                  {getTypeLabel(adj.proposedType)} em {format(new Date(adj.proposedTimestamp), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-black/50 backdrop-blur-sm">
          <p className="text-xs text-zinc-500">
            Mostrando <span className="font-bold text-zinc-300">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-zinc-300">{Math.min(currentPage * itemsPerPage, totalAdjustments)}</span> de <span className="font-bold text-zinc-300">{totalAdjustments}</span> solicitações
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

export default AdminApprovals;
