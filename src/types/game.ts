export type GameMode = 'normal' | 'no-coin';

export type GameState = 'menu' | 'playing' | 'paused' | 'game-over';

export interface SkinDefinition {
  id: string;
  name: string;
  title: string;
  price: number; // 0 for default
  description: string;
  themeColor: string;
  hairColor: string;
  outfitColor: string;
  accentColor: string;
  skinTone: string;
  hatType: 'cap' | 'headphones' | 'ninja' | 'helmet' | 'beanie' | 'none' | 'crown' | 'visor';
  accessory: 'backpack' | 'skateboard' | 'katana' | 'jetpack' | 'spraycan' | 'cape' | 'none';
}

export interface MapDefinition {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  skyColor: string;
  fogColor: string;
  fogDensity: number;
  groundColor: string;
  railColor: string;
  tieColor: string;
  ambientColor: string;
  sunColor: string;
  trainColor1: string;
  trainColor2: string;
  neonColors: string[];
  sceneryType: 'sao-paulo' | 'new-york' | 'tokyo' | 'london' | 'tropical' | 'futuristic';
}

export interface PlayerStats {
  coins: number;
  credits: number;
  highScoreNormal: number;
  bestDistanceNormal: number;
  bestTimeNoCoin: number; // in milliseconds
  gamesPlayed: number;
  unlockedSkins: string[];
  selectedSkinId: string;
  selectedMapId: string;
  playerName: string;
  avatarSeed: number;
}

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  avatar_id: string;
  survived_ms: number;
  formatted_time: string;
  map_id: string;
  created_at: string;
  rank?: number;
}

export interface SoundSettings {
  sfxVolume: number;
  musicVolume: number;
  sfxMuted: boolean;
  musicMuted: boolean;
}
