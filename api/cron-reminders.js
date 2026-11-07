// /api/cron-reminders.js - Tâche automatique (Cron) pour envoyer les rappels SMS de la veille
// Appelé automatiquement par Vercel Cron ou manuellement depuis l'espace salon.

const FS_KEY = "AIzaSyBCUp8nPoZf-rtwAgvI-mZPNyK96PXKgQ8";
const FS_BASE = "https://firestore.googleapis.com/v1/projects/rdv-coiffeur-a785b/databases/(default)/documents";

function pad(n) { return String(n).padStart(2, '0'); }

function getTomorrowIso() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function getGatewayUrl() {
    if (process.env.SMS_GATEWAY_URL) return process.env.SMS_GATEWAY_URL;
    try {
        const res = await fetch(`${FS_BASE}/bookings/_config_sms_gateway?key=${FS_KEY}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data?.fields?.url?.stringValue || null;
    } catch {
        return null;
    }
}

async function getTomorrowBookings(tomorrowIso) {
    const res = await fetch(`${FS_BASE}:runQuery?key=${FS_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'bookings' }],
                where: { fieldFilter: { field: { fieldPath: 'date' }, op: 'EQUAL', value: { stringValue: tomorrowIso } } }
            }
        })
    });
    if (!res.ok) throw new Error('Firestore query ' + res.status);
    const rows = await res.json();
    return rows.filter(r => r.document).map(r => {
        const f = r.document.fields || {};
        const docName = r.document.name || '';
        const docId = docName.split('/').pop();
        return {
            id: docId,
            date: f.date?.stringValue,
            time: f.time?.stringValue,
            clientName: f.clientName?.stringValue || 'Client',
            clientPhone: f.clientPhone?.stringValue,
            barberName: f.barberName?.stringValue || 'Barber C L\'Hair',
            service: f.service?.stringValue,
            reminderSent: f.reminderSent?.booleanValue || false
        };
    });
}

async function markReminderSent(docId) {
    try {
        const nowIso = new Date().toISOString();
        const url = `${FS_BASE}/bookings/${encodeURIComponent(docId)}?updateMask.fieldPaths=reminderSent&updateMask.fieldPaths=reminderSentAt&key=${FS_KEY}`;
        await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    reminderSent: { booleanValue: true },
                    reminderSentAt: { timestampValue: nowIso }
                }
            })
        });
    } catch (e) {
        console.warn('Impossible de marquer le rappel comme envoyé pour', docId, e);
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const gatewayUrl = await getGatewayUrl();
    if (!gatewayUrl) {
        res.statusCode = 200;
        res.end(JSON.stringify({ success: false, message: 'Passerelle SMS non configurée' }));
        return;
    }

    const targetDate = req.query?.date || getTomorrowIso();

    try {
        const bookings = await getTomorrowBookings(targetDate);
        let sentCount = 0;
        const results = [];

        for (const b of bookings) {
            // Ignorer les rendez-vous sans téléphone ou déjà rappelés
            if (!b.clientPhone || b.reminderSent) continue;

            const cleanPhone = b.clientPhone.replace(/\D/g, '');
            if (cleanPhone.length < 9) continue;

            const messageText = `Barber C L'Hair : Bonjour ${b.clientName}, rappel de votre RDV demain a ${b.time} avec ${b.barberName}. 33 rue de l'hotel de ville, Aulnoye. Tel: 07 49 15 38 55.`;

            try {
                const u = new URL(gatewayUrl);
                u.searchParams.set('phone', cleanPhone);
                u.searchParams.set('phone_int', '+33' + cleanPhone.slice(1));
                u.searchParams.set('msg', messageText);
                u.searchParams.set('message', messageText);

                await fetch(u.toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: cleanPhone, msg: messageText, message: messageText })
                }).catch(async () => {
                    return await fetch(u.toString(), { method: 'GET' });
                });

                await markReminderSent(b.id);
                sentCount++;
                results.push({ id: b.id, client: b.clientName, phone: cleanPhone, time: b.time });
            } catch (err) {
                console.error('Erreur envoi rappel pour', b.id, err);
            }
        }

        res.statusCode = 200;
        res.end(JSON.stringify({
            success: true,
            date: targetDate,
            totalBookings: bookings.length,
            sentCount: sentCount,
            reminded: results
        }));
    } catch (err) {
        console.error('Erreur cron reminders :', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
    }
};

