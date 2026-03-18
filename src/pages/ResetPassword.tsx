import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao redefinir senha');
      }

      setMessage(data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
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
        <h2 className="text-3xl font-bold mb-4 w-full text-center">Redefinir Senha</h2>
        <p className="text-zinc-500 text-center mb-8">
          Insira sua nova senha abaixo.
        </p>

        <form className="space-y-6 w-full" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 p-3 rounded-md flex items-center gap-3 text-rose-500">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 p-3 rounded-md flex items-center gap-3 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <input
                type="password"
                required
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full bg-black border border-zinc-700 rounded-md px-4 py-4 text-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 peer placeholder-transparent"
                placeholder="Nova Senha"
                id="password"
              />
              <label htmlFor="password" className="absolute left-4 top-2 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-500">
                Nova Senha
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                required
                maxLength={128}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full bg-black border border-zinc-700 rounded-md px-4 py-4 text-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 peer placeholder-transparent"
                placeholder="Confirmar Senha"
                id="confirmPassword"
              />
              <label htmlFor="confirmPassword" className="absolute left-4 top-2 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-500">
                Confirmar Senha
              </label>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            variant="primary"
            size="full"
            className="mt-6"
          >
            Redefinir Senha
          </Button>
        </form>

        <div className="mt-10 w-full text-center">
          <Link to="/login" className="text-sky-500 hover:underline text-sm">
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
