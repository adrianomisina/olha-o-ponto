import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Clock, AlertCircle, User, Building2 } from 'lucide-react';
import Button from '../components/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      login(data.user, data.token);
      
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Clock className="w-12 h-12 text-white mb-6" />
        <h2 className="text-3xl font-bold mb-8 w-full text-center">
          {role === 'admin' ? 'Acesso Administrativo' : 'Acesso do Funcionário'}
        </h2>
        
        <div className="flex w-full bg-zinc-900 rounded-xl p-1 mb-8">
          <button
            type="button"
            onClick={() => setRole('employee')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
              role === 'employee' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <User className="w-4 h-4" />
            Funcionário
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
              role === 'admin' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Administrador
          </button>
        </div>

        <form className="space-y-6 w-full" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 p-3 rounded-md flex items-center gap-3 text-rose-500">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <input
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full bg-black border border-zinc-700 rounded-md px-4 py-4 text-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 peer placeholder-transparent"
                placeholder="Email"
                id="email"
              />
              <label htmlFor="email" className="absolute left-4 top-2 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-500">
                Email
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                required
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full bg-black border border-zinc-700 rounded-md px-4 py-4 text-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 peer placeholder-transparent"
                placeholder="Senha"
                id="password"
              />
              <label htmlFor="password" className="absolute left-4 top-2 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-500">
                Senha
              </label>
            </div>
            
            <div className="flex justify-end">
              <Link to={`/forgot-password?role=${role}`} className="text-zinc-500 hover:text-sky-500 text-sm transition-colors">
                Esqueci minha senha
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            variant="primary"
            size="full"
            className="mt-6"
          >
            Entrar
          </Button>
        </form>

        <div className="mt-10 w-full">
          <p className="text-zinc-500 text-sm">
            Não tem uma conta para sua empresa?{' '}
            <Link to="/register" className="text-sky-500 hover:underline">
              Inscreva-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
