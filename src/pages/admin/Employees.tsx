import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { UserPlus, Search, Edit2, Trash2, Mail, Briefcase, Building2, Fingerprint, Upload, Link as LinkIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Button from '../../components/Button';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { token } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    position: '',
    department: ''
  });

  useEffect(() => {
    fetchEmployees(currentPage);
    fetchCompanyInfo();
  }, [currentPage]);

  const fetchCompanyInfo = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  const fetchEmployees = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/employees?page=${page}&limit=${itemsPerPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
        setTotalEmployees(data.total);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (companyInfo && totalEmployees >= companyInfo.employeesLimit) {
      toast.error(`Limite de funcionários atingido (${companyInfo.employeesLimit}). Por favor, faça um upgrade no seu plano.`);
      return;
    }

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({ name: '', email: '', password: '', position: '', department: '' });
        fetchEmployees(currentPage);
        toast.success('Funcionário adicionado com sucesso!');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Erro ao adicionar funcionário');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkData.split('\n').filter(line => line.trim() !== '');
    const employeesToImport = lines.map(line => {
      const [name, email, position, department] = line.split(',').map(s => s.trim());
      return { name, email, position, department };
    });

    try {
      const res = await fetch('/api/admin/employees/bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ employees: employeesToImport })
      });

      const data = await res.json();
      if (res.ok) {
        setIsBulkModalOpen(false);
        setBulkData('');
        fetchEmployees(currentPage);
        toast.success(data.message);
        if (data.errors.length > 0) {
          console.error('Erros na importação:', data.errors);
          toast.error('Alguns funcionários não puderam ser importados. Verifique o console.');
        }
      } else {
        toast.error(data.message || 'Erro na importação');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/register-employee?companyId=${companyInfo?._id}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Link de convite copiado!');
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Funcionário removido com sucesso!');
        fetchEmployees(currentPage);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Erro ao remover funcionário');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setEmployeeToDelete(null);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  return (
    <div className="flex flex-col w-full relative">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">Equipe</h1>
          {companyInfo && (
            <span className="text-xs text-zinc-500">
              {totalEmployees} de {companyInfo.employeesLimit} funcionários ativos
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={copyInviteLink}
            variant="secondary"
            size="sm"
            className="hidden sm:flex"
            title="Copiar link de convite"
          >
            <LinkIcon className="w-4 h-4" />
            Convite
          </Button>
          <Button
            onClick={() => setIsBulkModalOpen(true)}
            variant="secondary"
            size="sm"
            className="hidden sm:flex"
          >
            <Upload className="w-4 h-4" />
            Importar
          </Button>
          <Button
            onClick={() => {
              if (companyInfo && totalEmployees >= companyInfo.employeesLimit) {
                toast.error('Limite de funcionários atingido! Faça um upgrade para adicionar mais.');
              } else {
                setIsAddModalOpen(true);
              }
            }}
            variant={companyInfo && totalEmployees >= companyInfo.employeesLimit ? 'secondary' : 'primary'}
            size="sm"
            className="hidden sm:flex"
            disabled={companyInfo && totalEmployees >= companyInfo.employeesLimit}
          >
            <UserPlus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-zinc-800">
        <div className="relative">
          <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar funcionários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-transparent rounded-full focus:bg-black focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white placeholder-zinc-500 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Carregando...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center">
            <Search className="w-12 h-12 text-zinc-800 mb-4" />
            <p className="text-lg font-medium text-zinc-400">Nenhum funcionário encontrado</p>
            <p className="text-sm text-zinc-600 mt-1">Tente ajustar sua busca ou adicionar um novo membro.</p>
          </div>
        ) : (
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden border-b border-zinc-800">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                      Cargo / Depto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                      ID / Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-black">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-zinc-900/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white shrink-0">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">{employee.name}</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">@{employee.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                            <Briefcase className="w-3 h-3 text-zinc-500" />
                            {employee.position || '-'}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                            <Building2 className="w-3 h-3 text-zinc-600" />
                            {employee.department || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Mail className="w-3 h-3 text-zinc-500" />
                            {employee.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 mt-0.5 font-mono">
                            <Fingerprint className="w-3 h-3 text-zinc-700" />
                            {employee._id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 text-zinc-500 hover:text-sky-500 rounded-lg hover:bg-sky-500/10 transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEmployeeToDelete(employee._id)}
                            className="p-2 text-zinc-500 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-black/50 backdrop-blur-sm">
          <p className="text-xs text-zinc-500">
            Mostrando <span className="font-bold text-zinc-300">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-zinc-300">{Math.min(currentPage * itemsPerPage, totalEmployees)}</span> de <span className="font-bold text-zinc-300">{totalEmployees}</span> funcionários
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

      {/* Mobile FAB */}
      <button
        onClick={() => {
          if (companyInfo && totalEmployees >= companyInfo.employeesLimit) {
            toast.error('Limite de funcionários atingido!');
          } else {
            setIsAddModalOpen(true);
          }
        }}
        className={`sm:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors z-40 ${
          companyInfo && totalEmployees >= companyInfo.employeesLimit
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-sky-500 text-white hover:bg-sky-600'
        }`}
      >
        <UserPlus className="w-6 h-6" />
      </button>

      {/* Delete Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-zinc-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-black border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Remover Funcionário</h2>
            <p className="text-zinc-400 mb-6">Tem certeza que deseja remover este funcionário? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-4">
              <Button
                onClick={() => setEmployeeToDelete(null)}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDeleteEmployee(employeeToDelete)}
                variant="danger"
                className="flex-1"
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Adjustment Modal (Existing) */}
      {/* ... existing modals ... */}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-black border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Importar Funcionários</h2>
              <button onClick={() => setIsBulkModalOpen(false)} className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-900">
                &times;
              </button>
            </div>
            <form onSubmit={handleBulkImport} className="p-4 space-y-4">
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-400 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Formato: Nome, Email, Cargo, Departamento (um por linha)
                </p>
                <p className="text-[10px] text-zinc-500">
                  Ex: João Silva, joao@empresa.com, Desenvolvedor, TI
                </p>
              </div>
              
              <textarea
                required
                placeholder="Cole os dados aqui..."
                value={bulkData}
                onChange={e => setBulkData(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none min-h-[200px] font-mono text-sm"
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="full"
                >
                  Importar Todos
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-black border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Novo Funcionário</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-900">
                &times;
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-4 space-y-4">
              <input
                type="text"
                required
                maxLength={100}
                placeholder="Nome Completo"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-black border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              />
              <input
                type="email"
                required
                maxLength={100}
                placeholder="Email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-black border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              />
              <input
                type="password"
                required
                maxLength={128}
                placeholder="Senha Provisória"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-black border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Cargo"
                  value={formData.position}
                  onChange={e => setFormData({...formData, position: e.target.value})}
                  className="w-full bg-black border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                />
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Departamento"
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  className="w-full bg-black border border-zinc-700 rounded-md px-4 py-3 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="full"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;
