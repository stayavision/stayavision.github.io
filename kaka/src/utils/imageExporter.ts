import { ScoreboardState } from '../types';
import { hexToRgba } from './color';

export async function exportScoreboardPNG(state: ScoreboardState): Promise<string> {
  // 1. Resolution calculation
  let w = 1920;
  let h = 1080;

  if (state.aspectRatio === 'custom') {
    w = (Number(state.customW) || 1280) * 1.5;
    h = (Number(state.customH) || 720) * 1.5;
  } else if (state.aspectRatio === '9/16') {
    w = 1080;
    h = 1920;
  } else if (state.aspectRatio === '1/1') {
    w = 1440;
    h = 1440;
  } else if (state.aspectRatio === '21/9') {
    w = 2560;
    h = 1080;
  } else if (state.aspectRatio === '4/3') {
    w = 1600;
    h = 1200;
  }

  w = Math.round(w);
  h = Math.round(h);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось получить 2D контекст canvas');

  // Fill dark background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, w, h);

  // Load background image
  let bgImg: HTMLImageElement | null = null;
  const bgUrl =
    state.bgType === 'custom' && !state.bgIsVideo
      ? state.bgCustomData
      : state.bgType !== 'none' && state.bgType !== 'custom'
      ? state.bgType
      : '';

  if (bgUrl) {
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

  if (bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.drawImage(bgImg, 0, 0, w, h);
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, w, h);

  // Preload avatars
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

  // Scale factor relative to 1280x720 base canvas
  const scaleRatio = w / 1280;

  // Header Title & Subtitle
  const padY = (state.padY || 40) * scaleRatio;
  const padX = (state.padX || 40) * scaleRatio;

  ctx.save();
  ctx.textAlign = 'center';

  let titleText = state.title;
  let subtitleText = state.subtitle;
  if (state.textUppercase) {
    titleText = titleText.toUpperCase();
    subtitleText = subtitleText.toUpperCase();
  }

  ctx.font = `900 ${Math.round(34 * state.textScale * scaleRatio)}px "${state.fontTitle}", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(titleText, w / 2, padY + 38 * scaleRatio);

  if (subtitleText) {
    ctx.font = `700 ${Math.round(16 * state.textScale * scaleRatio)}px "${state.fontTitle}", sans-serif`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(subtitleText, w / 2, padY + 68 * scaleRatio);
  }
  ctx.restore();

  // Layout calculation
  const cols = state.columns || 1;
  const gap = 12 * state.barScale * scaleRatio;
  const cardYShift = (state.cardYOffset || 0) * scaleRatio;

  const contentW = w - padX * 2;
  const colWidth = (contentW - (cols - 1) * gap) / cols;

  const isSplitStyle = state.style === 'splitscreen';
  const isEuroStyle = state.style === 'eurovision';
  const baseRowH = isSplitStyle ? 180 : isEuroStyle ? 52 : 68;
  const rowHeight = baseRowH * state.barScale * state.barHeightMultiplier * scaleRatio;

  let effectiveColWidth = colWidth;
  let startXOffset = padX;

  if (cols === 1 && contentW > 820 * scaleRatio) {
    effectiveColWidth = (isEuroStyle ? 820 : 920) * scaleRatio;
    startXOffset = padX + (contentW - effectiveColWidth) / 2;
  }

  const headerHeight = (state.subtitle ? 90 : 60) * scaleRatio;
  const gridTop = padY + headerHeight + cardYShift;

  // Sort participants
  const participants = [...state.participants];
  if (state.viewMode === 'results') {
    participants.sort((a, b) => b.score - a.score);
  }

  const maxScore = Math.max(...participants.map((p) => p.score), 1);

  participants.forEach((p, index) => {
    const rank = index + 1;

    let col = 0;
    let row = 0;
    if (cols === 2) {
      const rowsCount = Math.ceil(participants.length / 2);
      col = Math.floor(index / rowsCount);
      row = index % rowsCount;
    } else {
      col = index % cols;
      row = Math.floor(index / cols);
    }

    const cardX = startXOffset + col * (colWidth + gap);
    const cardY = gridTop + row * (rowHeight + gap);
    const cardW = effectiveColWidth;
    const cardH = rowHeight;
    const r = Math.round(12 * state.barScale * scaleRatio);

    ctx.save();
    ctx.translate(cardX, cardY);

    // Card Background
    const grad = ctx.createLinearGradient(0, 0, cardW, 0);
    if (state.highlightTop3 && state.viewMode === 'results') {
      if (rank === 1) {
        grad.addColorStop(0, hexToRgba(state.c1, 0.85));
        grad.addColorStop(1, hexToRgba(state.barColor2, state.barAlpha));
      } else if (rank === 2) {
        grad.addColorStop(0, hexToRgba(state.c2, 0.8));
        grad.addColorStop(1, hexToRgba(state.barColor2, state.barAlpha));
      } else if (rank === 3) {
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

    ctx.strokeStyle = state.highlightTop3 && rank === 1 ? state.c1 : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Leader Crown Badge #1
    if (state.showLeaderCrown !== false && rank === 1 && state.viewMode === 'results') {
      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(16 * scaleRatio, -12 * scaleRatio, 90 * scaleRatio, 20 * scaleRatio, 10 * scaleRatio);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = `900 ${Math.round(10 * scaleRatio)}px "${state.fontBoard}", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑 ЛИДЕР #1', 61 * scaleRatio, -2 * scaleRatio);
      ctx.restore();
    }

    let xOffset = 15 * scaleRatio;

    // Rank Position Number
    if (state.showPositions) {
      const posX = xOffset + state.posX * scaleRatio;
      const posY = cardH / 2 + state.posY * scaleRatio;

      ctx.fillStyle = rank === 1 && state.highlightTop3 ? state.c1 : '#FFFFFF';
      ctx.font = `900 ${Math.round(20 * state.textScale * scaleRatio)}px "${state.fontBoard}", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(rank), posX + 10 * scaleRatio, posY);
      xOffset += 35 * scaleRatio;
    }

    // Avatar
    if (state.showAvatars) {
      const avaSize = Math.round(40 * state.barScale * state.avatarSize * scaleRatio);
      const avaX = xOffset + state.avaX * scaleRatio;
      const avaY = (cardH - avaSize) / 2 + state.avaY * scaleRatio;

      const img = avatarImgs[p.id];
      if (img) {
        ctx.save();
        ctx.beginPath();
        if (state.avatarShape === '50%') {
          ctx.arc(avaX + avaSize / 2, avaY + avaSize / 2, avaSize / 2, 0, Math.PI * 2);
        } else if (state.avatarShape === '8px') {
          ctx.roundRect(avaX, avaY, avaSize, avaSize, 8 * scaleRatio);
        } else {
          ctx.rect(avaX, avaY, avaSize, avaSize);
        }
        ctx.clip();
        ctx.drawImage(img, avaX, avaY, avaSize, avaSize);
        ctx.restore();
      }
      xOffset += avaSize + 15 * scaleRatio;
    }

    // Name and Note
    const nameX = xOffset + state.nameX * scaleRatio;
    const nameY = cardH / 2 + state.nameY * scaleRatio;

    ctx.textAlign = state.align;
    ctx.textBaseline = p.note && state.showNotes ? 'bottom' : 'middle';

    let displayName = p.name;
    if (state.textUppercase) displayName = displayName.toUpperCase();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${Math.round(18 * state.textScale * scaleRatio)}px "${state.fontBoard}", sans-serif`;
    ctx.fillText(displayName, nameX, nameY - (p.note && state.showNotes ? 2 * scaleRatio : 0));

    if (p.note && state.showNotes) {
      let displayNote = p.note;
      if (state.textUppercase) displayNote = displayNote.toUpperCase();
      ctx.font = `400 ${Math.round(12 * state.textScale * scaleRatio)}px "${state.fontBoard}", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textBaseline = 'top';
      ctx.fillText(displayNote, nameX, nameY + 2 * scaleRatio);
    }

    // Score Number
    if (state.viewMode === 'results' && state.showScores) {
      const scoreX = cardW - 20 * scaleRatio + state.scoreX * scaleRatio;
      const scoreY = cardH / 2 + state.scoreY * scaleRatio;

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#00D4FF';
      ctx.font = `900 ${Math.round(24 * state.textScale * scaleRatio)}px "${state.fontBoard}", sans-serif`;
      ctx.fillText(String(p.score), scoreX, scoreY);

      // Score bar fill line
      if (state.showScoreBars) {
        const barW = Math.round(80 * state.barScale * scaleRatio);
        const barH = 4 * scaleRatio;
        const barX = scoreX - barW;
        const barY = scoreY + 14 * scaleRatio;

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(barX, barY, barW, barH);

        const fillW = Math.max((p.score / maxScore) * barW, 2);
        ctx.fillStyle = '#00D4FF';
        ctx.fillRect(barX, barY, fillW, barH);
      }
    }

    ctx.restore();
  });

  // Jury Voter Lower-Third Banner
  const juryVoter = state.participants.find((p) => p.id === state.juryVoterId);
  if (juryVoter) {
    const bannerW = Math.min(w * 0.45, 520 * scaleRatio);
    const bannerH = 64 * scaleRatio;
    const bannerX = (w - bannerW) / 2;
    const bannerY = h - bannerH - 24 * scaleRatio;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 20 * scaleRatio);
    ctx.fillStyle = 'rgba(8, 8, 12, 0.92)';
    ctx.fill();
    ctx.lineWidth = 2 * scaleRatio;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    const juryImg = avatarImgs[juryVoter.id];
    if (juryImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(bannerX + 36 * scaleRatio, bannerY + 32 * scaleRatio, 22 * scaleRatio, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(juryImg, bannerX + 14 * scaleRatio, bannerY + 10 * scaleRatio, 44 * scaleRatio, 44 * scaleRatio);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(bannerX + 36 * scaleRatio, bannerY + 32 * scaleRatio, 22 * scaleRatio, 0, Math.PI * 2);
      ctx.lineWidth = 2 * scaleRatio;
      ctx.strokeStyle = '#F59E0B';
      ctx.stroke();
    }

    const textX = juryImg ? bannerX + 70 * scaleRatio : bannerX + 24 * scaleRatio;
    ctx.fillStyle = '#F59E0B';
    ctx.font = `900 ${Math.round(11 * scaleRatio)}px "${state.fontBoard}", sans-serif`;
    ctx.fillText('ГОЛОСУЕТ ЖЮРИ', textX, bannerY + 24 * scaleRatio);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${Math.round(18 * scaleRatio)}px "${state.fontBoard}", sans-serif`;
    ctx.fillText(juryVoter.name, textX, bannerY + 48 * scaleRatio);

    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}
