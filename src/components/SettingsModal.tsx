import React, { useState } from 'react';
import { PlayerStats, SoundSettings } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Volume2, VolumeX, Music, User, Keyboard, Smartphone, X, Check } from 'lucide-react';

interface Props {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ stats, onUpdateStats, onClose }) => {
  const [audioSettings, setAudioSettings] = useState<SoundSettings>(() => soundManager.getSettings());
  const [nameInput, setNameInput] = useState(stats.playerName);
  const [savedNameSuccess, setSavedNameSuccess] = useState(false);

  const toggleSfx = () => {
    const next = !audioSettings.sfxMuted;
    soundManager.setSfxMuted(next);
    setAudioSettings((prev) => ({ ...prev, sfxMuted: next }));
    if (!next) soundManager.playButtonClick();
  };

  const toggleMusic = () => {
    const next = !audioSettings.musicMuted;
    soundManager.setMusicMuted(next);
    setAudioSettings((prev) => ({ ...prev, musicMuted: next }));
    soundManager.playButtonClick();
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim().slice(0, 24);
    if (trimmed.length >= 2) {
      onUpdateStats({ ...stats, playerName: trimmed });
      setSavedNameSuccess(true);
      soundManager.playButtonClick();
      setTimeout(() => setSavedNameSuccess(false), 2000);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl p-6 sm:p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Title */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="font-game text-2xl font-black text-white tracking-wider">CONFIGURAÇÕES</h2>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Profile Name */}
        <form onSubmit={handleSaveName} className="flex flex-col gap-2">
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-sky-400" />
            Seu Nome no Ranking Global
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={24}
              placeholder="Digite seu nome..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold text-sm focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
            >
              {savedNameSuccess ? <Check className="w-4 h-4" /> : 'Salvar'}
            </button>
          </div>
        </form>

        {/* Audio Controls */}
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Áudio e Música</span>

          {/* SFX Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-3">
              {audioSettings.sfxMuted ? (
                <VolumeX className="w-5 h-5 text-red-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <span className="font-semibold text-sm text-white block">Efeitos Sonoros (SFX)</span>
                <span className="text-xs text-slate-400">Pulos, deslizes, moedas e colisões</span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSfx}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
                audioSettings.sfxMuted
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {audioSettings.sfxMuted ? 'Mudo' : 'Ligado'}
            </button>
          </div>

          {/* Music Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <Music className={`w-5 h-5 ${audioSettings.musicMuted ? 'text-slate-500' : 'text-amber-400'}`} />
              <div>
                <span className="font-semibold text-sm text-white block">Música Eletrônica Retro</span>
                <span className="text-xs text-slate-400">Trilha sintetizada procedural de corrida</span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleMusic}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
                audioSettings.musicMuted
                  ? 'bg-slate-800 text-slate-400 border border-slate-700'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {audioSettings.musicMuted ? 'Mudo' : 'Ligado'}
            </button>
          </div>
        </div>

        {/* Controls Reference */}
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Como Jogar</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1.5">
              <span className="font-bold text-sky-400 flex items-center gap-1">
                <Keyboard className="w-3.5 h-3.5" /> Computador
              </span>
              <span>• A / D ou ◀ / ▶ : Trocar de Pista</span>
              <span>• W / Espaço ou ▲ : Pular</span>
              <span>• S ou ▼ : Deslizar / Queda Rápida</span>
              <span>• ESC ou P : Pausar</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1.5">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Celular / Touch
              </span>
              <span>• Deslize para a esquerda / direita</span>
              <span>• Deslize para cima: Pulo alto</span>
              <span>• Deslize para baixo: Deslize</span>
              <span>• Botões virtuais auxiliares na tela</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-game font-bold text-sm uppercase tracking-wider transition-all cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
