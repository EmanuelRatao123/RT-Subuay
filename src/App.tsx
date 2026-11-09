/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameMode, GameState, PlayerStats } from './types/game';
import { loadPlayerStats, savePlayerStats } from './lib/supabase';
import { SKINS, MAPS } from './game/constants';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { CharacterShop } from './components/CharacterShop';
import { MapSelector } from './components/MapSelector';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

type ActiveModal = 'shop' | 'maps' | 'leaderboard' | 'settings' | null;

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Stats state
  const [stats, setStats] = useState<PlayerStats>(() => loadPlayerStats());

  // Game UI state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Runtime metrics
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [timeMs, setTimeMs] = useState(0);

  // Game over details
  const [gameOverSummary, setGameOverSummary] = useState<{
    mode: GameMode;
    score: number;
    distance: number;
    coins: number;
    survivedMs: number;
    reason: 'crash' | 'coin';
  } | null>(null);

  // Initialize 3D Engine on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(
      canvasMountRef.current,
      stats.selectedSkinId,
      stats.selectedMapId,
      gameMode,
      {
        onScoreUpdate: (newScore, newDistance, newCoins, newTimeMs) => {
          setScore(newScore);
          setDistance(newDistance);
          setSessionCoins(newCoins);
          setTimeMs(newTimeMs);
        },
        onGameOver: (summary) => {
          setGameOverSummary(summary);
          setGameState('game-over');
        },
        onStateChange: (newState) => {
          setGameState(newState);
        },
      }
    );

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync skin updates with 3D engine
  const handleUpdateStats = (newStats: PlayerStats) => {
    setStats(newStats);
    savePlayerStats(newStats);

    if (engineRef.current) {
      if (newStats.selectedSkinId !== stats.selectedSkinId) {
        const skin = SKINS.find((s) => s.id === newStats.selectedSkinId) || SKINS[0];
        engineRef.current.setPlayerSkin(skin);
      }
      if (newStats.selectedMapId !== stats.selectedMapId) {
        const map = MAPS.find((m) => m.id === newStats.selectedMapId) || MAPS[0];
        engineRef.current.loadSceneForMap(map);
      }
    }
  };

  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setActiveModal(null);
    setGameOverSummary(null);
    if (engineRef.current) {
      engineRef.current.setGameMode(mode);
      engineRef.current.startPlaying();
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.startPlaying();
    }
  };

  const handleMainMenu = () => {
    setActiveModal(null);
    setGameOverSummary(null);
    if (engineRef.current) {
      engineRef.current.returnToMenu();
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#0b0f19] select-none">
      {/* 3D WebGL Canvas Viewport (100% full bleed, stable ref mount) */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 overflow-hidden"
      />

      {/* Main Menu Overlay */}
      {gameState === 'menu' && !activeModal && (
        <MainMenu
          stats={stats}
          onStartGame={handleStartGame}
          onOpenShop={() => setActiveModal('shop')}
          onOpenMaps={() => setActiveModal('maps')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* In-Game HUD */}
      {gameState === 'playing' && (
        <HUD
          mode={gameMode}
          score={score}
          distance={distance}
          coins={sessionCoins}
          timeMs={timeMs}
          onPause={handlePause}
          onLeft={() => engineRef.current?.moveLeft()}
          onRight={() => engineRef.current?.moveRight()}
          onJump={() => engineRef.current?.jump()}
          onSlide={() => engineRef.current?.slide()}
        />
      )}

      {/* In-Game Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'game-over' && gameOverSummary && (
        <GameOverModal
          summary={gameOverSummary}
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onPlayAgain={() => handleStartGame(gameMode)}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Character Shop Modal */}
      {activeModal === 'shop' && (
        <CharacterShop
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onBack={() => setActiveModal(null)}
        />
      )}

      {/* Map Selector Modal */}
      {activeModal === 'maps' && (
        <MapSelector
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onBack={() => setActiveModal(null)}
        />
      )}

      {/* Global No Coin Leaderboard Modal */}
      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          stats={stats}
          onBack={() => setActiveModal(null)}
        />
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onClose={() => setActiveModal(null)}
        />
      )}
    </main>
  );
}
