export type ViewMode = 'results' | 'running_order';
export type DesignStyle = 'stayavision' | 'eurovision' | 'splitscreen';
export type AnimStyle = 'smooth' | 'bounce' | 'eurovision' | 'glitch' | 'zoom_slide';
export type AspectRatio = '16/9' | '21/9' | '4/3' | '1/1' | '9/16' | 'custom';
export type AvatarShape = '50%' | '8px' | '0px';
export type TextAlign = 'left' | 'center' | 'right';

export interface Participant {
  id: number;
  name: string;
  score: number;
  addScore: number;
  note: string;
  avatar: string;
}

export interface Preset {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  bgType: string;
  viewMode: ViewMode;
  participants: Participant[];
}

export interface ScoreboardState {
  title: string;
  subtitle: string;
  style: DesignStyle;
  animStyle: AnimStyle;
  viewMode: ViewMode;
  aspectRatio: AspectRatio;
  customW: number;
  customH: number;
  columns: number;
  fontTitle: string;
  fontBoard: string;
  textUppercase: boolean;
  bgType: string;
  bgCustomData: string;
  bgIsVideo: boolean;
  padX: number;
  padY: number;
  scale: number;
  textScale: number;
  barScale: number;
  showNotes: boolean;
  showPositions: boolean;
  showAvatars: boolean;
  showScores: boolean;
  showScoreBars: boolean;
  showNames: boolean;
  avatarShape: AvatarShape;
  barColor1: string;
  barColor2: string;
  barAlpha: number;
  highlightTop3: boolean;
  c1: string; // Top 1 Gold color
  c2: string; // Top 2 Silver color
  c3: string; // Top 3 Bronze color
  nameX: number;
  nameY: number;
  scoreX: number;
  scoreY: number;
  posX: number;
  posY: number;
  avaX: number;
  avaY: number;
  align: TextAlign;
  avatarSize: number;
  barHeightMultiplier: number;
  renderFps: 30 | 60;
  renderEngine: 'legacy' | 'fast_gpu';
  juryVoterId?: number | null;
  particleEffects?: boolean;
  showLeaderCrown?: boolean;
  cardYOffset?: number;
  videoDurationSec?: number;
  soundEnabled: boolean;
  customPresets: Preset[];
  participants: Participant[];
}
