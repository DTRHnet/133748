export const handler = async (event, _context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'healthy',
      service: 'EchoHEIST Netlify Functions',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      functions: {
        search: '/.netlify/functions/search',
        echoheist: '/.netlify/functions/echoheist',
        health: '/.netlify/functions/health',
      },
    }),
  };
};
