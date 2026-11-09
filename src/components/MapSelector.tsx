import React from 'react';
import { MapDefinition, PlayerStats } from '../types/game';
import { MAPS } from '../game/constants';
import { soundManager } from '../audio/soundManager';
import { ArrowLeft, Check, Globe, Sparkles, MapPin } from 'lucide-react';

interface Props {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onBack: () => void;
}

export const MapSelector: React.FC<Props> = ({ stats, onUpdateStats, onBack }) => {
  const handleSelectMap = (map: MapDefinition) => {
    soundManager.playButtonClick();
    onUpdateStats({
      ...stats,
      selectedMapId: map.id,
    });
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
          <Globe className="w-5 h-5 text-sky-400" />
          SELEÇÃO DE MAPAS
        </h1>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" /> 100% GRATUITOS
        </div>
      </div>

      {/* Grid of 6 world maps */}
      <div className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
        {MAPS.map((map) => {
          const isSelected = stats.selectedMapId === map.id;

          return (
            <div
              key={map.id}
              onClick={() => handleSelectMap(map)}
              className={`p-5 rounded-3xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)] ring-2 ring-sky-400/30'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              {/* Top ambient color preview bar */}
              <div
                className="h-2 w-full rounded-full mb-4 opacity-80 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `linear-gradient(to right, ${map.skyColor}, ${map.trainColor1}, ${map.neonColors[0]})`,
                }}
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {map.country}
                  </span>
                  {isSelected ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/50 text-sky-300 text-xs font-bold">
                      <Check className="w-3.5 h-3.5" /> Selecionado
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-300">
                      Disponível
                    </span>
                  )}
                </div>

                <h2 className="font-game text-2xl font-black text-white group-hover:text-sky-300 transition-colors">
                  {map.name}
                </h2>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">
                  {map.description}
                </p>
              </div>

              {/* Map visual signature chips */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full border border-black/50"
                    title="Trem primário"
                    style={{ backgroundColor: map.trainColor1 }}
                  />
                  <span
                    className="w-3 h-3 rounded-full border border-black/50"
                    title="Trem secundário"
                    style={{ backgroundColor: map.trainColor2 }}
                  />
                  <span
                    className="w-3 h-3 rounded-full border border-black/50"
                    title="Neon da cidade"
                    style={{ backgroundColor: map.neonColors[0] }}
                  />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectMap(map);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                  }`}
                >
                  {isSelected ? 'Em Uso' : 'Escolher Mapa'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
