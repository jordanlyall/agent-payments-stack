export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const response = await fetch(
      'https://api.beehiiv.com/v2/publications/pub_4f0f6656-c95b-4047-8295-1b1d2ddf47d3/subscriptions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BEEHIIV_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          utm_source: 'agentpaymentsstack.com',
        }),
      }
    );

    if (response.ok) {
      return res.status(200).json({ success: true });
    }

    const data = await response.json();
    return res.status(response.status).json({ error: data });
  } catch {
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
}
