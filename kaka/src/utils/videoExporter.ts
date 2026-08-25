import { ScoreboardState, Participant } from '../types';
import { hexToRgba } from './color';

export interface RenderCallbacks {
  onProgress: (frame: number, totalFrames: number, statusMessage: string) => void;
  onLog: (message: string) => void;
  onFrameCanvas: (canvas: HTMLCanvasElement) => void;
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3;
  return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function easeInOutQuad(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

export async function exportScoreboardVideo(
  state: ScoreboardState,
  callbacks: RenderCallbacks,
  signal?: AbortSignal
): Promise<Blob> {
  const { onProgress, onLog, onFrameCanvas } = callbacks;

  onLog('Инициализация холста Canvas для рендеринга видео...');

  // 1. Compute resolution
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

  // Ensure even dimensions
  if (w % 2 !== 0) w += 1;
  if (h % 2 !== 0) h += 1;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось получить 2D контекст canvas');

  // Preload background image if present
  let bgImg: HTMLImageElement | null = null;
  const bgUrl =
    state.bgType === 'custom' && !state.bgIsVideo
      ? state.bgCustomData
      : state.bgType !== 'none' && state.bgType !== 'custom'
      ? state.bgType
      : '';

  if (bgUrl) {
    onLog(`Загрузка фонового изображения (${bgUrl.substring(0, 30)}...)...`);
    bgImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (bgUrl.startsWith('/bgs/')) {
          const fileName = bgUrl.replace('/bgs/', '');
          const fallbackImg = new Image();
          fallbackImg.crossOrigin = 'Anonymous';
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => resolve(null);
          fallbackImg.src = `https://raw.githubusercontent.com/stayavision/stayavision.github.io/main/${fileName}`;
        } else {
          resolve(null);
        }
      };
      img.src = bgUrl;
    });
  }

  // Preload participant avatars
  onLog('Загрузка аватарок участников...');
  const avatarImgs: Record<number, HTMLImageElement> = {};
  await Promise.all(
    state.participants.map(async (p) => {
      if (!p.avatar) return;
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      await new Promise((resolve) => {
        img.onload = () => {
          avatarImgs[p.id] = img;
          resolve(null);
        };
        img.onerror = () => {
          if (p.avatar.startsWith('/avatars/')) {
            const fileName = p.avatar.replace('/avatars/', '');
            const fallbackImg = new Image();
            fallbackImg.crossOrigin = 'Anonymous';
            fallbackImg.onload = () => {
              avatarImgs[p.id] = fallbackImg;
              resolve(null);
            };
            fallbackImg.onerror = () => resolve(null);
            fallbackImg.src = `https://raw.githubusercontent.com/stayavision/stayavision.github.io/main/${fileName}`;
          } else {
            resolve(null);
          }
        };
        img.src = p.avatar;
      });
    })
  );

  // Animation timeline configuration (30 or 60 FPS)
  const fps = state.renderFps || 30;
  const targetDuration = state.videoDurationSec && state.videoDurationSec > 0 ? state.videoDurationSec : 10;
  
  // Find max addScore across participants
  const maxAddScore = Math.max(...state.participants.map((p) => p.addScore || 0));

  // Partition timeline proportionally into 5 clear Eurovision stages:
  // 1. Intro (12%): Scoreboard BEFORE (p.score)
  // 2. Regular Points (38%): Non-max addScores added (1..10 points)
  // 3. MAX Point Reveal (22%): Highest addScore added (12 points dramatic reveal)
  // 4. Re-sorting slide (18%): Position movement
  // 5. Final hold (10%): Leader celebration
  const fIntro = Math.round(targetDuration * 0.12 * fps);
  const fRegPoints = Math.round(targetDuration * 0.38 * fps);
  const fMaxPoint = Math.round(targetDuration * 0.22 * fps);
  const fMove = Math.round(targetDuration * 0.18 * fps);
  const fHold = Math.round(targetDuration * 0.10 * fps);

  const t1 = fIntro;
  const t2 = t1 + fRegPoints;
  const t3 = t2 + fMaxPoint;
  const t4 = t3 + fMove;
  const totalFrames = Math.max(fps * 3, t4 + fHold);

  onLog(`Параметры видео: ${w}x${h}px, ${fps} FPS, ${totalFrames} кадров (~${(totalFrames / fps).toFixed(1)}с)`);

  // Compute Layout positions accurately
  const cols = state.columns || 1;
  const padX = state.padX || 40;
  const padY = state.padY || 40;
  const cardYShift = state.cardYOffset || 0;
  const gap = 12 * state.barScale;

  const contentW = w - padX * 2;
  const colWidth = (contentW - (cols - 1) * gap) / cols;

  const isSplitStyle = state.style === 'splitscreen';
  const isEuroStyle = state.style === 'eurovision';
  const baseRowH = isSplitStyle ? 180 : isEuroStyle ? 52 : 68;
  const rowHeight = baseRowH * state.barScale * state.barHeightMultiplier;

  let effectiveColWidth = colWidth;
  let startXOffset = padX;

  if (cols === 1 && contentW > 820) {
    effectiveColWidth = isEuroStyle ? 820 : 920;
    startXOffset = padX + (contentW - effectiveColWidth) / 2;
  }

  const headerHeight = state.subtitle ? 90 : 60;
  const gridTop = padY + headerHeight + cardYShift;
  const totalCount = state.participants.length;

  function calculateCardPos(index: number, numCols: number, total: number) {
    let col = 0;
    let row = 0;
    if (numCols === 2) {
      const rowsCount = Math.ceil(total / 2);
      col = Math.floor(index / rowsCount);
      row = index % rowsCount;
    } else {
      col = index % numCols;
      row = Math.floor(index / numCols);
    }
    const x = startXOffset + col * (colWidth + gap);
    const y = gridTop + row * (rowHeight + gap);
    return { x, y };
  }

  // 1. Compute Initial Positions
  const initialList = [...state.participants];
  if (state.viewMode === 'results') {
    initialList.sort((a, b) => b.score - a.score);
  }

  const layoutMap = new Map<
    number,
    {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      participant: Participant;
      initialRank: number;
      finalRank: number;
    }
  >();

  initialList.forEach((p, index) => {
    const pos = calculateCardPos(index, cols, totalCount);
    layoutMap.set(p.id, {
      startX: pos.x,
      startY: pos.y,
      endX: pos.x,
      endY: pos.y,
      participant: p,
      initialRank: index + 1,
      finalRank: index + 1,
    });
  });

  // 2. Compute End Positions (Sorted by final scores)
  const finalList = [...state.participants].sort(
    (a, b) => b.score + b.addScore - (a.score + a.addScore)
  );

  finalList.forEach((p, index) => {
    const pos = calculateCardPos(index, cols, totalCount);
    const item = layoutMap.get(p.id);
    if (item) {
      item.endX = pos.x;
      item.endY = pos.y;
      item.finalRank = index + 1;
    }
  });

  const maxScore = Math.max(
    ...state.participants.map((p) => p.score + p.addScore),
    1
  );

  // Setup MediaRecorder
  const isFastGpu = state.renderEngine === 'fast_gpu';
  const stream = canvas.captureStream(fps);

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm')
    ? 'video/webm'
    : 'video/mp4';

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: fps === 60 ? 12000000 : 6000000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.start();
  onLog(`Запущена запись MediaRecorder (${mimeType}, FPS: ${fps})...`);

  // Render Loop Frame by Frame
  for (let frame = 0; frame < totalFrames; frame++) {
    if (signal && signal.aborted) {
      mediaRecorder.stop();
      throw new Error('Рендеринг отменен пользователем');
    }

    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Draw background image if available
    if (bgImg) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.drawImage(bgImg, 0, 0, w, h);
      ctx.restore();
    }

    // Background overlay darken
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, w, h);

    // Header Title & Subtitle
    ctx.save();
    ctx.textAlign = 'center';

    let titleText = state.title;
    let subtitleText = state.subtitle;
    if (state.textUppercase) {
      titleText = titleText.toUpperCase();
      subtitleText = subtitleText.toUpperCase();
    }

    ctx.font = `900 ${Math.round(34 * state.textScale)}px "${state.fontTitle}", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(titleText, w / 2, padY + 38);

    if (subtitleText) {
      ctx.font = `700 ${Math.round(16 * state.textScale)}px "${state.fontTitle}", sans-serif`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(subtitleText, w / 2, padY + 68);
    }
    ctx.restore();

    // Determine phase progress
    // Phase 0: Intro (0 -> t1) - Scoreboard BEFORE
    // Phase 1: Regular Points (t1 -> t2) - Non-max points added
    // Phase 2: MAX Point Reveal (t2 -> t3) - Highest addScore added
    // Phase 3: Re-sorting slide (t3 -> t4) - Position movement
    // Phase 4: Final hold (t4 -> end) - Final scoreboard
    let currentPhase = 0;
    let progReg = 0;
    let progMax = 0;
    let progMove = 0;

    if (frame < t1) {
      currentPhase = 0;
    } else if (frame < t2) {
      currentPhase = 1;
      progReg = (frame - t1) / fRegPoints;
    } else if (frame < t3) {
      currentPhase = 2;
      progReg = 1;
      progMax = (frame - t2) / fMaxPoint;
    } else if (frame < t4) {
      currentPhase = 3;
      progReg = 1;
      progMax = 1;
      progMove = (frame - t3) / fMove;
    } else {
      currentPhase = 4;
      progReg = 1;
      progMax = 1;
      progMove = 1;
    }

    // Eased movement calculation based on animStyle
    let easedMove = easeOutCubic(progMove);
    if (state.animStyle === 'bounce') {
      easedMove = easeOutElastic(progMove);
    } else if (state.animStyle === 'eurovision') {
      easedMove = easeInOutQuad(progMove);
    } else if (state.animStyle === 'glitch') {
      const jitter = Math.sin(frame * 0.7) * 0.04 * (1 - progMove);
      easedMove = Math.max(0, Math.min(1, easeOutCubic(progMove) + jitter));
    } else if (state.animStyle === 'zoom_slide') {
      easedMove = Math.pow(progMove, 1.8);
    }

    // Render each participant card
    state.participants.forEach((p) => {
      const item = layoutMap.get(p.id);
      if (!item) return;

      const currentX = item.startX + (item.endX - item.startX) * easedMove;
      const currentY = item.startY + (item.endY - item.startY) * easedMove;

      const isMaxAddRecipient = (p.addScore || 0) > 0 && p.addScore === maxAddScore;
      let currScore = p.score;
      let isAnimatingThis = false;
      let isGoldMaxReveal = false;
      let floatBadgeText = '';
      let floatAlpha = 0;
      let floatProg = 0;

      if (currentPhase === 0) {
        // Intro: Scoreboard BEFORE
        currScore = p.score;
      } else if (currentPhase === 1) {
        // Regular points addition (1..10 pts)
        if (p.addScore > 0 && !isMaxAddRecipient) {
          currScore = Math.floor(p.score + p.addScore * progReg);
          isAnimatingThis = true;
          floatBadgeText = `+${p.addScore}`;
          floatProg = progReg;
          floatAlpha = progReg < 0.2 ? progReg * 5 : (1 - progReg) * 1.2;
        } else {
          currScore = p.score; // Max recipient stays at initial score for suspense!
        }
      } else if (currentPhase === 2) {
        // MAX Point Reveal (12 pts)
        if (p.addScore > 0 && !isMaxAddRecipient) {
          currScore = p.score + p.addScore;
        } else if (isMaxAddRecipient) {
          currScore = Math.floor(p.score + p.addScore * progMax);
          isAnimatingThis = true;
          isGoldMaxReveal = true;
          floatBadgeText = `👑 +${p.addScore} MAX`;
          floatProg = progMax;
          floatAlpha = progMax < 0.2 ? progMax * 5 : (1 - progMax) * 1.2;
        } else {
          currScore = p.score;
        }
      } else {
        // Move & Final hold: All points added
        currScore = p.score + (p.addScore || 0);
      }

      const currentRank = progMove >= 0.5 ? item.finalRank : item.initialRank;

      ctx.save();
      ctx.translate(currentX, currentY);

      const cardW = effectiveColWidth;
      const cardH = rowHeight;
      const r = Math.round(12 * state.barScale);

      // Card background fill
      const grad = ctx.createLinearGradient(0, 0, cardW, 0);
      if (isGoldMaxReveal) {
        grad.addColorStop(0, '#FFD700');
        grad.addColorStop(1, '#B8860B');
      } else if (isAnimatingThis) {
        grad.addColorStop(0, '#059669');
        grad.addColorStop(1, '#10b981');
      } else if (state.highlightTop3 && state.viewMode === 'results') {
        if (currentRank === 1) {
          grad.addColorStop(0, hexToRgba(state.c1, 0.85));
          grad.addColorStop(1, hexToRgba(state.barColor2, state.barAlpha));
        } else if (currentRank === 2) {
          grad.addColorStop(0, hexToRgba(state.c2, 0.8));
          grad.addColorStop(1, hexToRgba(state.barColor2, state.barAlpha));
        } else if (currentRank === 3) {
          grad.addColorStop(0, hexToRgba(state.c3, 0.8));
          grad.addColorStop(1, hexToRgba(state.barColor2, state.barAlpha));
        } else {
          grad.addColorStop(0, hexToRgba(state.barColor1, state.barAlpha));
          grad.addColorStop(1, hexToRgba(state.barColor2, state.barAlpha));
        }
      } else {
        grad.addColorStop(0, hexToRgba(state.barColor1, state.barAlpha));
        grad.addColorStop(1, hexToRgba(state.barColor2, state.barAlpha));
      }

      ctx.beginPath();
      ctx.roundRect(0, 0, cardW, cardH, r);
      ctx.fillStyle = grad;
      ctx.fill();

      // Border stroke
      ctx.strokeStyle = isGoldMaxReveal
        ? '#FFFFFF'
        : isAnimatingThis
        ? '#34D399'
        : state.highlightTop3 && currentRank === 1
        ? state.c1
        : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = isGoldMaxReveal || isAnimatingThis ? 3 : 1;
      ctx.stroke();

      // Leader Crown Badge #1
      if (state.showLeaderCrown !== false && currentRank === 1 && state.viewMode === 'results') {
        ctx.save();
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.roundRect(16, -12, 90, 20, 10);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = `900 10px "${state.fontBoard}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👑 ЛИДЕР #1', 61, -2);
        ctx.restore();
      }

      // Particle sparks on score addition
      if (state.particleEffects !== false && isAnimatingThis) {
        ctx.save();
        for (let i = 0; i < (isGoldMaxReveal ? 10 : 5); i++) {
          const px = Math.random() * cardW;
          const py = Math.random() * cardH;
          const pr = Math.random() * 4 + 1;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fillStyle = isGoldMaxReveal ? 'rgba(255, 255, 255, 0.9)' : 'rgba(251, 191, 36, 0.8)';
          ctx.fill();
        }
        ctx.restore();
      }

      let xOffset = 15;

      // Rank Position Number
      if (state.showPositions) {
        const posX = xOffset + state.posX;
        const posY = cardH / 2 + state.posY;

        ctx.fillStyle = isGoldMaxReveal
          ? '#000000'
          : currentRank === 1 && state.highlightTop3
          ? state.c1
          : '#FFFFFF';
        ctx.font = `900 ${Math.round(20 * state.textScale)}px "${state.fontBoard}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(currentRank), posX + 10, posY);
        xOffset += 35;
      }

      // Avatar
      if (state.showAvatars) {
        const avaSize = Math.round(40 * state.barScale * state.avatarSize);
        const avaX = xOffset + state.avaX;
        const avaY = (cardH - avaSize) / 2 + state.avaY;

        const img = avatarImgs[p.id];
        if (img) {
          ctx.save();
          ctx.beginPath();
          if (state.avatarShape === '50%') {
            ctx.arc(avaX + avaSize / 2, avaY + avaSize / 2, avaSize / 2, 0, Math.PI * 2);
          } else if (state.avatarShape === '8px') {
            ctx.roundRect(avaX, avaY, avaSize, avaSize, 8);
          } else {
            ctx.rect(avaX, avaY, avaSize, avaSize);
          }
          ctx.clip();
          ctx.drawImage(img, avaX, avaY, avaSize, avaSize);
          ctx.restore();
        }
        xOffset += avaSize + 15;
      }

      // Name and Note
      const nameX = xOffset + state.nameX;
      const nameY = cardH / 2 + state.nameY;

      ctx.textAlign = state.align;
      ctx.textBaseline = p.note && state.showNotes ? 'bottom' : 'middle';

      let displayName = p.name;
      if (state.textUppercase) displayName = displayName.toUpperCase();

      ctx.fillStyle = isGoldMaxReveal ? '#000000' : '#FFFFFF';
      ctx.font = `700 ${Math.round(18 * state.textScale)}px "${state.fontBoard}", sans-serif`;
      ctx.fillText(displayName, nameX, nameY - (p.note && state.showNotes ? 2 : 0));

      if (p.note && state.showNotes) {
        let displayNote = p.note;
        if (state.textUppercase) displayNote = displayNote.toUpperCase();
        ctx.font = `400 ${Math.round(12 * state.textScale)}px "${state.fontBoard}", sans-serif`;
        ctx.fillStyle = isGoldMaxReveal ? '#222222' : 'rgba(255,255,255,0.7)';
        ctx.textBaseline = 'top';
        ctx.fillText(displayNote, nameX, nameY + 2);
      }

      // Score and AddScore float
      if (state.viewMode === 'results' && state.showScores) {
        const scoreX = cardW - 20 + state.scoreX;
        const scoreY = cardH / 2 + state.scoreY;

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isGoldMaxReveal ? '#000000' : isAnimatingThis ? '#FFFFFF' : '#00D4FF';
        ctx.font = `900 ${Math.round(24 * state.textScale)}px "${state.fontBoard}", sans-serif`;
        ctx.fillText(String(currScore), scoreX, scoreY);

        // Score bar fill line
        if (state.showScoreBars) {
          const barW = Math.round(80 * state.barScale);
          const barH = 4;
          const barX = scoreX - barW;
          const barY = scoreY + 14;

          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(barX, barY, barW, barH);

          const fillW = Math.max((currScore / maxScore) * barW, 2);
          ctx.fillStyle = isGoldMaxReveal ? '#000000' : isAnimatingThis ? '#34D399' : '#00D4FF';
          ctx.fillRect(barX, barY, fillW, barH);
        }

        // Floating +N Badge Animation
        if (floatBadgeText && floatAlpha > 0) {
          const floatY = scoreY - 16 - floatProg * 22;

          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, floatAlpha));
          ctx.font = `900 ${Math.round((isGoldMaxReveal ? 22 : 18) * state.textScale)}px "${state.fontBoard}", sans-serif`;
          ctx.fillStyle = isGoldMaxReveal ? '#FFD700' : '#00FF88';
          ctx.shadowColor = isGoldMaxReveal ? '#FFD700' : '#00FF88';
          ctx.shadowBlur = 14;
          ctx.fillText(floatBadgeText, scoreX, floatY);
          ctx.restore();
        }
      }

      ctx.restore();
    });

    // Jury Voter Lower-Third Banner Overlay
    const juryVoter = state.participants.find((p) => p.id === state.juryVoterId);
    if (juryVoter) {
      const bannerW = Math.min(w * 0.45, 520);
      const bannerH = 64;
      const bannerX = (w - bannerW) / 2;
      const bannerY = h - bannerH - 24;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 20);
      ctx.fillStyle = 'rgba(8, 8, 12, 0.92)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#F59E0B';
      ctx.stroke();

      const juryImg = avatarImgs[juryVoter.id];
      if (juryImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bannerX + 36, bannerY + 32, 22, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(juryImg, bannerX + 14, bannerY + 10, 44, 44);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(bannerX + 36, bannerY + 32, 22, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#F59E0B';
        ctx.stroke();
      }

      const textX = juryImg ? bannerX + 70 : bannerX + 24;
      ctx.fillStyle = '#F59E0B';
      ctx.font = `900 11px "${state.fontBoard}", sans-serif`;
      ctx.fillText('ГОЛОСУЕТ ЖЮРИ', textX, bannerY + 24);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 18px "${state.fontBoard}", sans-serif`;
      ctx.fillText(juryVoter.name, textX, bannerY + 48);

      ctx.restore();
    }

    onFrameCanvas(canvas);

    if (frame % 5 === 0 || frame === totalFrames - 1) {
      const pct = Math.round((frame / totalFrames) * 100);
      onProgress(frame + 1, totalFrames, `Отрисовка кадра ${frame + 1}/${totalFrames} (${pct}%)`);
      onLog(`Кадр ${frame + 1}/${totalFrames} сформирован.`);
    }

    if (isFastGpu) {
      await new Promise((r) => setTimeout(r, 6));
    } else {
      await new Promise((r) => setTimeout(r, Math.round(1000 / fps)));
    }
  }

  onLog('Завершение записи видео. Кодирование файла...');
  mediaRecorder.stop();

  const finalBlob = await new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
  });

  onLog(`Видеофайл готов! Размер: ${(finalBlob.size / (1024 * 1024)).toFixed(2)} MB`);
  return finalBlob;
}
