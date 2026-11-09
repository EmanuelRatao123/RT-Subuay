import React from 'react';
import { GameMode } from '../types/game';
import { formatNoCoinTime, formatNumber } from '../game/constants';
import { Coins, Pause, Timer, Compass, Zap, Flame } from 'lucide-react';

interface Props {
  mode: GameMode;
  score: number;
  distance: number;
  coins: number;
  timeMs: number;
  onPause: () => void;
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  onSlide: () => void;
}

export const HUD: React.FC<Props> = ({
  mode,
  score,
  distance,
  coins,
  timeMs,
  onPause,
  onLeft,
  onRight,
  onJump,
  onSlide,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Bar: Cluster with Score, Coins or No Coin Timer, Pause */}
      <div className="w-full flex items-start justify-between gap-3">
        {/* Left cluster: Score & Distance */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {mode === 'normal' && (
            <div className="flex items-center gap-2 bg-black/60 border border-slate-700/60 rounded-2xl px-4 py-2 backdrop-blur-sm shadow-xl">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block leading-none">
                  Pontos
                </span>
                <span className="font-game text-xl sm:text-2xl font-black text-white tabular-nums tracking-wider">
                  {formatNumber(score)}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 bg-black/50 border border-slate-800/80 rounded-xl px-3.5 py-1.5 backdrop-blur-sm">
            <Compass className="w-4 h-4 text-sky-400" />
            <span className="font-game text-sm sm:text-base font-bold text-slate-200 tabular-nums">
              {formatNumber(distance)} m
            </span>
          </div>
        </div>

        {/* Center / Highlight: NO COIN TIMER (Highlighted in No Coin Mode!) */}
        {mode === 'no-coin' ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-red-950/80 via-black/85 to-red-950/80 border-2 border-red-500/80 rounded-2xl px-5 py-2.5 shadow-[0_0_25px_rgba(239,68,68,0.45)] backdrop-blur-md animate-none">
              <Timer className="w-6 h-6 text-red-400 animate-pulse" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-black text-red-300 tracking-widest leading-tight">
                  SOBREVIVÊNCIA NO COIN
                </span>
                <span className="font-game text-2xl sm:text-4xl font-black text-white tabular-nums tracking-wider text-stroke-sm">
                  {formatNoCoinTime(timeMs)}
                </span>
              </div>
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
            <div className="mt-1.5 px-3 py-0.5 rounded-full bg-red-600/30 border border-red-500/40 text-[11px] font-bold text-red-200 uppercase tracking-wider">
              NÃO TOQUE EM MOEDAS!
            </div>
          </div>
        ) : (
          /* Normal mode coin cluster */
          <div className="flex items-center gap-2.5 bg-black/60 border border-amber-500/40 rounded-2xl px-4 py-2 backdrop-blur-sm shadow-xl">
            <Coins className="w-6 h-6 text-amber-400 fill-amber-400 animate-spin-slow" />
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider block leading-none">
                Moedas
              </span>
              <span className="font-game text-xl sm:text-2xl font-black text-amber-300 tabular-nums">
                {formatNumber(coins)}
              </span>
            </div>
          </div>
        )}

        {/* Right cluster: Pause Button */}
        <div className="pointer-events-auto">
          <button
            onClick={onPause}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-black/65 border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 transition-all active:scale-95 shadow-xl cursor-pointer"
            title="Pausar jogo (ESC)"
          >
            <Pause className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom Area: Mobile On-screen touch buttons (visible on mobile / touch screen) */}
      <div className="w-full flex items-end justify-between pointer-events-auto sm:hidden pb-2 select-none">
        {/* Left & Right buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={onLeft}
            className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-700 active:bg-amber-500 active:text-black flex items-center justify-center text-white text-xl font-bold shadow-2xl active:scale-90 transition-transform"
          >
            ◀
          </button>
          <button
            onClick={onRight}
            className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-700 active:bg-amber-500 active:text-black flex items-center justify-center text-white text-xl font-bold shadow-2xl active:scale-90 transition-transform"
          >
            ▶
          </button>
        </div>

        {/* Jump & Slide buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={onSlide}
            className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-700 active:bg-sky-500 active:text-black flex items-center justify-center text-white text-xs font-black shadow-2xl active:scale-90 transition-transform"
          >
            BAIXO
          </button>
          <button
            onClick={onJump}
            className="w-14 h-14 rounded-2xl bg-amber-500/90 border border-amber-300 active:bg-amber-400 text-black flex items-center justify-center text-xs font-black shadow-2xl active:scale-90 transition-transform"
          >
            PULO
          </button>
        </div>
      </div>
    </div>
  );
};
