import axios from 'axios';

const IPINFO_TOKEN = process.env.IPINFO_TOKEN; // Your IPinfo API token
const WEBHOOK_URL = process.env.WEBHOOK_URL;   // Your webhook URL

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

    // Enrich IP with organization data
    const ipinfoRes = await axios.get(`https://ipinfo.io/${ip}/json?token=${IPINFO_TOKEN}`);
    const organization = ipinfoRes.data.org || 'Unknown';

    const { visitorId, sessionId, eventType, timestamp } = req.body;

    const payload = {
      visitorId,
      sessionId,
      ip,
      organization,
      eventType,
      eventTimestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString()
    };

    // Send enriched event data to your webhook
    await axios.post(WEBHOOK_URL, payload);

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error processing tracking event:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
