-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(6) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    host_name VARCHAR(100),
    host_id UUID,
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    background JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    lucky_number VARCHAR(4),
    cards JSONB DEFAULT '[]',
    marked_cells JSONB DEFAULT '[]',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, name)
);

-- Create called_numbers table
CREATE TABLE IF NOT EXISTS called_numbers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    called_by UUID,
    called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bingo_claims table
CREATE TABLE IF NOT EXISTS bingo_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    pattern VARCHAR(50) NOT NULL,
    verified BOOLEAN DEFAULT false,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(100),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_code ON games(code);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_called_numbers_game_id ON called_numbers(game_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_game_id ON chat_messages(game_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();