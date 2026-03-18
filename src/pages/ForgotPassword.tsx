import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, User, Building2, MessageSquare } from 'lucide-react';
import Button from '../components/Button';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'employee';
  const [role, setRole] = useState<'employee' | 'admin'>(initialRole);
  const [email, setEmail] = useState('');
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, message: messageText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao processar solicitação');
      }

      setMessage(data.message);
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
        <h2 className="text-3xl font-bold mb-4 w-full text-center">Recuperar Senha</h2>
        <p className="text-zinc-500 text-center mb-8">
          {role === 'admin'
            ? 'Insira seu email para receber um link de recuperação.'
            : 'Informe seu email e uma mensagem. O administrador da empresa será avisado.'}
        </p>

        <div className="flex w-full bg-zinc-900 rounded-xl p-1 mb-8">
          <button
            type="button"
            onClick={() => setRole('employee')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
              role === 'employee' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <User className="w-4 h-4" />
            Funcionário
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
              role === 'admin' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
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

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 p-3 rounded-md flex items-center gap-3 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm">{message}</p>
            </div>
          )}

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

          {role === 'employee' && (
            <div className="relative">
              <textarea
                required
                maxLength={1000}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="block w-full min-h-32 bg-black border border-zinc-700 rounded-md px-4 py-4 text-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 placeholder-zinc-500"
                placeholder="Explique rapidamente o problema para o administrador."
              />
              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                <MessageSquare className="w-4 h-4" />
                Sua mensagem ficará disponível para o administrador.
              </div>
            </div>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            variant="primary"
            size="full"
            className="mt-6"
          >
            {role === 'admin' ? 'Enviar Link' : 'Enviar Solicitação'}
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

export default ForgotPassword;
