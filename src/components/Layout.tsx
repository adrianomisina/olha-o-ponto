import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Clock, Users, FileText, LogOut, Home, User, Settings, CreditCard, X, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  const employeeLinks = [
    { name: 'Início', path: '/app', icon: Home },
    { name: 'Histórico', path: '/app/history', icon: Clock },
    { name: 'Ajustes', path: '/app/adjustments', icon: FileText },
    { name: 'Tarefas', path: '/app/todos', icon: CheckSquare },
  ];

  const adminLinks = [
    { name: 'Início', path: '/admin', icon: Home },
    { name: 'Equipe', path: '/admin/employees', icon: Users },
    { name: 'Aprovações', path: '/admin/approvals', icon: FileText },
    { name: 'Relatórios', path: '/admin/reports', icon: FileText },
    { name: 'Tarefas', path: '/admin/todos', icon: CheckSquare },
    { name: 'Pagamentos', path: '/admin/payments', icon: CreditCard },
    { name: 'Configurações', path: '/admin/settings', icon: Settings },
  ];

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex justify-center">
      {/* Desktop Sidebar */}
      <header className="hidden sm:flex w-20 lg:w-64 flex-col justify-between border-r border-zinc-800 h-screen sticky top-0 pb-6 pt-4 px-2 lg:px-6">
        <div className="flex flex-col gap-2">
          <Link to={user?.role === 'admin' ? '/admin' : '/app'} className="p-3 w-fit rounded-full hover:bg-zinc-900 transition-colors mb-2">
            <Clock className="w-8 h-8 text-white" />
          </Link>
          
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-4 p-3 w-fit lg:w-full rounded-full transition-colors ${
                    isActive ? 'font-bold' : 'hover:bg-zinc-900'
                  }`}
                >
                  <Icon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-zinc-100'}`} />
                  <span className="hidden lg:block text-xl">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center justify-between lg:p-3 rounded-full hover:bg-zinc-900 transition-colors cursor-pointer" onClick={handleLogoutClick}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block">
              <p className="font-bold text-sm leading-tight">{user?.name}</p>
              <p className="text-zinc-500 text-sm leading-tight">@{user?.role}</p>
            </div>
          </div>
          <LogOut className="hidden lg:block w-5 h-5 text-zinc-500" />
        </div>
      </header>

      {/* Main Content */}
      <main className={`w-full border-x border-zinc-800 min-h-screen pb-20 sm:pb-0 ${user?.role === 'admin' ? 'sm:max-w-[980px]' : 'sm:max-w-[600px]'}`}>
        <Outlet />
      </main>

      {/* Right Sidebar (Empty for now, keeps center column centered like X) */}
      <div className="hidden lg:block w-80 pl-8 py-4">
        {/* Can add trends or company info here later */}
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 w-full bg-black border-t border-zinc-800 flex justify-around items-center h-14 z-50 pb-safe">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link key={link.path} to={link.path} className="p-3">
              <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
            </Link>
          );
        })}
        <button onClick={handleLogoutClick} className="p-3">
          <LogOut className="w-6 h-6 text-zinc-500" />
        </button>
      </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-black border border-zinc-800 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                  <LogOut className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sair da conta?</h3>
                <p className="text-zinc-400 mb-8">
                  Tem certeza que deseja sair? Você precisará entrar novamente para acessar seus dados.
                </p>
                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={confirmLogout}
                    className="w-full py-3 px-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors"
                  >
                    Sair
                  </button>
                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="w-full py-3 px-4 bg-transparent text-white font-bold border border-zinc-800 rounded-full hover:bg-zinc-900 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
