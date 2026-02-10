const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        
        const games = await sql`
            SELECT 
                g.*,
                COUNT(p.id) as player_count,
                g.host_name
            FROM games g
            LEFT JOIN players p ON g.id = p.game_id
            WHERE g.status = 'active'
            GROUP BY g.id
            ORDER BY g.created_at DESC
            LIMIT 20
        `;
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(games.map(game => ({
                code: game.code,
                name: game.name,
                playerCount: parseInt(game.player_count),
                hostName: game.host_name,
                createdAt: game.created_at,
                active: game.status === 'active',
                settings: game.settings
            })))
        };
        
    } catch (error) {
        console.error('Active games error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch games' })
        };
    }
};