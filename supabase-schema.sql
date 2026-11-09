-- ========================================================
-- RT SUBWAY — SUPABASE DATABASE SCHEMA & POLICIES
-- Execute este script no SQL Editor do seu projeto Supabase
-- ========================================================

-- 1. Tabela de Leaderboard No Coin (Ranking Global)
CREATE TABLE IF NOT EXISTS public.rt_subway_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name VARCHAR(32) NOT NULL,
    avatar_id VARCHAR(32) NOT NULL DEFAULT 'jake-rt',
    survived_ms INTEGER NOT NULL CHECK (survived_ms > 0 AND survived_ms <= 3600000),
    map_id VARCHAR(32) NOT NULL DEFAULT 'sao-paulo',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de alta performance para consulta do Top 20 ordenado
CREATE INDEX IF NOT EXISTS idx_subway_leaderboard_survived_ms 
ON public.rt_subway_leaderboard (survived_ms DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.rt_subway_leaderboard ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública: qualquer jogador pode consultar o ranking global
CREATE POLICY "Leitura pública do ranking RT Subway"
ON public.rt_subway_leaderboard
FOR SELECT
TO public
USING (true);

-- Política de inserção: jogadores podem enviar suas pontuações válidas
CREATE POLICY "Inserção pública de pontuação RT Subway"
ON public.rt_subway_leaderboard
FOR INSERT
TO public
WITH CHECK (
    survived_ms > 500 AND 
    survived_ms <= 3600000 AND
    length(player_name) >= 2 AND
    length(player_name) <= 32
);

-- 2. Tabela opcional de Perfis de Jogadores (Sincronização na nuvem)
CREATE TABLE IF NOT EXISTS public.rt_subway_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT UNIQUE NOT NULL,
    player_name VARCHAR(32) NOT NULL,
    avatar_id VARCHAR(32) DEFAULT 'jake-rt',
    high_score_normal INTEGER DEFAULT 0,
    best_time_nocoin INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 0,
    unlocked_skins TEXT[] DEFAULT ARRAY['jake-rt'],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.rt_subway_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura de perfis RT Subway"
ON public.rt_subway_profiles
FOR SELECT
TO public
USING (true);

CREATE POLICY "Upsert de perfis RT Subway"
ON public.rt_subway_profiles
FOR ALL
TO public
USING (true)
WITH CHECK (true);
