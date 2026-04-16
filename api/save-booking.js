import { kv } from '@vercel/kv';
import nodemailer from 'nodemailer';

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
    // Ajouter le créneau à la liste des occupés
    await kv.sadd(key, heure);
    
    // Garder les infos complètes
    const bookingId = `detail:${date}:${heure}`;
    await kv.set(bookingId, { nom, email, service, timestamp: Date.now() });

    // Envoi des emails
    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      // 1. Alert pour le Barber
      await transporter.sendMail({
        from: `"Réservations Barber" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `💈 NOUVELLE RÉSERVATION: ${nom} le ${date} à ${heure}`,
        html: `
          <h2>Nouvelle réservation reçue !</h2>
          <ul>
            <li><strong>Client:</strong> ${nom}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Date:</strong> ${date}</li>
            <li><strong>Heure:</strong> ${heure}</li>
            <li><strong>Prestation:</strong> ${service}</li>
          </ul>
        `
      });

      // 2. Email pour le Client
      await transporter.sendMail({
        from: `"Barber c l'hair" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `Confirmation de votre rendez-vous - Barber c l'hair`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
            <h2>Bonjour ${nom},</h2>
            <p>Votre rendez-vous chez <strong>Barber c l'hair</strong> est bien confirmé !</p>
            <div style="background: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p>📅 <strong>Date :</strong> ${date}</p>
              <p>⏰ <strong>Heure :</strong> ${heure}</p>
              <p>✂️ <strong>Prestation :</strong> ${service}</p>
            </div>
            <p>📍 Adresse : 33 rue de l'hôtel de ville, 59620 Aulnoye-Aymeries</p>
            <p>En cas d'empêchement, merci de nous prévenir.</p>
            <p>À très bientôt !</p>
          </div>
        `
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
