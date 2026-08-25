import React from 'react';
import { Settings, Eye, ShieldCheck, Sparkles, History } from 'lucide-react';

interface HeaderProps {
  isAdminLoggedIn: boolean;
  onOpenAdmin: () => void;
  onOpenChangelog: () => void;
  activeMobileTab: 'editor' | 'preview';
  onSelectMobileTab: (tab: 'editor' | 'preview') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdminLoggedIn,
  onOpenAdmin,
  onOpenChangelog,
  activeMobileTab,
  onSelectMobileTab,
}) => {
  return (
    <>
      <header className="relative flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-white/10 backdrop-blur-md z-20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              ГЕНЕРАТОР СКОРБОРДА
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Интерактивные таблицы результатов в стиле Стаявидение и Евровидение
            </p>
          </div>
          <button
            onClick={onOpenChangelog}
            title="Открыть ченджлог"
            className="flex items-center space-x-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-amber-300" />
            <span>v2.7.2 [Hotfix]</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenChangelog}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-slate-200 hover:bg-white/20 transition-all"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Ченджлог</span>
          </button>

          <button
            onClick={onOpenAdmin}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              isAdminLoggedIn
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isAdminLoggedIn ? '🛠 DEBUG Админка' : 'Вход / Админ'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-center gap-2 p-2 bg-slate-950/95 border-b border-white/10 backdrop-blur-lg">
        <button
          onClick={() => onSelectMobileTab('editor')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
            activeMobileTab === 'editor'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-pink-500/30'
              : 'bg-white/10 text-slate-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>⚙️ Настройки</span>
        </button>
        <button
          onClick={() => onSelectMobileTab('preview')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
            activeMobileTab === 'preview'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-pink-500/30'
              : 'bg-white/10 text-slate-300'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>👁️ Превью</span>
        </button>
      </div>
    </>
  );
};
