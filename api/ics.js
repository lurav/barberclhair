// Fonction Vercel : génère un fichier .ics (agenda) à partir des paramètres de l'URL.
// iPhone/Safari ouvre directement « Ajouter au calendrier » avec ce type de réponse.
const esc = (s) => String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .slice(0, 300);

const isUtcStamp = (s) => /^\d{8}T\d{6}Z$/.test(s || '');

// Replie les lignes > 75 octets (norme iCalendar)
const fold = (line) => {
    const out = [];
    let cur = '';
    for (const ch of line) {
        if (Buffer.byteLength(cur + ch) > 73) { out.push(cur); cur = ' ' + ch; }
        else cur += ch;
    }
    out.push(cur);
    return out.join('\r\n');
};

module.exports = (req, res) => {
    const q = req.query || {};
    if (!isUtcStamp(q.start) || !isUtcStamp(q.end)) {
        res.statusCode = 400;
        res.end('Paramètres invalides');
        return;
    }
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        "PRODID:-//Barber C L'Hair//FR",
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:barber-${q.start}-${Math.random().toString(36).slice(2)}@barberclhair.fr`,
        `DTSTAMP:${now}`,
        `DTSTART:${q.start}`,
        `DTEND:${q.end}`,
        `SUMMARY:${esc(q.title)}`,
        `DESCRIPTION:${esc(q.desc)}`,
        `LOCATION:${esc(q.loc)}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        "DESCRIPTION:Rappel RDV Barber C L'Hair dans 1h",
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].map(fold).join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="rdv-barber-c-l-hair.ics"');
    res.setHeader('Cache-Control', 'no-store');
    res.end(lines);
};
