import axios from 'axios';

const IPINFO_TOKEN = process.env.IPINFO_TOKEN; // Your IPinfo API token
const WEBHOOK_URL = process.env.WEBHOOK_URL;   // Your webhook URL

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get visitor IP (support proxy headers)
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

    console.log(`Visitor IP detected: ${ip}`);

    // IP enrichment
    const ipinfoRes = await axios.get(`https://ipinfo.io/${ip}/json?token=${IPINFO_TOKEN}`);
    const organization = ipinfoRes.data.org || 'Unknown';

    // Extract tracking event data
    const { visitorId, sessionId, eventType, timestamp } = req.body;

    const payload = {
      visitorId,
      sessionId,
      ip,
      organization,
      eventType,
      eventTimestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    console.log('Prepared webhook payload:', payload);

    // Send webhook
    const webhookRes = await axios.post(WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });

    console.log(`Webhook sent, status: ${webhookRes.status}`);

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error sending webhook:', error.response?.data || error.message || error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
