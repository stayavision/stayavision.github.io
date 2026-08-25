import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, Zap } from 'lucide-react';
import { ScoreboardState, Participant } from '../types';
import { hexToRgba } from '../utils/color';

interface ScoreboardPreviewProps {
  state: ScoreboardState;
  captureRef: React.RefObject<HTMLDivElement | null>;
  animatingParticipantIds: number[];
  animatedScores: Record<number, number>;
  isAnimActive: boolean;
}

export const ScoreboardPreview: React.FC<ScoreboardPreviewProps> = ({
  state,
  captureRef,
  animatingParticipantIds,
  animatedScores,
  isAnimActive,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolution dimensions
  let w = 1280;
  let h = 720;
  if (state.aspectRatio === 'custom') {
    w = Number(state.customW) || 1280;
    h = Number(state.customH) || 720;
  } else if (state.aspectRatio === '9/16') {
    w = 720;
    h = 1280;
  } else if (state.aspectRatio === '1/1') {
    w = 1080;
    h = 1080;
  } else if (state.aspectRatio === '21/9') {
    w = 1680;
    h = 720;
  } else if (state.aspectRatio === '4/3') {
    w = 1024;
    h = 768;
  }

  // Sorted list for Results view or fixed list for Running Order
  const sortedParticipants = [...state.participants];
  if (state.viewMode === 'results') {
    sortedParticipants.sort((a, b) => {
      const scoreA = animatedScores[a.id] !== undefined ? animatedScores[a.id] : a.score;
      const scoreB = animatedScores[b.id] !== undefined ? animatedScores[b.id] : b.score;
      return scoreB - scoreA;
    });
  }

  const maxScore = Math.max(
    ...state.participants.map((p) => (animatedScores[p.id] !== undefined ? animatedScores[p.id] : p.score) + (p.addScore || 0)),
    1
  );

  const cols = state.columns || 1;
  const gap = 12 * state.barScale;
  const padX = state.padX || 40;
  const padY = state.padY || 40;

  const bgUrl =
    state.bgType === 'custom' && !state.bgIsVideo
      ? state.bgCustomData
      : state.bgType !== 'none' && state.bgType !== 'custom'
      ? state.bgType
      : '';

  // Fit capture inside parent wrapper
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !captureRef.current) return;
      const parentW = containerRef.current.clientWidth - 20;
      const scaleFit = Math.min(parentW / w, 1);
      captureRef.current.style.transform = `scale(${scaleFit * state.scale})`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [w, h, state.scale, captureRef]);

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center justify-center p-2 min-h-[450px] overflow-x-auto relative"
    >
      <div
        className="relative flex justify-center items-center rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.8)] border border-white/10 bg-[#0a0a0c] p-2"
        style={{ width: '100%', maxWidth: `${w}px` }}
      >
        <div
          ref={captureRef}
          id="scoreboard-capture"
          className="relative overflow-hidden flex flex-col shadow-2xl transition-all duration-300 origin-top"
          style={{
            width: `${w}px`,
            height: `${h}px`,
            fontFamily: `"${state.fontBoard}", sans-serif`,
            textTransform: state.textUppercase ? 'uppercase' : 'none',
            backgroundColor: '#050506',
          }}
        >
          {/* Background image & blur layers */}
          {bgUrl && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-60 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${bgUrl})` }}
              />
              <div
                className="absolute inset-0 bg-cover bg-center opacity-90 pointer-events-none"
                style={{ backgroundImage: `url(${bgUrl})` }}
              />
            </>
          )}

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/35 pointer-events-none z-0" />

          {/* Jury Voter Lower-Third Overlay Banner */}
          {(() => {
            const juryVoter = state.participants.find((p) => p.id === state.juryVoterId);
            if (!juryVoter) return null;
            return (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2 rounded-2xl bg-black/85 border border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.5)] backdrop-blur-md animate-fadeIn">
                {juryVoter.avatar && (
                  <img
                    src={juryVoter.avatar}
                    alt={juryVoter.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md shrink-0"
                  />
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none mb-0.5">
                    ГОЛОСУЕТ ЖЮРИ
                  </span>
                  <span className="text-sm font-black text-white tracking-wide leading-tight">
                    {juryVoter.name}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Main Board Inner */}
          <div
            className="relative z-10 w-full h-full flex flex-col"
            style={{
              padding: `${padY}px ${padX}px`,
            }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2
                className="font-black text-white leading-tight tracking-wide drop-shadow-md"
                style={{
                  fontFamily: `"${state.fontTitle}", serif`,
                  fontSize: `${32 * state.textScale}px`,
                }}
              >
                {state.title}
              </h2>
              {state.subtitle && (
                <p
                  className="font-bold text-amber-300 tracking-widest mt-1 drop-shadow-sm"
                  style={{
                    fontFamily: `"${state.fontTitle}", serif`,
                    fontSize: `${16 * state.textScale}px`,
                  }}
                >
                  {state.subtitle}
                </p>
              )}
            </div>

            {/* Results Grid */}
            <div className="w-full flex-1 flex flex-col justify-center">
              <div
                className={`grid gap-3 w-full relative transition-all duration-500 ${
                  state.style === 'splitscreen'
                    ? 'h-full items-stretch'
                    : 'max-w-full mx-auto'
                }`}
                style={{
                  transform: `translateY(${state.cardYOffset || 0}px)`,
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: cols === 2 ? `repeat(${Math.ceil(sortedParticipants.length / 2)}, minmax(0, auto))` : undefined,
                  gridAutoFlow: cols === 2 ? 'column' : undefined,
                  gap: `${gap}px`,
                  maxWidth:
                    state.style === 'splitscreen'
                      ? '100%'
                      : cols === 1
                      ? state.style === 'eurovision'
                        ? '820px'
                        : '920px'
                      : '100%',
                  margin: '0 auto',
                }}
              >
                {sortedParticipants.map((p, idx) => {
                  const rank = idx + 1;
                  const displayScore =
                    animatedScores[p.id] !== undefined ? animatedScores[p.id] : p.score;
                  const isAnimatingThis = isAnimActive && animatingParticipantIds.includes(p.id) && p.addScore > 0;
                  const isGold = isAnimActive && p.addScore >= 7 && isAnimatingThis;

                  // Card background calculation
                  let bgGradient = `linear-gradient(90deg, ${hexToRgba(
                    state.barColor1,
                    state.barAlpha
                  )}, ${hexToRgba(state.barColor2, state.barAlpha * 0.7)})`;

                  if (isGold) {
                    bgGradient = 'linear-gradient(90deg, #FFD700, #FFA500)';
                  } else if (isAnimatingThis) {
                    bgGradient = 'linear-gradient(90deg, #059669, #10b981)';
                  } else if (state.highlightTop3 && state.viewMode === 'results') {
                    if (rank === 1) {
                      bgGradient = `linear-gradient(90deg, ${hexToRgba(
                        state.c1,
                        0.8
                      )}, ${hexToRgba(state.barColor2, state.barAlpha)})`;
                    } else if (rank === 2) {
                      bgGradient = `linear-gradient(90deg, ${hexToRgba(
                        state.c2,
                        0.8
                      )}, ${hexToRgba(state.barColor2, state.barAlpha)})`;
                    } else if (rank === 3) {
                      bgGradient = `linear-gradient(90deg, ${hexToRgba(
                        state.c3,
                        0.8
                      )}, ${hexToRgba(state.barColor2, state.barAlpha)})`;
                    }
                  }

                  const cardBorder = isGold
                    ? '2px solid #FFFFFF'
                    : isAnimatingThis
                    ? '2px solid #34D399'
                    : state.highlightTop3 && rank === 1
                    ? `2px solid ${state.c1}`
                    : '1px solid rgba(255,255,255,0.12)';

                  const isSplitStyle = state.style === 'splitscreen';
                  const isEuroStyle = state.style === 'eurovision';

                  const verticalPad = isSplitStyle
                    ? 24
                    : isEuroStyle
                    ? 8
                    : 12;

                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: isAnimatingThis ? 1.04 : 1,
                      }}
                      transition={{
                        type: state.animStyle === 'bounce' ? 'spring' : 'tween',
                        stiffness: state.animStyle === 'bounce' ? 380 : undefined,
                        damping: state.animStyle === 'bounce' ? 22 : undefined,
                        duration: state.animStyle === 'eurovision' ? 0.7 : 0.45,
                        ease: 'easeOut',
                      }}
                      className={`relative flex items-center rounded-xl shadow-lg ${
                        isSplitStyle ? 'flex-col justify-center text-center p-6' : 'px-4 py-2.5'
                      } ${isAnimatingThis ? 'shadow-[0_0_30px_rgba(16,185,129,0.9)] z-20' : ''}`}
                      style={{
                        background: bgGradient,
                        border: cardBorder,
                        borderLeft: isEuroStyle
                          ? `6px solid ${
                              rank === 1
                                ? state.c1
                                : rank === 2
                                ? state.c2
                                : rank === 3
                                ? state.c3
                                : '#00D4FF'
                            }`
                          : cardBorder,
                        paddingTop: `${verticalPad * state.barHeightMultiplier * state.barScale}px`,
                        paddingBottom: `${verticalPad * state.barHeightMultiplier * state.barScale}px`,
                      }}
                    >
                      {/* Leader Crown #1 */}
                      {state.showLeaderCrown !== false && rank === 1 && state.viewMode === 'results' && (
                        <div className="absolute -top-3.5 left-4 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] uppercase shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-bounce">
                          <Crown className="w-3.5 h-3.5 fill-current" />
                          <span>ЛИДЕР #1</span>
                        </div>
                      )}

                      {/* Particles / Sparkles on Adding Points */}
                      {state.particleEffects !== false && isAnimatingThis && (
                        <div className="absolute -top-2 -right-2 z-30 text-amber-300 animate-spin">
                          <Sparkles className="w-6 h-6 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                        </div>
                      )}

                      {/* Rank Position */}
                      {state.showPositions && (
                        <div
                          className="font-black flex items-center justify-center shrink-0 mr-3 text-white"
                          style={{
                            transform: `translate(${state.posX}px, ${state.posY}px)`,
                            fontSize: `${20 * state.textScale}px`,
                            color: isGold
                              ? '#000'
                              : rank === 1 && state.highlightTop3
                              ? state.c1
                              : '#FFF',
                          }}
                        >
                          {rank}
                        </div>
                      )}

                      {/* Avatar */}
                      {state.showAvatars && p.avatar && (
                        <img
                          src={p.avatar}
                          alt={p.name}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (p.avatar && p.avatar.startsWith('/avatars/')) {
                              const fileName = p.avatar.replace('/avatars/', '');
                              target.src = `https://raw.githubusercontent.com/stayavision/stayavision.github.io/main/${fileName}`;
                            }
                          }}
                          className="object-cover shrink-0 border-2 border-white/20 mr-3 shadow-md"
                          style={{
                            width: `${(isSplitStyle ? 90 : isEuroStyle ? 36 : 44) * state.avatarSize * state.barScale}px`,
                            height: `${(isSplitStyle ? 90 : isEuroStyle ? 36 : 44) * state.avatarSize * state.barScale}px`,
                            borderRadius: state.avatarShape,
                            transform: `translate(${state.avaX}px, ${state.avaY}px)`,
                          }}
                        />
                      )}

                      {/* Info */}
                      <div
                        className={`flex-1 flex flex-col min-w-0 mr-3 ${
                          state.align === 'center'
                            ? 'items-center text-center'
                            : state.align === 'right'
                            ? 'items-end text-right'
                            : 'items-start text-left'
                        }`}
                        style={{
                          transform: `translate(${state.nameX}px, ${state.nameY}px)`,
                        }}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span
                            className="font-extrabold truncate text-white"
                            style={{
                              fontSize: `${(isEuroStyle ? 16 : 18) * state.textScale}px`,
                              color: isGold ? '#000' : '#FFF',
                            }}
                          >
                            {p.name}
                          </span>
                          {isAnimatingThis && (
                            <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-300 text-black font-black text-xs animate-pulse shadow-md">
                              +{p.addScore}
                            </span>
                          )}
                        </div>
                        {state.showNotes && p.note && (
                          <span
                            className="font-semibold text-xs text-slate-300 truncate opacity-80"
                            style={{
                              fontSize: `${12 * state.textScale}px`,
                              color: isGold ? '#333' : 'rgba(255,255,255,0.7)',
                            }}
                          >
                            {p.note}
                          </span>
                        )}
                      </div>

                      {/* Score */}
                      {state.viewMode === 'results' && state.showScores && (
                        <div
                          className="relative flex flex-col items-end shrink-0"
                          style={{
                            transform: `translate(${state.scoreX}px, ${state.scoreY}px)`,
                          }}
                        >
                          {/* Add Score Floating Text */}
                          {isAnimatingThis && (
                            <div className="absolute -top-7 right-0 font-black text-emerald-300 text-xl animate-bounce drop-shadow-[0_0_12px_rgba(0,255,136,0.9)]">
                              +{p.addScore} БАЛЛОВ
                            </div>
                          )}

                          <span
                            className="font-black text-cyan-300 leading-none"
                            style={{
                              fontSize: `${(isEuroStyle ? 22 : 24) * state.textScale}px`,
                              color: isGold ? '#000' : isAnimatingThis ? '#FFFFFF' : '#00D4FF',
                            }}
                          >
                            {displayScore}
                          </span>

                          {/* Progress Bar */}
                          {state.showScoreBars && (
                            <div
                              className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden"
                              style={{ width: `${80 * state.barScale}px` }}
                            >
                              <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                                style={{
                                  width: `${Math.max((displayScore / maxScore) * 100, 2)}%`,
                                  backgroundColor: isGold ? '#000' : isAnimatingThis ? '#FFF' : undefined,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
