const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
    // This is a simplified version - for production, use WebSocket service
    // For now, we'll use Server-Sent Events
    
    const { game } = event.queryStringParameters;
    
    if (!game) {
        return {
            statusCode: 400,
            body: 'Game code required'
        };
    }
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        },
        body: 'data: {"type": "connected", "game": "' + game + '"}\n\n'
    };
};