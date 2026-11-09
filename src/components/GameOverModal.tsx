import React, { useEffect, useState } from 'react';
import { GameMode, PlayerStats } from '../types/game';
import { formatNoCoinTime, formatNumber } from '../game/constants';
import { submitNoCoinScore } from '../lib/supabase';
import { soundManager } from '../audio/soundManager';
import { RotateCcw, Home, Trophy, Coins, Compass, Zap, Flame, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  summary: {
    mode: GameMode;
    score: number;
    distance: number;
    coins: number;
    survivedMs: number;
    reason: 'crash' | 'coin';
  };
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<Props> = ({
  summary,
  stats,
  onUpdateStats,
  onPlayAgain,
  onMainMenu,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    // Check if new record
    let newRecord = false;
    const updatedStats = { ...stats };
    updatedStats.gamesPlayed += 1;

    if (summary.mode === 'normal') {
      updatedStats.coins += summary.coins;
      if (summary.score > updatedStats.highScoreNormal) {
        updatedStats.highScoreNormal = summary.score;
        newRecord = true;
      }
      if (summary.distance > updatedStats.bestDistanceNormal) {
        updatedStats.bestDistanceNormal = summary.distance;
      }
      onUpdateStats(updatedStats);
    } else {
      // No Coin mode
      if (summary.survivedMs > updatedStats.bestTimeNoCoin) {
        updatedStats.bestTimeNoCoin = summary.survivedMs;
        newRecord = true;
      }
      onUpdateStats(updatedStats);

      // Auto submit to leaderboard
      setIsSubmitting(true);
      submitNoCoinScore(
        stats.playerName,
        stats.selectedSkinId,
        summary.survivedMs,
        stats.selectedMapId
      ).finally(() => {
        setIsSubmitting(false);
      });
    }

    setIsNewRecord(newRecord);

    if (newRecord) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.5 },
        });
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Banner reason */}
        {summary.reason === 'coin' ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/30 border border-red-500/60 text-red-300 text-xs font-black uppercase tracking-wider mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            MOEDA COLETADA! (MODO NO COIN)
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
            COLISÃO FERROVIÁRIA!
          </div>
        )}

        {/* Title */}
        <h2 className="font-game text-4xl sm:text-5xl font-black text-white tracking-wider text-stroke-sm text-center">
          GAME OVER
        </h2>

        {isNewRecord && (
          <div className="my-2 px-4 py-1 rounded-full bg-amber-500 text-black font-game font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/30 flex items-center gap-1.5 animate-bounce">
            <Trophy className="w-3.5 h-3.5 fill-black" /> NOVO RECORDE PESSOAL!
          </div>
        )}

        {/* Highlight Score or Time */}
        <div className="w-full my-4 p-5 rounded-2xl bg-black/60 border border-slate-800 flex flex-col items-center shadow-inner">
          {summary.mode === 'no-coin' ? (
            <>
              <span className="text-xs uppercase font-bold text-red-400 tracking-widest flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Tempo Sobrevivido
              </span>
              <span className="font-game text-4xl sm:text-5xl font-black text-white tabular-nums tracking-wide text-stroke-md my-1">
                {formatNoCoinTime(summary.survivedMs)}
              </span>
              <span className="text-xs text-slate-400">
                Melhor Tempo: {formatNoCoinTime(Math.max(stats.bestTimeNoCoin, summary.survivedMs))}
              </span>
              {isSubmitting && (
                <span className="text-[11px] text-amber-400 mt-2 font-medium">
                  Sincronizando com o ranking global...
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">
                Pontuação Final
              </span>
              <span className="font-game text-4xl sm:text-5xl font-black text-amber-400 tabular-nums tracking-wide text-stroke-sm my-1">
                {formatNumber(summary.score)}
              </span>
              <span className="text-xs text-slate-400">
                Recorde: {formatNumber(Math.max(stats.highScoreNormal, summary.score))}
              </span>
            </>
          )}
        </div>

        {/* Secondary metrics */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <Compass className="w-6 h-6 text-sky-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Distância</span>
              <span className="font-game text-lg font-black text-white tabular-nums">
                {formatNumber(summary.distance)} m
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <Coins className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Moedas</span>
              <span className="font-game text-lg font-black text-amber-300 tabular-nums">
                +{formatNumber(summary.coins)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onPlayAgain();
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-game font-black text-base sm:text-lg uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" /> JOGAR NOVAMENTE
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onMainMenu();
            }}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white font-game font-bold text-sm sm:text-base uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" /> MENU PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};
