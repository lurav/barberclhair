import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nom, email, telephone, date, heure, service } = req.body;

  if (!date || !heure) {
    return res.status(400).json({ error: 'Date and time are required' });
  }

  try {
    const key = `bookings:${date}`;
    // Marquer le créneau comme occupé
    await kv.sadd(key, heure);
    
    // Stocker les détails de la réservation
    const bookingId = `detail:${date}:${heure}`;
    await kv.set(bookingId, { nom, telephone: telephone || email, service, timestamp: Date.now() });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
