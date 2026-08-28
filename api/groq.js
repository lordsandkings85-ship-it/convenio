export default async function handler(req, res) {
  let apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
  apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
  if (apiKey.includes('=')) {
    apiKey = apiKey.split('=').pop().trim().replace(/^["']|["']$/g, '');
  }
  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API Key not configured on server' });
  }

  try {
    let subpath = req.query?.path || '';
    if (!subpath) {
      subpath = req.url.split('?')[0].replace(/^\/api\/groq/, '');
    }
    if (subpath.startsWith('/')) {
      subpath = subpath.slice(1);
    }
    const targetUrl = `https://api.groq.com/${subpath}`;
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Groq Proxy Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
