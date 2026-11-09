import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LeaderboardEntry, PlayerStats } from '../types/game';
import { formatNoCoinTime } from '../game/constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('example.com')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_STORAGE_STATS_KEY = 'rt_subway_player_stats_v1';
const LOCAL_STORAGE_LEADERBOARD_KEY = 'rt_subway_local_leaderboard_v1';

// Initial default stats
export function getDefaultPlayerStats(): PlayerStats {
  return {
    coins: 100, // Initial welcome coins
    credits: 0,
    highScoreNormal: 0,
    bestDistanceNormal: 0,
    bestTimeNoCoin: 0,
    gamesPlayed: 0,
    unlockedSkins: ['jake-rt'],
    selectedSkinId: 'jake-rt',
    selectedMapId: 'sao-paulo',
    playerName: `Corredor_${Math.floor(1000 + Math.random() * 9000)}`,
    avatarSeed: Math.floor(Math.random() * 100),
  };
}

// Local storage helpers
export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getDefaultPlayerStats(),
        ...parsed,
        // Ensure default skin is always in unlocked list
        unlockedSkins: Array.from(new Set(['jake-rt', ...(parsed.unlockedSkins || [])])),
      };
    }
  } catch (err) {
    console.warn('Could not read player stats from localStorage', err);
  }
  const def = getDefaultPlayerStats();
  savePlayerStats(def);
  return def;
}

export function savePlayerStats(stats: PlayerStats) {
  try {
    localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Could not save player stats to localStorage', err);
  }
}

// Global No Coin Ranking
export async function fetchNoCoinLeaderboard(): Promise<LeaderboardEntry[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rt_subway_leaderboard')
        .select('*')
        .order('survived_ms', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        return data.map((item, idx) => ({
          id: item.id || `entry-${idx}`,
          player_name: item.player_name || 'Anônimo',
          avatar_id: item.avatar_id || 'jake-rt',
          survived_ms: item.survived_ms || 0,
          formatted_time: formatNoCoinTime(item.survived_ms || 0),
          map_id: item.map_id || 'sao-paulo',
          created_at: item.created_at || new Date().toISOString(),
          rank: idx + 1,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch error, falling back to local leaderboard', err);
    }
  }

  // Fallback to local leaderboard if Supabase is offline or not configured
  return getLocalLeaderboard();
}

export async function submitNoCoinScore(
  playerName: string,
  avatarId: string,
  survivedMs: number,
  mapId: string
): Promise<{ success: boolean; rank?: number; isNewRecord: boolean }> {
  // Input validation & basic anti-cheat check
  if (survivedMs <= 500 || survivedMs > 3600000 || isNaN(survivedMs)) {
    return { success: false, isNewRecord: false };
  }

  // 1. Update local stats
  const stats = loadPlayerStats();
  let isNewRecord = false;
  if (survivedMs > stats.bestTimeNoCoin) {
    stats.bestTimeNoCoin = survivedMs;
    isNewRecord = true;
  }
  stats.gamesPlayed += 1;
  savePlayerStats(stats);

  // 2. Add to local leaderboard
  addToLocalLeaderboard({
    id: `local-${Date.now()}`,
    player_name: playerName,
    avatar_id: avatarId,
    survived_ms: survivedMs,
    formatted_time: formatNoCoinTime(survivedMs),
    map_id: mapId,
    created_at: new Date().toISOString(),
  });

  // 3. Send to Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rt_subway_leaderboard')
        .insert([
          {
            player_name: playerName.slice(0, 24),
            avatar_id: avatarId,
            survived_ms: Math.floor(survivedMs),
            map_id: mapId,
          },
        ])
        .select();

      if (!error && data) {
        return { success: true, isNewRecord };
      }
    } catch (err) {
      console.warn('Error submitting to Supabase:', err);
    }
  }

  return { success: true, isNewRecord };
}

// Local mock/fallback leaderboard
function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LEADERBOARD_KEY);
    if (raw) {
      const parsed: LeaderboardEntry[] = JSON.parse(raw);
      return parsed
        .sort((a, b) => b.survived_ms - a.survived_ms)
        .slice(0, 20)
        .map((e, idx) => ({ ...e, rank: idx + 1 }));
    }
  } catch {
    // fallback
  }

  // Pre-seed clean baseline records so the table displays beautifully on first run
  const initialRecords: LeaderboardEntry[] = [
    { id: 'seed-1', player_name: 'MetroGod', avatar_id: 'golden-runner', survived_ms: 124850, formatted_time: '02:04.850', map_id: 'futuristic', created_at: new Date(Date.now() - 3600000 * 5).toISOString(), rank: 1 },
    { id: 'seed-2', player_name: 'CyberBlade', avatar_id: 'aoi-shinobi', survived_ms: 108340, formatted_time: '01:48.340', map_id: 'tokyo', created_at: new Date(Date.now() - 3600000 * 12).toISOString(), rank: 2 },
    { id: 'seed-3', player_name: 'SkateQueen', avatar_id: 'maya-cyber', survived_ms: 95410, formatted_time: '01:35.410', map_id: 'new-york', created_at: new Date(Date.now() - 3600000 * 24).toISOString(), rank: 3 },
    { id: 'seed-4', player_name: 'SubwayPro_BR', avatar_id: 'jake-rt', survived_ms: 82190, formatted_time: '01:22.190', map_id: 'sao-paulo', created_at: new Date(Date.now() - 3600000 * 48).toISOString(), rank: 4 },
    { id: 'seed-5', player_name: 'Vortex_X', avatar_id: 'rex-mecha', survived_ms: 76540, formatted_time: '01:16.540', map_id: 'futuristic', created_at: new Date(Date.now() - 3600000 * 72).toISOString(), rank: 5 },
  ];

  try {
    localStorage.setItem(LOCAL_STORAGE_LEADERBOARD_KEY, JSON.stringify(initialRecords));
  } catch {
    // ignore
  }

  return initialRecords;
}

function addToLocalLeaderboard(entry: LeaderboardEntry) {
  try {
    const list = getLocalLeaderboard();
    list.push(entry);
    const sorted = list
      .sort((a, b) => b.survived_ms - a.survived_ms)
      .slice(0, 30);
    localStorage.setItem(LOCAL_STORAGE_LEADERBOARD_KEY, JSON.stringify(sorted));
  } catch {
    // ignore
  }
}
