import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface Props {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<Props> = ({ onResume, onRestart, onMainMenu }) => {
  const [sfxMuted, setSfxMuted] = React.useState(soundManager.getSettings().sfxMuted);

  const toggleSfx = () => {
    const next = !sfxMuted;
    soundManager.setSfxMuted(next);
    setSfxMuted(next);
    if (!next) soundManager.playButtonClick();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-150">
        <h2 className="font-game text-3xl font-black text-white tracking-wider">JOGO PAUSADO</h2>

        <div className="w-full flex flex-col gap-3 pt-2">
          {/* Resume */}
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onResume();
            }}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-game font-black text-base uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" /> Continuar
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onRestart();
            }}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-game font-bold text-sm uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Reiniciar Partida
          </button>

          {/* Main Menu */}
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onMainMenu();
            }}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-game font-bold text-sm uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" /> Menu Principal
          </button>

          {/* Sound quick toggle */}
          <button
            onClick={toggleSfx}
            className="w-full py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {sfxMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{sfxMuted ? 'Áudio Mudo' : 'Áudio Ativado'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
