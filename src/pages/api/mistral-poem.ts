import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'MISTRAL_API_KEY not set' });
  }

  try {
    const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: req.body.tokens || 256,
      }),
    });
    if (!mistralRes.ok) {
      const error = await mistralRes.text();
      return res.status(500).json({ error });
    }
    const data = await mistralRes.json();
    return res.status(200).json({ output: data.choices?.[0]?.message?.content || '' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
} 