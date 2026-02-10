const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { playerName } = JSON.parse(event.body);
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        
        // Generate unique game code
        const generateCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            return Array.from({ length: 6 }, () => 
                chars[Math.floor(Math.random() * chars.length)]
            ).join('');
        };
        
        let gameCode;
        let isUnique = false;
        
        // Ensure unique code
        while (!isUnique) {
            gameCode = generateCode();
            const existing = await sql`
                SELECT code FROM games WHERE code = ${gameCode}
            `;
            isUnique = existing.length === 0;
        }
        
        // Create game
        const [game] = await sql`
            INSERT INTO games (
                code, 
                name, 
                host_name, 
                status, 
                settings,
                created_at
            ) VALUES (
                ${gameCode},
                ${`MX BINGO ${gameCode}`},
                ${playerName},
                'active',
                ${JSON.stringify({
                    maxPlayers: 50,
                    cardsPerPlayer: 3,
                    background: {
                        type: 'gradient',
                        color1: '#1a1a2e',
                        color2: '#16213e'
                    }
                })},
                NOW()
            ) RETURNING *
        `;
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                gameCode,
                gameName: game.name,
                hostId: game.host_id,
                playerId: crypto.randomUUID(),
                message: 'Game created successfully'
            })
        };
        
    } catch (error) {
        console.error('Create game error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to create game' })
        };
    }
};