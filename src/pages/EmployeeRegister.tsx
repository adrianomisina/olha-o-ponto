import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';

const EmployeeRegister = () => {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!companyId) {
      setError('Link de convite inválido ou expirado.');
      return;
    }

    // Fetch company name to show to the user
    const fetchCompany = async () => {
      try {
        const res = await fetch(`/api/auth/company/${companyId}`);
        if (res.ok) {
          const data = await res.json();
          setCompanyName(data.name);
        }
      } catch (err) {
        console.error('Error fetching company:', err);
      }
    };
    fetchCompany();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, companyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar');
      }

      login(data.user, data.token);
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!companyId) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Link Inválido</h1>
        <p className="text-zinc-500 text-center max-w-xs mb-8">
          Este link de convite não é válido. Peça ao seu administrador um novo link.
        </p>
        <Link to="/login" className="text-sky-500 hover:underline">Voltar para Login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Clock className="w-12 h-12 text-white mb-8" />
        <h2 className="text-3xl font-bold mb-2 w-full text-left">Juntar-se à equipe</h2>
        {companyName && (
          <p className="text-zinc-500 mb-8 w-full text-left flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-sky-500" />
            Você foi convidado para a empresa <span className="text-white font-bold">{companyName}</span>
          </p>
        )}
        
        <form className="space-y-4 w-full" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 p-3 rounded-md flex items-center gap-3 text-rose-500">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              required
              maxLength={100}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="block w-full bg-black border border-zinc-700 rounded-md px-4 py-4 text-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 peer placeholder-transparent"
              placeholder="Seu Nome"
              id="name"
            />
            <label htmlFor="name" className="absolute left-4 top-2 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-500">
              Seu Nome Completo
            </label>
          </div>

          <div className="relative">
            <input
              type="email"
              required
              maxLength={100}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="block w-full bg-black border border-zinc-700 rounded-md px-4 py-4 text-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 peer placeholder-transparent"
              placeholder="Email"
              id="email"
            />
            <label htmlFor="email" className="absolute left-4 top-2 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-500">
              Email Profissional
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              required
              maxLength={128}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="block w-full bg-black border border-zinc-700 rounded-md px-4 py-4 text-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 peer placeholder-transparent"
              placeholder="Senha"
              id="password"
            />
            <label htmlFor="password" className="absolute left-4 top-2 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-500">
              Criar Senha
            </label>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            variant="primary"
            size="full"
            className="mt-8"
          >
            Concluir Cadastro
          </Button>
        </form>

        <div className="mt-8 w-full">
          <p className="text-zinc-500 text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-sky-500 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegister;
