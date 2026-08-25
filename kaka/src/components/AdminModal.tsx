import React, { useState } from 'react';
import { X, ShieldCheck, Save, Trash2, Wand2 } from 'lucide-react';
import { ScoreboardState } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  state: ScoreboardState;
  onClose: () => void;
  onSavePreset: (presetName: string) => void;
  onDeletePreset: (presetId: string) => void;
  onAutoResults: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  state,
  onClose,
  onSavePreset,
  onDeletePreset,
  onAutoResults,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedDeleteId, setSelectedDeleteId] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!newPresetName.trim()) return;
    onSavePreset(newPresetName.trim());
    setNewPresetName('');
  };

  const handleDelete = () => {
    if (!selectedDeleteId) return;
    onDeletePreset(selectedDeleteId);
    setSelectedDeleteId('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-2xl text-zinc-200 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-indigo-300">🛠 МЕНЮ АДМИНА</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Preset */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-zinc-300">Сохранить текущие настройки как пресет:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Например: Полуфинал 8"
              className="flex-1 px-3 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Сохранить</span>
            </button>
          </div>
        </div>

        {/* Delete Preset */}
        {state.customPresets && state.customPresets.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <label className="text-xs font-bold text-zinc-300">Удалить кастомный пресет:</label>
            <div className="flex gap-2">
              <select
                value={selectedDeleteId}
                onChange={(e) => setSelectedDeleteId(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Выберите пресет --</option>
                {state.customPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить</span>
              </button>
            </div>
          </div>
        )}

        {/* Random test results */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={onAutoResults}
            className="w-full py-2.5 bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5"
          >
            <Wand2 className="w-4 h-4 text-purple-300" />
            <span>⚡ Сгенерировать случайные результаты</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded-xl mt-2"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};
