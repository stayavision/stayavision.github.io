import React, { useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';

interface RenderModalProps {
  isOpen: boolean;
  progressFrame: number;
  totalFrames: number;
  statusMessage: string;
  logs: string[];
  liveCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  fps?: number;
  onCancel: () => void;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  isOpen,
  progressFrame,
  totalFrames,
  statusMessage,
  logs,
  liveCanvasRef,
  fps,
  onCancel,
}) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  const percentage = totalFrames > 0 ? Math.min(Math.round((progressFrame / totalFrames) * 100), 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0a0a0c] border border-indigo-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center text-zinc-200 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between w-full border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            <h3 className="text-lg font-black text-indigo-300 tracking-wide">
              РЕНДЕРИНГ ВИДЕО {fps ? `(${fps} FPS)` : ''}...
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Canvas Preview Frame */}
        <div className="w-full aspect-video bg-[#050506] rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shadow-inner relative">
          <canvas ref={liveCanvasRef} className="max-w-full max-h-full object-contain" />
        </div>

        {/* Progress Bar */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-zinc-300">
            <span>{statusMessage || 'Инициализация...'}</span>
            <span className="text-indigo-400">{percentage}%</span>
          </div>
          <div className="w-full h-3 bg-[#050506] rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Live Console Logs */}
        <div className="w-full h-32 bg-[#050506] border border-white/10 rounded-xl p-3 font-mono text-xs text-emerald-400 overflow-y-auto flex flex-col gap-1 shadow-inner">
          {logs.map((log, i) => (
            <div key={i} className="leading-relaxed whitespace-pre-wrap">
              {log}
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-xl text-xs font-bold uppercase transition-all"
        >
          Отменить рендер
        </button>
      </div>
    </div>
  );
};
