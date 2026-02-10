const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { gameCode, playerName } = JSON.parse(event.body);
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        
        // Check if game exists
        const [game] = await sql`
            SELECT * FROM games 
            WHERE code = ${gameCode} 
            AND status = 'active'
        `;
        
        if (!game) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Game not found or inactive' })
            };
        }
        
        // Check player limit
        const playerCount = await sql`
            SELECT COUNT(*) FROM players 
            WHERE game_id = ${game.id}
        `;
        
        const maxPlayers = game.settings?.maxPlayers || 50;
        if (playerCount[0].count >= maxPlayers) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Game is full' })
            };
        }
        
        // Create or update player
        const playerId = crypto.randomUUID();
        
        await sql`
            INSERT INTO players (
                id,
                game_id,
                name,
                joined_at,
                last_seen
            ) VALUES (
                ${playerId},
                ${game.id},
                ${playerName},
                NOW(),
                NOW()
            ) ON CONFLICT (game_id, name) 
            DO UPDATE SET last_seen = NOW()
            RETURNING *
        `;
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                gameCode: game.code,
                gameName: game.name,
                playerId,
                settings: game.settings,
                message: 'Joined game successfully'
            })
        };
        
    } catch (error) {
        console.error('Join game error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to join game' })
        };
    }
};