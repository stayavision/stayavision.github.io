import React from 'react';
import { Participant } from '../types';
import { Award, X, RotateCcw, CheckCircle2, Zap, UserCheck, Video, Trash2 } from 'lucide-react';

interface JuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  juryVoterId: number | null;
  onSelectJuryVoter: (id: number | null) => void;
  onUpdateParticipant: (id: number, field: keyof Participant, value: string | number) => void;
  onResetAddScores: () => void;
  onResetAllScoresToZero: () => void;
  onCommitScores: () => void;
  onRenderVideo: () => void;
}

export const JuryModal: React.FC<JuryModalProps> = ({
  isOpen,
  onClose,
  participants,
  juryVoterId,
  onSelectJuryVoter,
  onUpdateParticipant,
  onResetAddScores,
  onResetAllScoresToZero,
  onCommitScores,
  onRenderVideo,
}) => {
  if (!isOpen) return null;

  const quickPoints = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];
  const selectedJury = participants.find((p) => p.id === juryVoterId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#0c0d12] border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-amber-200 tracking-wide uppercase flex items-center gap-2">
                ГОЛОСОВАНИЕ ЖЮРИ
              </h2>
              <p className="text-xs text-amber-400/80">
                Гибкое начисление евровизионных баллов и скачка видео прямого эфира
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Jury Voter Selector Bar */}
        <div className="p-4 bg-[#08080c] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-amber-300 shrink-0">Голосует жюри:</span>
            <select
              value={juryVoterId || ''}
              onChange={(e) => onSelectJuryVoter(e.target.value ? Number(e.target.value) : null)}
              className="bg-[#121218] border border-amber-500/40 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400 flex-1 shadow-inner"
            >
              <option value="">-- Без плашки жюри --</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {selectedJury && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-bold">
              {selectedJury.avatar && (
                <img
                  src={selectedJury.avatar}
                  alt={selectedJury.name}
                  className="w-6 h-6 rounded-full object-cover border border-amber-300"
                />
              )}
              <span>Плашка: Голосует {selectedJury.name}</span>
            </div>
          )}

          <button
            onClick={() => {
              onRenderVideo();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
          >
            <Video className="w-4 h-4 text-purple-200" />
            <span>🎬 Скачать видео голосования</span>
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#050507] border-b border-white/10">
          <div className="text-xs font-bold text-zinc-400">
            Участников: <span className="text-white">{participants.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onResetAddScores}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-300 bg-white/10 hover:bg-white/20 border border-white/10 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить +баллы</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Сбросить ВСЕ баллы участников в 0?')) {
                  onResetAllScoresToZero();
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-300 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Сбросить ВСЕ баллы в 0</span>
            </button>
            <button
              onClick={() => {
                onCommitScores();
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 to-yellow-300 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Прибавить все +баллы к счету</span>
            </button>
          </div>
        </div>

        {/* Participants Voting List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-3">
          {participants.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-sm">
              Список участников пуст. Добавьте участников в главном меню.
            </div>
          ) : (
            participants.map((p, idx) => {
              return (
                <div
                  key={p.id}
                  className="p-3 bg-[#050507] border border-white/10 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-amber-500/30 transition-all"
                >
                  {/* Left: Rank, Avatar, Name & Current score */}
                  <div className="flex items-center space-x-3 shrink-0 min-w-[220px]">
                    <span className="font-black text-zinc-500 w-6 text-center text-sm">
                      #{idx + 1}
                    </span>
                    {p.avatar && (
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-extrabold text-sm text-white">{p.name}</span>
                      <span className="text-xs text-zinc-400">
                        Счет: <strong className="text-cyan-300">{p.score}</strong>
                        {p.addScore > 0 && (
                          <span className="ml-2 font-black text-emerald-400">
                            (+{p.addScore})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Flexible Point Entry & Quick Buttons */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Custom Score Input */}
                    <div className="flex items-center gap-1.5 bg-[#121218] border border-amber-500/40 rounded-xl px-2.5 py-1">
                      <span className="text-[11px] font-bold text-amber-400">+Баллы:</span>
                      <input
                        type="number"
                        min={0}
                        value={p.addScore === 0 ? '' : p.addScore}
                        onChange={(e) =>
                          onUpdateParticipant(
                            p.id,
                            'addScore',
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        placeholder="0"
                        className="w-16 bg-transparent text-amber-200 font-black text-sm text-center focus:outline-none"
                      />
                    </div>

                    {/* Quick +Points Buttons */}
                    <div className="flex flex-wrap items-center gap-1">
                      {quickPoints.map((pts) => {
                        const isSelected = p.addScore === pts;
                        return (
                          <button
                            key={pts}
                            onClick={() => onUpdateParticipant(p.id, 'addScore', pts)}
                            className={`px-2 py-1 rounded-lg font-black text-xs transition-all border ${
                              isSelected
                                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-105'
                                : pts >= 10
                                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/15'
                            }`}
                          >
                            +{pts}
                          </button>
                        );
                      })}

                      {/* Reset button for this participant */}
                      <button
                        onClick={() => onUpdateParticipant(p.id, 'addScore', 0)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all border ${
                          p.addScore === 0
                            ? 'bg-white/10 text-zinc-500 border-white/5'
                            : 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                        }`}
                        title="Сбросить +баллы"
                      >
                        0
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#08080a] border-t border-white/10 text-center text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Выбирайте голосующего участника жюри, выставляйте любые баллы и скачивайте готовое видео!
          </span>
        </div>
      </div>
    </div>
  );
};
