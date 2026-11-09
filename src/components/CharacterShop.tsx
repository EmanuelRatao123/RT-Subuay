import React, { useState } from 'react';
import { SkinDefinition, PlayerStats } from '../types/game';
import { SKINS, formatNumber } from '../game/constants';
import { CharacterTurntable } from './CharacterTurntable';
import { soundManager } from '../audio/soundManager';
import { ArrowLeft, Check, Lock, Coins, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onBack: () => void;
}

export const CharacterShop: React.FC<Props> = ({ stats, onUpdateStats, onBack }) => {
  const [selectedSkin, setSelectedSkin] = useState<SkinDefinition>(() => {
    return SKINS.find((s) => s.id === stats.selectedSkinId) || SKINS[0];
  });

  const isUnlocked = stats.unlockedSkins.includes(selectedSkin.id);
  const isEquipped = stats.selectedSkinId === selectedSkin.id;
  const canAfford = stats.coins >= selectedSkin.price;

  const handleSelectSkin = (skin: SkinDefinition) => {
    soundManager.playButtonClick();
    setSelectedSkin(skin);
  };

  const handleEquip = () => {
    soundManager.playButtonClick();
    const updated = {
      ...stats,
      selectedSkinId: selectedSkin.id,
    };
    onUpdateStats(updated);
  };

  const handleBuy = () => {
    if (!canAfford) return;
    soundManager.playPurchase();

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    const updated: PlayerStats = {
      ...stats,
      coins: stats.coins - selectedSkin.price,
      unlockedSkins: [...stats.unlockedSkins, selectedSkin.id],
      selectedSkinId: selectedSkin.id,
    };
    onUpdateStats(updated);
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Header bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
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

        <h1 className="font-game text-xl sm:text-2xl font-black text-white tracking-wider flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          LOJA DE PERSONAGENS
        </h1>

        {/* Player coin balance */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/40">
          <Coins className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="font-game text-lg font-black text-amber-300 tabular-nums">
            {formatNumber(stats.coins)}
          </span>
        </div>
      </div>

      {/* Main shop content */}
      <div className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left column: 3D Turntable & details */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <CharacterTurntable skin={selectedSkin} />

          {/* Skin details card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-game text-2xl font-black text-white">{selectedSkin.name}</h2>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                  {selectedSkin.title}
                </span>
              </div>

              {isEquipped ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Equipado
                </span>
              ) : isUnlocked ? (
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold">
                  Adquirido
                </span>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-black font-game">
                  <Coins className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {selectedSkin.price === 0 ? 'GRÁTIS' : formatNumber(selectedSkin.price)}
                </div>
              )}
            </div>

            <p className="text-sm text-slate-400 leading-relaxed pt-1">
              {selectedSkin.description}
            </p>

            {/* Action button */}
            <div className="pt-2">
              {isEquipped ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Check className="w-4 h-4" /> Em Uso
                </button>
              ) : isUnlocked ? (
                <button
                  onClick={handleEquip}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Check className="w-5 h-5" /> Equipar Personagem
                </button>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={!canAfford}
                  className={`w-full py-3 rounded-xl font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer ${
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-5 h-5 fill-current" />
                  {canAfford ? `Desbloquear (${formatNumber(selectedSkin.price)})` : 'Moedas Insuficientes'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Grid of all 12 characters */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Galeria de Corredores ({stats.unlockedSkins.length}/{SKINS.length} Desbloqueados)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SKINS.map((skin) => {
              const unlocked = stats.unlockedSkins.includes(skin.id);
              const equipped = stats.selectedSkinId === skin.id;
              const isSelected = selectedSkin.id === skin.id;

              return (
                <button
                  key={skin.id}
                  onClick={() => handleSelectSkin(skin)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  {/* Status badges */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40"
                      style={{ backgroundColor: skin.themeColor }}
                    />
                    {equipped ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        USO
                      </span>
                    ) : !unlocked ? (
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                    ) : null}
                  </div>

                  <div>
                    <h3 className="font-game font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                      {skin.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{skin.title}</p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    {unlocked ? (
                      <span className="text-emerald-400 font-semibold text-[11px]">Liberado</span>
                    ) : (
                      <span className="font-game font-bold text-amber-400 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 fill-amber-400" />
                        {formatNumber(skin.price)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
