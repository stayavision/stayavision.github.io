import React, { useRef } from 'react';
import { ScoreboardState, Participant, Preset } from '../types';
import { DEFAULT_AVATARS, DEFAULT_PRESETS } from '../data/presets';
import {
  RotateCcw,
  Palette,
  Play,
  Download,
  Video,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Shuffle,
  Wand2,
  Award,
  Volume2,
  DownloadCloud,
} from 'lucide-react';

interface ControlsPanelProps {
  state: ScoreboardState;
  onChangeState: <K extends keyof ScoreboardState>(key: K, value: ScoreboardState[K]) => void;
  onResetState: () => void;
  onResetOffsets: () => void;
  onLoadPreset: (presetId: string) => void;
  onUpdateParticipant: (id: number, field: keyof Participant, value: string | number) => void;
  onMoveParticipant: (id: number, direction: number) => void;
  onAddParticipant: () => void;
  onRemoveParticipant: (id: number) => void;
  onRandomizeParticipants: () => void;
  onAutoColor: () => void;
  onPlayAnimation: () => void;
  onDownloadImage: () => void;
  onRenderVideo: () => void;
  onOpenJuryModal: () => void;
  onImportAllServer: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  state,
  onChangeState,
  onResetState,
  onResetOffsets,
  onLoadPreset,
  onUpdateParticipant,
  onMoveParticipant,
  onAddParticipant,
  onRemoveParticipant,
  onRandomizeParticipants,
  onAutoColor,
  onPlayAnimation,
  onDownloadImage,
  onRenderVideo,
  onOpenJuryModal,
  onImportAllServer,
}) => {
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    onChangeState('bgIsVideo', isVideo);

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        onChangeState('bgCustomData', ev.target.result as string);
        onChangeState('bgType', 'custom');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (id: number, newAvatar: string) => {
    onUpdateParticipant(id, 'avatar', newAvatar);
    // Find matching default avatar name
    const matching = DEFAULT_AVATARS.find((av) => av.file === newAvatar);
    if (matching && matching.name && matching.name !== 'Дефолт') {
      onUpdateParticipant(id, 'name', matching.name);
    }
  };

  const allPresets: Preset[] = [...DEFAULT_PRESETS, ...(state.customPresets || [])];

  return (
    <div className="w-full max-w-xl bg-[#0a0a0c] border border-white/10 rounded-2xl p-4 md:p-5 text-zinc-300 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-100px)] backdrop-blur-md shadow-[0_0_25px_rgba(0,0,0,0.8)]">
      {/* Header Reset & Presets */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h2 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>⚙️</span>
          <span>НАСТРОЙКИ СКОРБОРДА</span>
        </h2>
        <button
          onClick={onResetState}
          className="flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Сброс</span>
        </button>
      </div>

      {/* Presets dropdown */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">
          База пресетов
        </label>
        <select
          value=""
          onChange={(e) => onLoadPreset(e.target.value)}
          className="w-full px-3 py-2 bg-[#050506] border border-amber-400/40 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-400 text-amber-100"
        >
          <option value="">-- Выберите для загрузки пресета --</option>
          {allPresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Section 1: Text & Format */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] font-black text-indigo-400 uppercase tracking-wide border-b border-white/10 pb-1">
          Текст и Формат
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Заголовок</label>
            <input
              type="text"
              value={state.title}
              onChange={(e) => onChangeState('title', e.target.value)}
              className="px-3 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Подзаголовок</label>
            <input
              type="text"
              value={state.subtitle}
              onChange={(e) => onChangeState('subtitle', e.target.value)}
              className="px-3 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Шрифт заголовка</label>
            <select
              value={state.fontTitle}
              onChange={(e) => onChangeState('fontTitle', e.target.value)}
              className="px-3 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="Playfair Display">Playfair Display</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Roboto">Roboto</option>
              <option value="Oswald">Oswald</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Caveat">Caveat</option>
              <option value="Comfortaa">Comfortaa</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Шрифт плашек</label>
            <select
              value={state.fontBoard}
              onChange={(e) => onChangeState('fontBoard', e.target.value)}
              className="px-3 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="Montserrat">Montserrat</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Roboto">Roboto</option>
              <option value="Oswald">Oswald</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Caveat">Caveat</option>
              <option value="Comfortaa">Comfortaa</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Соотношение сторон</label>
            <select
              value={state.aspectRatio}
              onChange={(e) => onChangeState('aspectRatio', e.target.value as any)}
              className="px-3 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="16/9">16:9 (Стандарт)</option>
              <option value="21/9">21:9 (Широкий)</option>
              <option value="4/3">4:3 (ТВ)</option>
              <option value="1/1">1:1 (Квадрат)</option>
              <option value="9/16">9:16 (Вертикальный Reels)</option>
              <option value="custom">Свой размер...</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Колонки (1-6)</label>
            <select
              value={state.columns}
              onChange={(e) => onChangeState('columns', Number(e.target.value))}
              className="px-3 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Движок рендеринга</label>
            <select
              value={state.renderEngine || 'fast_gpu'}
              onChange={(e) => onChangeState('renderEngine', e.target.value as any)}
              className="px-3 py-1.5 bg-[#050506] border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
            >
              <option value="fast_gpu">⚡ Новый (Ускоренный GPU Beta)</option>
              <option value="legacy">🐢 Старый (Canvas2D)</option>
            </select>
          </div>
        </div>

        {/* Custom Resolution Inputs */}
        {state.aspectRatio === 'custom' && (
          <div className="grid grid-cols-2 gap-3 p-2.5 bg-[#050506] rounded-xl border border-white/10">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-400">Ширина (px)</label>
              <input
                type="number"
                value={state.customW}
                onChange={(e) => onChangeState('customW', Number(e.target.value))}
                className="px-2.5 py-1 bg-[#0a0a0c] border border-white/10 rounded text-xs text-zinc-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-400">Высота (px)</label>
              <input
                type="number"
                value={state.customH}
                onChange={(e) => onChangeState('customH', Number(e.target.value))}
                className="px-2.5 py-1 bg-[#0a0a0c] border border-white/10 rounded text-xs text-zinc-200"
              />
            </div>
          </div>
        )}

        <label className="flex items-center space-x-2 text-xs font-bold text-zinc-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={state.textUppercase}
            onChange={(e) => onChangeState('textUppercase', e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          <span>ВСЕ ЗАГЛАВНЫМИ БУКВАМИ</span>
        </label>
      </div>

      {/* Section 2: Design & Colors */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] font-black text-indigo-400 uppercase tracking-wide border-b border-white/10 pb-1">
          Дизайн и Цвета
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Стиль дизайна</label>
            <select
              value={state.style}
              onChange={(e) => onChangeState('style', e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="stayavision">Стаявидение</option>
              <option value="eurovision">Eurovision</option>
              <option value="splitscreen">Сплит-скрин</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Анимация</label>
            <select
              value={state.animStyle}
              onChange={(e) => onChangeState('animStyle', e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="smooth">Плавная</option>
              <option value="bounce">Пружинка</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Форма аватарок</label>
            <select
              value={state.avatarShape}
              onChange={(e) => onChangeState('avatarShape', e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="50%">Круг</option>
              <option value="8px">Закругленный</option>
              <option value="0px">Квадрат</option>
            </select>
          </div>
        </div>

        {/* Bar Gradient */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Градиент плашек</label>
            <button
              onClick={onAutoColor}
              className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 transition-all"
            >
              <Palette className="w-3 h-3" />
              <span>🎨 Авто-цвет</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={state.barColor1}
              onChange={(e) => onChangeState('barColor1', e.target.value)}
              className="w-10 h-8 rounded bg-transparent border border-white/20 cursor-pointer"
            />
            <input
              type="color"
              value={state.barColor2}
              onChange={(e) => onChangeState('barColor2', e.target.value)}
              className="w-10 h-8 rounded bg-transparent border border-white/20 cursor-pointer"
            />
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] text-zinc-400">Прозрачность: {state.barAlpha}</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={state.barAlpha}
                onChange={(e) => onChangeState('barAlpha', Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Top 3 Highlight colors */}
        <div className="flex flex-col gap-2 pt-1">
          <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={state.highlightTop3}
              onChange={(e) => onChangeState('highlightTop3', e.target.checked)}
              className="w-4 h-4 rounded accent-amber-400"
            />
            <span>Выделять 1, 2, 3 места особым цветом</span>
          </label>

          {state.highlightTop3 && (
            <div className="grid grid-cols-3 gap-2 p-2 bg-slate-950/60 rounded-xl border border-white/10">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-amber-300 font-bold">1st:</span>
                <input
                  type="color"
                  value={state.c1}
                  onChange={(e) => onChangeState('c1', e.target.value)}
                  className="w-8 h-7 rounded bg-transparent border border-white/20"
                />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-300 font-bold">2nd:</span>
                <input
                  type="color"
                  value={state.c2}
                  onChange={(e) => onChangeState('c2', e.target.value)}
                  className="w-8 h-7 rounded bg-transparent border border-white/20"
                />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-amber-600 font-bold">3rd:</span>
                <input
                  type="color"
                  value={state.c3}
                  onChange={(e) => onChangeState('c3', e.target.value)}
                  className="w-8 h-7 rounded bg-transparent border border-white/20"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Layout & Offsets */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] font-black text-indigo-400 uppercase tracking-wide border-b border-white/10 pb-1">
          Макет и Сдвиги
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-400">Отступ X (px): {state.padX}</span>
            <input
              type="range"
              min="0"
              max="200"
              value={state.padX}
              onChange={(e) => onChangeState('padX', Number(e.target.value))}
              className="accent-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-400">Отступ Y (px): {state.padY}</span>
            <input
              type="range"
              min="0"
              max="200"
              value={state.padY}
              onChange={(e) => onChangeState('padY', Number(e.target.value))}
              className="accent-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-400">Общий масштаб: {state.scale}</span>
            <input
              type="range"
              min="0.4"
              max="1.5"
              step="0.05"
              value={state.scale}
              onChange={(e) => onChangeState('scale', Number(e.target.value))}
              className="accent-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-400">Масштаб плашек: {state.barScale}</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={state.barScale}
              onChange={(e) => onChangeState('barScale', Number(e.target.value))}
              className="accent-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-[10px] text-amber-300 font-bold">Сдвиг всех плашек по Y (px): {state.cardYOffset || 0}</span>
            <input
              type="range"
              min="-300"
              max="300"
              step="2"
              value={state.cardYOffset || 0}
              onChange={(e) => onChangeState('cardYOffset', Number(e.target.value))}
              className="accent-amber-500"
            />
          </div>
        </div>

        {/* Fine offsets micro-adjustments */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-zinc-400">Текст X/Y</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={state.nameX}
                onChange={(e) => onChangeState('nameX', Number(e.target.value))}
                className="w-full px-1.5 py-0.5 bg-[#050506] border border-white/10 rounded text-xs text-zinc-200"
              />
              <input
                type="number"
                value={state.nameY}
                onChange={(e) => onChangeState('nameY', Number(e.target.value))}
                className="w-full px-1.5 py-0.5 bg-[#050506] border border-white/10 rounded text-xs text-zinc-200"
              />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-zinc-400">Баллы X/Y</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={state.scoreX}
                onChange={(e) => onChangeState('scoreX', Number(e.target.value))}
                className="w-full px-1.5 py-0.5 bg-[#050506] border border-white/10 rounded text-xs text-zinc-200"
              />
              <input
                type="number"
                value={state.scoreY}
                onChange={(e) => onChangeState('scoreY', Number(e.target.value))}
                className="w-full px-1.5 py-0.5 bg-[#050506] border border-white/10 rounded text-xs text-zinc-200"
              />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-zinc-400">Место X/Y</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={state.posX}
                onChange={(e) => onChangeState('posX', Number(e.target.value))}
                className="w-full px-1.5 py-0.5 bg-[#050506] border border-white/10 rounded text-xs text-zinc-200"
              />
              <input
                type="number"
                value={state.posY}
                onChange={(e) => onChangeState('posY', Number(e.target.value))}
                className="w-full px-1.5 py-0.5 bg-[#050506] border border-white/10 rounded text-xs text-zinc-200"
              />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-zinc-400">Аватар X/Y</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={state.avaX}
                onChange={(e) => onChangeState('avaX', Number(e.target.value))}
                className="w-full px-1.5 py-0.5 bg-[#050506] border border-white/10 rounded text-xs text-zinc-200"
              />
              <input
                type="number"
                value={state.avaY}
                onChange={(e) => onChangeState('avaY', Number(e.target.value))}
                className="w-full px-1.5 py-0.5 bg-[#050506] border border-white/10 rounded text-xs text-zinc-200"
              />
            </div>
          </div>
        </div>

        <button
          onClick={onResetOffsets}
          className="text-xs text-red-400 hover:text-red-300 underline font-semibold self-start"
        >
          Сбросить все микро-сдвиги
        </button>

        {/* Background Selector */}
        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Задний фон</label>
          <div className="flex gap-2">
            <select
              value={state.bgType}
              onChange={(e) => onChangeState('bgType', e.target.value)}
              className="flex-1 px-3 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="none">Темная заливка</option>
              <option value="/bgs/wolfs.jpg">Фон Волки (wolfs.jpg)</option>
              <option value="/bgs/sv6.webp">Фон Стаявидение 6 (sv6.webp)</option>
              <option value="/bgs/sv7.webp">Фон Стаявидение 7 (sv7.webp)</option>
              <option value="/bgs/sv8.webp">Фон Стаявидение 8 (sv8.webp)</option>
              <option value="custom">Свой файл (Картинка / Видео)...</option>
            </select>
            <button
              onClick={() => customBgInputRef.current?.click()}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold transition-all"
            >
              Загрузить
            </button>
            <input
              ref={customBgInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleBgFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Display Toggles & Mode */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] font-black text-indigo-400 uppercase tracking-wide border-b border-white/10 pb-1">
          Режим и Отображение
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Режим экрана</label>
            <select
              value={state.viewMode}
              onChange={(e) => onChangeState('viewMode', e.target.value as any)}
              className="px-3 py-1.5 bg-[#050506] border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="results">Результаты (Сортировка по баллам)</option>
              <option value="running_order">Running Order (Фиксированный порядок)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Стиль анимации</label>
            <select
              value={state.animStyle || 'smooth'}
              onChange={(e) => onChangeState('animStyle', e.target.value as any)}
              className="px-3 py-1.5 bg-[#050506] border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
            >
              <option value="smooth">✨ Плавный (Smooth Ease-Out)</option>
              <option value="bounce">🏀 Прыгучий (Elastic Spring)</option>
              <option value="eurovision">🌊 Евровизионный Всплеск (Eurovision Wave)</option>
              <option value="glitch">⚡ Неоновый Глитч (Neon Cyber/Glitch)</option>
              <option value="zoom_slide">🚀 Турбо Масштаб (Zoom Leader)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 col-span-1 sm:col-span-2 bg-[#050506] p-2 rounded-xl border border-amber-500/30">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">⏱️ Длительность видео: {state.videoDurationSec || 10} сек</label>
              <span className="text-[10px] text-zinc-400 font-mono">{(state.videoDurationSec || 10) >= 15 ? '🎬 Длинный показ' : (state.videoDurationSec || 10) >= 8 ? '⚡ Стандарт' : '🚀 Быстрый клип'}</span>
            </div>
            <input
              type="range"
              min="3"
              max="30"
              step="1"
              value={state.videoDurationSec || 10}
              onChange={(e) => onChangeState('videoDurationSec', Number(e.target.value))}
              className="accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Рендеринг (FPS)</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onChangeState('renderFps', 30)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                  (state.renderFps || 30) === 30
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-[#050506] text-zinc-400 border-white/10 hover:border-white/20'
                }`}
              >
                30 FPS
              </button>
              <button
                type="button"
                onClick={() => onChangeState('renderFps', 60)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                  state.renderFps === 60
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-[#050506] text-zinc-400 border-white/10 hover:border-white/20'
                }`}
              >
                ⚡ 60 FPS
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#050506] p-2.5 rounded-xl border border-white/10">
          <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={state.showPositions}
              onChange={(e) => onChangeState('showPositions', e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-600"
            />
            <span>Места</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={state.showAvatars}
              onChange={(e) => onChangeState('showAvatars', e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-600"
            />
            <span>Аватарки</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={state.showNames}
              onChange={(e) => onChangeState('showNames', e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-600"
            />
            <span>Имена</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={state.showNotes}
              onChange={(e) => onChangeState('showNotes', e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-600"
            />
            <span>Заметки</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={state.showScores}
              onChange={(e) => onChangeState('showScores', e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-600"
            />
            <span>Баллы</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={state.showScoreBars}
              onChange={(e) => onChangeState('showScoreBars', e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-600"
            />
            <span>Полоски</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-bold text-amber-300 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showLeaderCrown !== false}
              onChange={(e) => onChangeState('showLeaderCrown', e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-500 rounded"
            />
            <span>👑 Корона #1</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-bold text-emerald-300 cursor-pointer">
            <input
              type="checkbox"
              checked={state.particleEffects !== false}
              onChange={(e) => onChangeState('particleEffects', e.target.checked)}
              className="w-3.5 h-3.5 accent-emerald-500 rounded"
            />
            <span>✨ Искры/Салют</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-bold text-amber-300 col-span-2 sm:col-span-1 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={state.soundEnabled !== false}
              onChange={(e) => onChangeState('soundEnabled', e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded"
            />
            <span className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" /> Включить звуки
            </span>
          </label>
        </div>
      </div>

      {/* Section 5: Main Export Buttons */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10">
        <button
          onClick={onOpenJuryModal}
          className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
        >
          <Award className="w-4 h-4" />
          <span>🏆 ГОЛОСОВАНИЕ ЖЮРИ</span>
        </button>

        <button
          onClick={onPlayAnimation}
          className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>▶ ПРЕДПРОСМОТР АНИМАЦИИ</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onDownloadImage}
            className="py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>🖼️ КАРТИНКА</span>
          </button>

          <button
            onClick={onRenderVideo}
            className="py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-1.5"
          >
            <Video className="w-4 h-4" />
            <span>🎬 ВИДЕО (WEBM)</span>
          </button>
        </div>
      </div>

      {/* Section 6: Participants Editor */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          <span className="text-[11px] font-black text-indigo-400 uppercase tracking-wide">
            Редактор Участников ({state.participants.length})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onImportAllServer}
              className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-all"
            >
              <DownloadCloud className="w-3 h-3" />
              <span>Импорт всех с сервера</span>
            </button>
            <button
              onClick={onRandomizeParticipants}
              className="flex items-center space-x-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 transition-all"
            >
              <Shuffle className="w-3 h-3" />
              <span>Жеребьевка</span>
            </button>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-[24px_80px_1fr_1fr_60px_55px_24px] gap-1.5 px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          <span></span>
          <span>Аватар</span>
          <span>Имя</span>
          <span>Заметка</span>
          <span>Балл</span>
          <span className="text-emerald-400">+ Добав.</span>
          <span></span>
        </div>

        {/* Participants Rows */}
        <div className="flex flex-col gap-2">
          {state.participants.map((p, idx) => (
            <div
              key={p.id}
              className="grid grid-cols-[24px_80px_1fr_1fr_60px_55px_24px] gap-1.5 items-center bg-[#050506] p-2 rounded-xl border border-white/10"
            >
              {/* Up/Down buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  disabled={idx === 0}
                  onClick={() => onMoveParticipant(p.id, -1)}
                  className="p-0.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  disabled={idx === state.participants.length - 1}
                  onClick={() => onMoveParticipant(p.id, 1)}
                  className="p-0.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Avatar Selector */}
              <select
                value={p.avatar}
                onChange={(e) => handleAvatarChange(p.id, e.target.value)}
                className="w-full px-1 py-1 bg-[#0a0a0c] border border-white/10 rounded text-[11px] font-medium text-zinc-200 focus:outline-none"
              >
                {DEFAULT_AVATARS.map((av) => (
                  <option key={av.file} value={av.file}>
                    {av.name}
                  </option>
                ))}
              </select>

              {/* Name */}
              <input
                type="text"
                value={p.name}
                onChange={(e) => onUpdateParticipant(p.id, 'name', e.target.value)}
                className="w-full px-2 py-1 bg-[#0a0a0c] border border-white/10 rounded text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Имя"
              />

              {/* Note */}
              <input
                type="text"
                value={p.note}
                onChange={(e) => onUpdateParticipant(p.id, 'note', e.target.value)}
                className="w-full px-2 py-1 bg-[#0a0a0c] border border-white/10 rounded text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
                placeholder="Заметка"
              />

              {/* Current Score */}
              <input
                type="number"
                min={0}
                value={p.score}
                onChange={(e) =>
                  onUpdateParticipant(
                    p.id,
                    'score',
                    Math.max(0, parseInt(e.target.value) || 0)
                  )
                }
                className="w-full px-1.5 py-1 bg-[#0a0a0c] border border-white/10 rounded text-xs font-bold text-indigo-300 text-center focus:border-indigo-500 focus:outline-none"
              />

              {/* Add Score (+ Добавить) */}
              <input
                type="number"
                min={0}
                value={p.addScore}
                onChange={(e) =>
                  onUpdateParticipant(
                    p.id,
                    'addScore',
                    Math.max(0, parseInt(e.target.value) || 0)
                  )
                }
                className="w-full px-1 py-1 bg-emerald-950/40 border border-emerald-500/40 rounded text-xs font-black text-emerald-400 text-center focus:border-emerald-400 focus:outline-none"
              />

              {/* Remove button */}
              <button
                onClick={() => onRemoveParticipant(p.id)}
                className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-all"
                title="Удалить"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onAddParticipant}
          className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/10 font-bold text-xs flex items-center justify-center space-x-1 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ ДОБАВИТЬ УЧАСТНИКА</span>
        </button>
      </div>
    </div>
  );
};
