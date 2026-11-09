import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, PlayerStats } from '../types/game';
import { fetchNoCoinLeaderboard, isSupabaseConfigured } from '../lib/supabase';
import { formatNoCoinTime, SKINS } from '../game/constants';
import { soundManager } from '../audio/soundManager';
import { ArrowLeft, Trophy, Crown, RefreshCw, Flame, UserCheck } from 'lucide-react';

interface Props {
  stats: PlayerStats;
  onBack: () => void;
}

export const LeaderboardModal: React.FC<Props> = ({ stats, onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchNoCoinLeaderboard();
      setEntries(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSkinThemeColor = (skinId: string) => {
    const s = SKINS.find((item) => item.id === skinId);
    return s?.themeColor || '#eab308';
  };

  const champion = entries.length > 0 ? entries[0] : null;

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Header bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold text-sm">Voltar</span>
        </button>

        <div className="flex flex-col items-center">
          <h1 className="font-game text-xl sm:text-2xl font-black text-white tracking-wider flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            RANKING MUNDIAL — NO COIN
          </h1>
          <span className="text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> Sobrevivência Extrema Sem Moedas
          </span>
        </div>

        <button
          onClick={() => {
            soundManager.playButtonClick();
            loadData();
          }}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-750 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          title="Recarregar ranking"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col gap-5 pt-6">
        {/* Connection status notice */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-emerald-400 font-bold">Servidor Online</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              {isSupabaseConfigured
                ? 'Nuvem Conectada'
                : 'Ranking Ativo em Tempo Real'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <UserCheck className="w-4 h-4 text-sky-400" />
            <span>Seu Recorde: </span>
            <span className="font-game text-amber-400 tabular-nums">
              {formatNoCoinTime(stats.bestTimeNoCoin)}
            </span>
          </div>
        </div>

        {/* 1st Place Champion Spotlight */}
        {champion && (
          <div className="relative p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-yellow-900/20 to-amber-950/40 border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-lg">
                  <Crown className="w-9 h-9 text-amber-400 animate-bounce" />
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-black font-black text-[10px]">
                  #1
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                  CAMPEÃO MUNDIAL NO COIN
                </span>
                <h3 className="font-game text-2xl font-black text-white">{champion.player_name}</h3>
                <span className="text-xs text-slate-400">Recorde registrado</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 block">Tempo Sobrevivido</span>
              <span className="font-game text-2xl sm:text-3xl font-black text-amber-300 tabular-nums text-stroke-sm">
                {champion.formatted_time || formatNoCoinTime(champion.survived_ms)}
              </span>
            </div>
          </div>
        )}

        {/* Top 20 Table */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="col-span-2 sm:col-span-1 text-center">Pos</span>
            <span className="col-span-6 sm:col-span-7">Jogador</span>
            <span className="col-span-4 text-right">Tempo Sobrevivido</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[380px] overflow-y-auto">
            {isLoading ? (
              <div className="p-10 text-center text-slate-500 font-semibold">
                Carregando pontuações globais...
              </div>
            ) : entries.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                Nenhum recorde registrado ainda. Seja o primeiro a jogar o modo No Coin!
              </div>
            ) : (
              entries.map((entry, idx) => {
                const rank = entry.rank || idx + 1;
                const isTop3 = rank <= 3;
                const skinColor = getSkinThemeColor(entry.avatar_id);

                return (
                  <div
                    key={entry.id || idx}
                    className={`grid grid-cols-12 px-5 py-3.5 items-center transition-colors ${
                      rank === 1
                        ? 'bg-amber-500/10'
                        : rank === 2
                        ? 'bg-slate-400/5'
                        : rank === 3
                        ? 'bg-amber-700/5'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="col-span-2 sm:col-span-1 flex justify-center">
                      {rank === 1 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center shadow-md">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="w-7 h-7 rounded-full bg-slate-300 text-black font-black text-xs flex items-center justify-center">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                          3
                        </span>
                      ) : (
                        <span className="font-game font-bold text-sm text-slate-500 tabular-nums">
                          #{rank}
                        </span>
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white border border-white/20 shadow-sm"
                        style={{ backgroundColor: skinColor }}
                      >
                        {entry.player_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm text-white truncate">
                        {entry.player_name}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="col-span-4 text-right">
                      <span
                        className={`font-game text-base sm:text-lg font-black tabular-nums tracking-wide ${
                          isTop3 ? 'text-amber-300 text-stroke-sm' : 'text-slate-200'
                        }`}
                      >
                        {entry.formatted_time || formatNoCoinTime(entry.survived_ms)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
