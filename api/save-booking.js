import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nom, email, date, heure, service } = req.body;

  if (!date || !heure) {
    return res.status(400).json({ error: 'Date and time are required' });
  }

  try {
    const key = `bookings:${date}`;
    // Add time slot to the set of busy slots for that day
    await kv.sadd(key, heure);
    
    // Store full details separately if needed (optional)
    const bookingId = `detail:${date}:${heure}`;
    await kv.set(bookingId, { nom, email, service, timestamp: Date.now() });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
