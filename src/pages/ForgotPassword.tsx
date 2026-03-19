import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
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
        body: JSON.stringify({ email }),
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
          Insira seu email cadastrado para receber um link de redefinição de senha.
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

          <Button
            type="submit"
            isLoading={isLoading}
            variant="primary"
            size="full"
            className="mt-6"
          >
            Enviar Link
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
