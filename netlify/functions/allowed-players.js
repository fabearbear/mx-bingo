const { getPool } = require('./db');

exports.handler = async (event) => {
  const pool = getPool();
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET - Get allowed players
    if (event.httpMethod === 'GET') {
      const result = await pool.query(
        'SELECT id, name, lucky_number as "luckyNumber" FROM allowed_players ORDER BY name'
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows),
      };
    }
    
    // POST - Update allowed players
    if (event.httpMethod === 'POST') {
      const players = JSON.parse(event.body);
      
      // Clear existing
      await pool.query('DELETE FROM allowed_players');
      
      // Insert new players
      for (const player of players) {
        await pool.query(
          'INSERT INTO allowed_players (name, lucky_number) VALUES ($1, $2)',
          [player.name, player.luckyNumber || Math.floor(1000 + Math.random() * 9000).toString()]
        );
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
