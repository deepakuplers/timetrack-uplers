const axios = require('axios');

const IPINFO_TOKEN = process.env.IPINFO_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

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

    await axios.post(WEBHOOK_URL, payload, { headers: { 'Content-Type': 'application/json' } });

    return res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('Error sending webhook:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
