exports.handler = async function(event, context) {
  let apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
  apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
  if (apiKey.includes('=')) {
    apiKey = apiKey.split('=').pop().trim().replace(/^["']|["']$/g, '');
  }
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Groq API Key not configured on server' })
    };
  }

  try {
    let subpath = '';
    if (event.path) {
      subpath = event.path.replace(/^\/\.netlify\/functions\/groq/, '').replace(/^\/api\/groq/, '');
    }
    if (subpath.startsWith('/')) {
      subpath = subpath.slice(1);
    }
    const targetUrl = `https://api.groq.com/${subpath}`;

    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' ? event.body : undefined
    });

    const data = await response.json();
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Groq Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
