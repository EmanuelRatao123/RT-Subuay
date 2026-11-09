import React from 'react';
import { GameMode, PlayerStats } from '../types/game';
import { SKINS, MAPS, formatNoCoinTime, formatNumber } from '../game/constants';
import { soundManager } from '../audio/soundManager';
import { Play, Flame, Users, Globe, Trophy, Settings, Coins, Zap } from 'lucide-react';

interface Props {
  stats: PlayerStats;
  onStartGame: (mode: GameMode) => void;
  onOpenShop: () => void;
  onOpenMaps: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<Props> = ({
  stats,
  onStartGame,
  onOpenShop,
  onOpenMaps,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  const currentSkin = SKINS.find((s) => s.id === stats.selectedSkinId) || SKINS[0];
  const currentMap = MAPS.find((m) => m.id === stats.selectedMapId) || MAPS[0];

  const handleStart = (mode: GameMode) => {
    soundManager.userGestureInit();
    soundManager.playButtonClick();
    onStartGame(mode);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-7 select-none">
      {/* Top Header: Player Profile, Wallet and Badges */}
      <div className="w-full flex items-center justify-between pointer-events-auto">
        {/* Left: Player ID & Records Summary */}
        <div className="flex items-center gap-3 bg-black/60 border border-slate-700/60 rounded-2xl px-3.5 py-2 backdrop-blur-md shadow-xl">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white border border-white/20 shadow-md"
            style={{ backgroundColor: currentSkin.themeColor }}
          >
            {stats.playerName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-game font-bold text-sm text-white block leading-tight">
              {stats.playerName}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Zap className="w-3 h-3 fill-amber-400" />
                {formatNumber(stats.highScoreNormal)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-red-400 font-bold">
                <Flame className="w-3 h-3" />
                {formatNoCoinTime(stats.bestTimeNoCoin)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Coins balance & Settings */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onOpenShop();
            }}
            className="flex items-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-2xl px-3.5 py-2 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg shadow-amber-500/10"
            title="Abrir Loja de Moedas"
          >
            <Coins className="w-5 h-5 text-amber-400 fill-amber-400 animate-spin-slow" />
            <span className="font-game text-base font-black text-amber-300 tabular-nums">
              {formatNumber(stats.coins)}
            </span>
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onOpenSettings();
            }}
            className="w-10 h-10 rounded-2xl bg-black/60 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95 shadow-xl cursor-pointer"
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center: Title Brand Logo */}
      <div className="w-full flex flex-col items-center justify-center pointer-events-auto my-auto text-center">
        {/* RT Subway stylized badge lockup */}
        <div className="relative group cursor-default">
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/30 via-red-500/30 to-amber-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
          <div className="relative flex flex-col items-center">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.3em] text-amber-400 bg-black/70 px-4 py-1 rounded-full border border-amber-500/40 shadow-md mb-1">
              3D ENDLESS RUNNER
            </span>
            <h1 className="font-game text-5xl sm:text-7xl lg:text-8xl font-black text-white italic tracking-wider text-stroke-md drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
              RT SUBWAY
            </h1>
          </div>
        </div>

        {/* Selected Map and Skin pill */}
        <div className="mt-4 flex items-center gap-2 bg-black/70 border border-slate-700/80 rounded-full px-4 py-1.5 backdrop-blur-md shadow-lg text-xs text-slate-300">
          <span className="flex items-center gap-1">
            <span className="text-slate-400">Mapa:</span>
            <strong className="text-white">{currentMap.name}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <span className="text-slate-400">Skin:</span>
            <strong className="text-amber-400">{currentSkin.name}</strong>
          </span>
        </div>
      </div>

      {/* Bottom Area: Game Mode Buttons and Navigation Dock */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3.5 pointer-events-auto">
        {/* Primary Play CTAs: Normal Mode & No Coin Mode */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Normal Mode Button */}
          <button
            onClick={() => handleStart('normal')}
            className="group relative p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-game font-black text-lg uppercase tracking-wider shadow-2xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-between cursor-pointer border border-yellow-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <span className="block text-xs uppercase text-slate-900/80 font-bold leading-none">
                  Tradicional
                </span>
                <span className="block text-base sm:text-lg font-black leading-tight">
                  MODO NORMAL
                </span>
              </div>
            </div>
            <Coins className="w-6 h-6 fill-current opacity-70 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* No Coin Mode Button */}
          <button
            onClick={() => handleStart('no-coin')}
            className="group relative p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-game font-black text-lg uppercase tracking-wider shadow-2xl shadow-red-600/35 active:scale-95 transition-all flex items-center justify-between cursor-pointer border border-red-400"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/25 flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-300 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="block text-xs uppercase text-red-200 font-bold leading-none">
                  Competitivo
                </span>
                <span className="block text-base sm:text-lg font-black leading-tight">
                  MODO NO COIN
                </span>
              </div>
            </div>
            <Trophy className="w-6 h-6 text-yellow-300 opacity-90 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Secondary Navigation Dock */}
        <div className="w-full grid grid-cols-3 gap-2.5">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onOpenShop();
            }}
            className="py-3 px-2 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-white font-game font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Personagens</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onOpenMaps();
            }}
            className="py-3 px-2 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-white font-game font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Globe className="w-4 h-4 text-sky-400" />
            <span>Mapas (6)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onOpenLeaderboard();
            }}
            className="py-3 px-2 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-white font-game font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Ranking</span>
          </button>
        </div>

        {/* Flat control hint line */}
        <div className="text-[11px] text-slate-400 tracking-wider text-center hidden sm:block">
          WASD ou Setas para Movimentar · Espaço para Pular · Seta Baixo para Deslizar · ESC para Pausar
        </div>
      </div>
    </div>
  );
};
