const { getPool } = require('./db');

function generateLuckyNumber() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateBingoCard() {
  const card = [];
  
  // B (1-15)
  const bNumbers = new Set();
  while (bNumbers.size < 5) bNumbers.add(Math.floor(Math.random() * 15) + 1);
  card.push(...Array.from(bNumbers));
  
  // I (16-30)
  const iNumbers = new Set();
  while (iNumbers.size < 5) iNumbers.add(Math.floor(Math.random() * 15) + 16);
  card.push(...Array.from(iNumbers));
  
  // N (31-45) with FREE
  const nNumbers = new Set();
  while (nNumbers.size < 4) nNumbers.add(Math.floor(Math.random() * 15) + 31);
  const nArray = Array.from(nNumbers);
  nArray.splice(2, 0, 'FREE');
  card.push(...nArray);
  
  // G (46-60)
  const gNumbers = new Set();
  while (gNumbers.size < 5) gNumbers.add(Math.floor(Math.random() * 15) + 46);
  card.push(...Array.from(gNumbers));
  
  // O (61-75)
  const oNumbers = new Set();
  while (oNumbers.size < 5) oNumbers.add(Math.floor(Math.random() * 15) + 61);
  card.push(...Array.from(oNumbers));
  
  return card;
}

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
    const path = event.path.split('/').filter(Boolean);
    
    // GET /players - List all players
    if (event.httpMethod === 'GET' && path.length === 1) {
      const result = await pool.query(
        'SELECT id, name, lucky_number as "luckyNumber", joined_at as "joinedAt", cards, marked FROM players ORDER BY name'
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows),
      };
    }
    
    // POST /players - Create/Login player
    if (event.httpMethod === 'POST' && path.length === 1) {
      const { name, cardsPerPlayer = 3 } = JSON.parse(event.body);
      const trimmedName = name.trim();
      
      // Check if player exists
      const existing = await pool.query(
        'SELECT id, name, lucky_number as "luckyNumber", cards, marked FROM players WHERE name = $1',
        [trimmedName]
      );
      
      if (existing.rows.length > 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(existing.rows[0]),
        };
      }
      
      // Create new player
      const luckyNumber = generateLuckyNumber();
      const cards = [];
      for (let i = 0; i < cardsPerPlayer; i++) {
        cards.push({ numbers: generateBingoCard(), marked: {} });
      }
      
      const result = await pool.query(
        `INSERT INTO players (name, lucky_number, cards) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, lucky_number as "luckyNumber", cards`,
        [trimmedName, luckyNumber, cards]
      );
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0]),
      };
    }
    
    // PUT /players/:id - Update player marks
    if (event.httpMethod === 'PUT' && path.length === 2) {
      const id = path[1];
      const { marked, cardIndex } = JSON.parse(event.body);
      
      // Update marked cells for specific card
      const result = await pool.query(
        'SELECT cards FROM players WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Player not found' }) };
      }
      
      const cards = result.rows[0].cards;
      if (cards[cardIndex]) {
        cards[cardIndex].marked = marked;
        
        await pool.query(
          'UPDATE players SET cards = $1 WHERE id = $2',
          [cards, id]
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
