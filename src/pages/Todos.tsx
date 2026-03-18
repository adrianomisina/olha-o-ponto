import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare } from 'lucide-react';

const Todos = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col w-full"
    >
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4">
        <h1 className="text-xl font-bold">Minhas Tarefas</h1>
      </div>

      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
          <CheckSquare className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Nenhuma tarefa encontrada</h2>
        <p className="text-zinc-500 max-w-xs">
          Você ainda não tem tarefas atribuídas. Fique atento para novas atualizações!
        </p>
      </div>
    </motion.div>
  );
};

export default Todos;
