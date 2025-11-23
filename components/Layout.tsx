import React from 'react';
import { Home, PlusCircle, User as UserIcon, LogOut } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
  showNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onChangeView, 
  onLogout,
  showNav = true
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100">
      <main className="flex-1 pb-28 relative">
        {children}
      </main>

      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200/60 px-6 py-4 flex justify-between items-center z-50 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => onChangeView('DASHBOARD')}
            className={`flex flex-col items-center space-y-1 transition-colors ${currentView === 'DASHBOARD' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Home size={24} strokeWidth={currentView === 'DASHBOARD' ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide uppercase mt-1">Home</span>
          </button>

          <button 
            onClick={() => onChangeView('CREATE_TRIP')}
            className="flex flex-col items-center justify-center -mt-8 group"
          >
            <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-200 group-active:scale-95 transition-all group-hover:bg-blue-700 group-hover:shadow-blue-300">
              <PlusCircle size={28} />
            </div>
          </button>

          <button 
            onClick={onLogout}
            className="flex flex-col items-center space-y-1 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={24} />
            <span className="text-[10px] font-bold tracking-wide uppercase mt-1">Sair</span>
          </button>
        </div>
      )}
    </div>
  );
};