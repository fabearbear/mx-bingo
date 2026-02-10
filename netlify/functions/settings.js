const { getPool } = require('./db');

exports.handler = async (event) => {
  const pool = getPool();
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      const result = await pool.query('SELECT key, value FROM settings');
      const settings = {};
      result.rows.forEach(row => {
        settings[row.key] = row.value;
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(settings),
      };
    }

    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      // Update each setting
      for (const [key, value] of Object.entries(data)) {
        await pool.query(
          `INSERT INTO settings (key, value) 
           VALUES ($1, $2) 
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
          [key, JSON.stringify(value)]
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
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
