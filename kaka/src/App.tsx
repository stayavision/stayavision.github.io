import React, { useState, useEffect, useRef } from 'react';
import { ScoreboardState, Participant, Preset } from './types';
import { DEFAULT_STATE, DEFAULT_PRESETS, DEFAULT_AVATARS, AVATAR_MAP } from './data/presets';
import { extractColorFromImageUrl } from './utils/color';
import { exportScoreboardVideo } from './utils/videoExporter';
import { exportScoreboardPNG } from './utils/imageExporter';
import { playChimeSound } from './utils/audio';
import { Header } from './components/Header';
import { ScoreboardPreview } from './components/ScoreboardPreview';
import { ControlsPanel } from './components/ControlsPanel';
import { RenderModal } from './components/RenderModal';
import { AdminModal } from './components/AdminModal';
import { JuryModal } from './components/JuryModal';
import { ChangelogModal } from './components/ChangelogModal';

const STORAGE_KEY = 'stayavision_scoreboard_state';

export default function App() {
  const [state, setState] = useState<ScoreboardState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
    return DEFAULT_STATE;
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isJuryModalOpen, setIsJuryModalOpen] = useState(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'preview'>('editor');

  // Animation preview states
  const [animatingParticipantIds, setAnimatingParticipantIds] = useState<number[]>([]);
  const [animatedScores, setAnimatedScores] = useState<Record<number, number>>({});
  const [isAnimActive, setIsAnimActive] = useState(false);

  // Video Render Modal states
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
  const [renderProgressFrame, setRenderProgressFrame] = useState(0);
  const [renderTotalFrames, setRenderTotalFrames] = useState(0);
  const [renderStatusMessage, setRenderStatusMessage] = useState('');
  const [renderLogs, setRenderLogs] = useState<string[]>([]);

  const captureRef = useRef<HTMLDivElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderAbortController = useRef<AbortController | null>(null);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [state]);

  const handleChangeState = <K extends keyof ScoreboardState>(key: K, value: ScoreboardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetState = () => {
    if (window.confirm('Сбросить все настройки на по умолчанию?')) {
      const customPresets = state.customPresets;
      setState({ ...DEFAULT_STATE, customPresets });
    }
  };

  const handleResetOffsets = () => {
    setState((prev) => ({
      ...prev,
      nameX: 0,
      nameY: 0,
      scoreX: 0,
      scoreY: 0,
      posX: 0,
      posY: 0,
      avaX: 0,
      avaY: 0,
      align: 'left',
    }));
  };

  const handleLoadPreset = (presetId: string) => {
    if (!presetId) return;
    const allPresets: Preset[] = [...DEFAULT_PRESETS, ...(state.customPresets || [])];
    const found = allPresets.find((p) => p.id === presetId);
    if (!found) return;

    setState((prev) => ({
      ...prev,
      title: found.title,
      subtitle: found.subtitle,
      bgType: found.bgType,
      viewMode: found.viewMode,
      participants: JSON.parse(JSON.stringify(found.participants)),
    }));
  };

  const handleUpdateParticipant = (
    id: number,
    field: keyof Participant,
    value: string | number
  ) => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) => {
        if (p.id !== id) return p;
        let newValue = value;
        if (field === 'score' || field === 'addScore') {
          newValue = Math.max(0, Number(value) || 0);
        }
        if (field === 'avatar' && typeof value === 'string' && AVATAR_MAP[value]) {
          return { ...p, avatar: AVATAR_MAP[value] };
        }
        return { ...p, [field]: newValue };
      }),
    }));
  };

  const handleMoveParticipant = (id: number, direction: number) => {
    setState((prev) => {
      const idx = prev.participants.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= prev.participants.length) return prev;

      const updated = [...prev.participants];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;

      return { ...prev, participants: updated };
    });
  };

  const handleAddParticipant = () => {
    setState((prev) => {
      const newId =
        prev.participants.length > 0
          ? Math.max(...prev.participants.map((p) => p.id)) + 1
          : 1;
      const defaultAvatar = DEFAULT_AVATARS[0].file;
      return {
        ...prev,
        participants: [
          ...prev.participants,
          {
            id: newId,
            name: 'Новый',
            score: 0,
            addScore: 0,
            note: '',
            avatar: AVATAR_MAP[defaultAvatar] || defaultAvatar,
          },
        ],
      };
    });
  };

  const handleRemoveParticipant = (id: number) => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== id),
    }));
  };

  const handleRandomizeParticipants = () => {
    setState((prev) => {
      const shuffled = [...prev.participants];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
      return { ...prev, participants: shuffled };
    });
  };

  const handleAutoColor = async () => {
    const bgUrl =
      state.bgType === 'custom' && !state.bgIsVideo
        ? state.bgCustomData
        : state.bgType !== 'none' && state.bgType !== 'custom'
        ? state.bgType
        : '';

    if (!bgUrl) {
      alert('Сначала выберите фоновое изображение!');
      return;
    }

    try {
      const colors = await extractColorFromImageUrl(bgUrl);
      setState((prev) => ({
        ...prev,
        barColor1: colors.color1,
        barColor2: colors.color2,
      }));
    } catch (err) {
      alert('Не удалось автоматически определить гармоничные цвета фонового изображения.');
    }
  };

  // Live Animation Preview
  const handlePlayAnimation = async () => {
    const targets = state.participants.filter((p) => p.addScore > 0);
    if (targets.length === 0) {
      alert('Укажите значения в поле "+ Добавить" (зеленые поля) для анимации!');
      return;
    }

    // Switch to preview view on mobile
    setActiveMobileTab('preview');
    setIsAnimActive(true);

    const maxAdd = Math.max(...targets.map((p) => p.addScore));
    const nonMaxTargets = targets.filter((p) => p.addScore < maxAdd);
    const maxTargets = targets.filter((p) => p.addScore === maxAdd);

    const startScores: Record<number, number> = {};
    state.participants.forEach((p) => {
      startScores[p.id] = p.score;
    });

    // Initial hold on Scoreboard BEFORE (1.0s)
    setAnimatingParticipantIds([]);
    await new Promise((r) => setTimeout(r, 800));

    // Phase 1: Animate regular points (without max score)
    if (nonMaxTargets.length > 0) {
      if (state.soundEnabled !== false) {
        playChimeSound();
      }
      setAnimatingParticipantIds(nonMaxTargets.map((p) => p.id));
      const duration1 = 2200;
      const startTime1 = performance.now();

      await new Promise<void>((resolve) => {
        const step1 = (now: number) => {
          const progress = Math.min((now - startTime1) / duration1, 1);
          const currentAnimated: Record<number, number> = {};

          state.participants.forEach((p) => {
            if (p.addScore > 0 && p.addScore < maxAdd) {
              currentAnimated[p.id] = Math.floor(startScores[p.id] + p.addScore * progress);
            } else {
              currentAnimated[p.id] = startScores[p.id];
            }
          });

          setAnimatedScores(currentAnimated);

          if (progress < 1) {
            requestAnimationFrame(step1);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(step1);
      });

      // Suspense pause before MAX point reveal
      await new Promise((r) => setTimeout(r, 600));
    }

    // Phase 2: Animate MAX point reveal (highest addScore)
    if (maxTargets.length > 0) {
      if (state.soundEnabled !== false) {
        playChimeSound();
      }
      setAnimatingParticipantIds(maxTargets.map((p) => p.id));
      const duration2 = 1800;
      const startTime2 = performance.now();

      await new Promise<void>((resolve) => {
        const step2 = (now: number) => {
          const progress = Math.min((now - startTime2) / duration2, 1);
          const currentAnimated: Record<number, number> = {};

          state.participants.forEach((p) => {
            if (p.addScore > 0 && p.addScore < maxAdd) {
              currentAnimated[p.id] = startScores[p.id] + p.addScore;
            } else if (p.addScore === maxAdd) {
              currentAnimated[p.id] = Math.floor(startScores[p.id] + p.addScore * progress);
            } else {
              currentAnimated[p.id] = startScores[p.id];
            }
          });

          setAnimatedScores(currentAnimated);

          if (progress < 1) {
            requestAnimationFrame(step2);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(step2);
      });
    }

    // Permanently commit added points
    setState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) => {
        if (p.addScore > 0) {
          return { ...p, score: p.score + p.addScore, addScore: 0 };
        }
        return p;
      }),
    }));

    setTimeout(() => {
      setAnimatingParticipantIds([]);
      setAnimatedScores({});
      setIsAnimActive(false);
    }, 1000);
  };

  // Import all participants from server assets / default presets
  const handleImportAllServer = () => {
    const validAvatars = DEFAULT_AVATARS.filter((av) => av.name && av.name !== 'Дефолт');
    const newParticipants: Participant[] = validAvatars.map((av, idx) => ({
      id: idx + 1,
      name: av.name,
      score: 0,
      addScore: 0,
      note: '',
      avatar: AVATAR_MAP[av.file] || av.file,
    }));

    setState((prev) => ({
      ...prev,
      participants: newParticipants,
    }));
    alert(`Импортировано ${newParticipants.length} участников с аватарами!`);
  };

  const handleResetAddScores = () => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) => ({ ...p, addScore: 0 })),
    }));
  };

  const handleResetAllScoresToZero = () => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) => ({ ...p, score: 0, addScore: 0 })),
    }));
  };

  // 1-Click PNG Image Export
  const handleDownloadImage = async () => {
    try {
      const dataUrl = await exportScoreboardPNG(state);
      const link = document.createElement('a');
      link.download = `${state.title}_Скорборд.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('Ошибка при экспорте изображения: ' + err);
    }
  };

  // Video Export Engine
  const handleRenderVideo = async () => {
    setIsRenderModalOpen(true);
    setRenderLogs([]);
    setRenderProgressFrame(0);

    renderAbortController.current = new AbortController();

    try {
      const blob = await exportScoreboardVideo(
        state,
        {
          onProgress: (frame, total, status) => {
            setRenderProgressFrame(frame);
            setRenderTotalFrames(total);
            setRenderStatusMessage(status);
          },
          onLog: (msg) => {
            const time = new Date().toISOString().substring(11, 19);
            setRenderLogs((prev) => [...prev, `[${time}] ${msg}`]);
          },
          onFrameCanvas: (canvas) => {
            if (liveCanvasRef.current) {
              const ctx = liveCanvasRef.current.getContext('2d');
              if (ctx) {
                liveCanvasRef.current.width = canvas.width;
                liveCanvasRef.current.height = canvas.height;
                ctx.drawImage(canvas, 0, 0);
              }
            }
          },
        },
        renderAbortController.current.signal
      );

      // Trigger automatic download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.title}_Anim.webm`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);

      // Commit scores permanently after render completes
      setState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) => {
          if (p.addScore > 0) {
            return { ...p, score: p.score + p.addScore, addScore: 0 };
          }
          return p;
        }),
      }));
    } catch (err: any) {
      if (err.message !== 'Рендеринг отменен пользователем') {
        alert('Ошибка рендеринга видео: ' + err.message);
      }
    } finally {
      setIsRenderModalOpen(false);
    }
  };

  const handleCancelRender = () => {
    if (renderAbortController.current) {
      renderAbortController.current.abort();
    }
    setIsRenderModalOpen(false);
  };

  // Admin Modal Handlers
  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setIsAdminModalOpen(true);
    } else {
      const u = prompt('Логин админа:');
      const p = prompt('Пароль админа:');
      if (u === 'admin' && p === 'admin') {
        setIsAdminLoggedIn(true);
        setIsAdminModalOpen(true);
      } else if (u || p) {
        alert('Неверный логин или пароль!');
      }
    }
  };

  const handleSaveCustomPreset = (presetName: string) => {
    const newPreset: Preset = {
      id: `custom_${Date.now()}`,
      name: presetName,
      title: state.title,
      subtitle: state.subtitle,
      bgType: state.bgType,
      viewMode: state.viewMode,
      participants: JSON.parse(JSON.stringify(state.participants)),
    };

    setState((prev) => ({
      ...prev,
      customPresets: [...(prev.customPresets || []), newPreset],
    }));
    alert('Пресет успешно сохранен!');
  };

  const handleDeleteCustomPreset = (presetId: string) => {
    setState((prev) => ({
      ...prev,
      customPresets: (prev.customPresets || []).filter((p) => p.id !== presetId),
    }));
    alert('Пресет удален!');
  };

  const handleAutoResults = () => {
    if (!window.confirm('Сгенерировать случайные баллы для всех участников?')) return;
    setState((prev) => ({
      ...prev,
      viewMode: 'results',
      participants: prev.participants
        .map((p) => ({
          ...p,
          score: Math.floor(Math.random() * 24) + 1,
          addScore: 0,
        }))
        .sort((a, b) => b.score - a.score),
    }));
    setIsAdminModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-zinc-300 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Header
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdmin={handleOpenAdmin}
        onOpenChangelog={() => setIsChangelogModalOpen(true)}
        activeMobileTab={activeMobileTab}
        onSelectMobileTab={setActiveMobileTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 md:p-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Controls Panel */}
        <div className={`w-full md:w-auto md:flex-1 ${activeMobileTab === 'editor' ? 'block' : 'hidden md:block'}`}>
          <ControlsPanel
            state={state}
            onChangeState={handleChangeState}
            onResetState={handleResetState}
            onResetOffsets={handleResetOffsets}
            onLoadPreset={handleLoadPreset}
            onUpdateParticipant={handleUpdateParticipant}
            onMoveParticipant={handleMoveParticipant}
            onAddParticipant={handleAddParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onRandomizeParticipants={handleRandomizeParticipants}
            onAutoColor={handleAutoColor}
            onPlayAnimation={handlePlayAnimation}
            onDownloadImage={handleDownloadImage}
            onRenderVideo={handleRenderVideo}
            onOpenJuryModal={() => setIsJuryModalOpen(true)}
            onImportAllServer={handleImportAllServer}
          />
        </div>

        {/* Live Scoreboard Preview */}
        <div className={`w-full md:flex-[2] sticky top-6 ${activeMobileTab === 'preview' ? 'block' : 'hidden md:block'}`}>
          <ScoreboardPreview
            state={state}
            captureRef={captureRef}
            animatingParticipantIds={animatingParticipantIds}
            animatedScores={animatedScores}
            isAnimActive={isAnimActive}
          />
        </div>
      </main>

      {/* Video Rendering Modal */}
      <RenderModal
        isOpen={isRenderModalOpen}
        progressFrame={renderProgressFrame}
        totalFrames={renderTotalFrames}
        statusMessage={renderStatusMessage}
        logs={renderLogs}
        liveCanvasRef={liveCanvasRef}
        fps={state.renderFps || 30}
        onCancel={handleCancelRender}
      />

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        state={state}
        onClose={() => setIsAdminModalOpen(false)}
        onSavePreset={handleSaveCustomPreset}
        onDeletePreset={handleDeleteCustomPreset}
        onAutoResults={handleAutoResults}
      />

      {/* Jury Voting Panel Modal */}
      <JuryModal
        isOpen={isJuryModalOpen}
        participants={state.participants}
        juryVoterId={state.juryVoterId || null}
        onSelectJuryVoter={(id) => setState((prev) => ({ ...prev, juryVoterId: id }))}
        onClose={() => setIsJuryModalOpen(false)}
        onUpdateParticipant={handleUpdateParticipant}
        onResetAddScores={handleResetAddScores}
        onResetAllScoresToZero={handleResetAllScoresToZero}
        onCommitScores={() => {
          setIsJuryModalOpen(false);
          handlePlayAnimation();
        }}
        onRenderVideo={() => {
          setIsJuryModalOpen(false);
          handleRenderVideo();
        }}
      />

      {/* Changelog Modal */}
      <ChangelogModal
        isOpen={isChangelogModalOpen}
        onClose={() => setIsChangelogModalOpen(false)}
      />
    </div>
  );
}
