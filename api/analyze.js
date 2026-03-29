export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { image, mimeType } = req.body;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: 'Respond ONLY with raw JSON, no markdown.',
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: image }},
        { type: 'text', text: 'Return ONLY: {"dish":"Hebrew name","emoji":"emoji","portion":"portion","calories":300,"protein":10,"carbs":35,"fat":12}' }
      ]}]
    })
  });
  const data = await response.json();
  const raw = data.content?.[0]?.text || '';
  const parsed = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}')+1));
  res.json(parsed);
}
