import React from 'react';
import { X, History, Wrench, Sparkles, Rocket, Zap } from 'lucide-react';
import { CHANGELOG_DATA, ChangelogItem } from '../data/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getTypeBadge = (type: ChangelogItem['type']) => {
    switch (type) {
      case 'Hotfix':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <Wrench className="w-3 h-3" />
            Hotfix
          </span>
        );
      case 'Update':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Zap className="w-3 h-3" />
            Update
          </span>
        );
      case 'Feature':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Sparkles className="w-3 h-3" />
            Feature
          </span>
        );
      case 'Release':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <Rocket className="w-3 h-3" />
            Release
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-pink-500 rounded-xl text-white shadow-lg shadow-amber-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">История обновлений (Changelog)</h2>
              <p className="text-xs text-slate-400">Список исправлений, обновлений и новых функций</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {CHANGELOG_DATA.map((item) => (
            <div
              key={item.version}
              className="p-4 rounded-xl bg-slate-800/50 border border-white/10 hover:border-white/20 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-extrabold text-white">v{item.version}</span>
                  {getTypeBadge(item.type)}
                </div>
                <span className="text-xs text-slate-400 font-mono">{item.date}</span>
              </div>

              <h3 className="text-sm font-semibold text-amber-300">{item.title}</h3>

              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {item.changes.map((change, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
