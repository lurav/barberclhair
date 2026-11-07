// /api/send-sms.js - Passerelle SMS Android 100% gratuite (MacroDroid / TextBee / Webhook)
// Envoie des vrais SMS via la carte SIM du smartphone Android du salon.

const FS_KEY = "AIzaSyBCUp8nPoZf-rtwAgvI-mZPNyK96PXKgQ8";
const FS_BASE = "https://firestore.googleapis.com/v1/projects/rdv-coiffeur-a785b/databases/(default)/documents";

async function getGatewayUrl() {
    if (process.env.SMS_GATEWAY_URL) {
        return process.env.SMS_GATEWAY_URL;
    }
    try {
        const res = await fetch(`${FS_BASE}/bookings/_config_sms_gateway?key=${FS_KEY}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data?.fields?.url?.stringValue || null;
    } catch (e) {
        console.warn('Lecture config passerelle SMS impossible :', e);
        return null;
    }
}

function cleanFrenchPhone(phone) {
    let d = String(phone || '').replace(/\D/g, '');
    if (d.startsWith('0033')) d = '0' + d.slice(4);
    else if (d.startsWith('33') && d.length === 11) d = '0' + d.slice(2);
    return d;
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    const body = req.body || {};
    const phone = cleanFrenchPhone(body.phone || req.query?.phone);
    const clientName = (body.clientName || req.query?.clientName || 'Client').trim();
    const dateStr = body.dateStr || body.date || req.query?.dateStr || '';
    const time = body.time || req.query?.time || '';
    const barberName = body.barberName || req.query?.barberName || 'Barber C L\'Hair';
    const type = body.type || req.query?.type || 'confirmation';
    const customMsg = body.customMsg || req.query?.customMsg;

    if (!phone || phone.length < 9) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Numéro de téléphone invalide' }));
        return;
    }

    const gatewayUrl = (body.gatewayUrl || await getGatewayUrl() || '').trim();
    if (!gatewayUrl) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: false,
            configured: false,
            message: 'Passerelle SMS Android non configurée dans l\'espace salon.'
        }));
        return;
    }

    // Construction du message SMS
    let messageText = '';
    if (customMsg) {
        messageText = customMsg;
    } else if (type === 'test') {
        messageText = "Barber C L'Hair : Test reussi ! Votre telephone Android est bien connecte comme passerelle SMS pour le salon.";
    } else if (type === 'reminder') {
        messageText = `Barber C L'Hair : Bonjour ${clientName}, rappel de votre RDV demain a ${time} avec ${barberName}. 33 rue de l'hotel de ville, Aulnoye. Tel: 07 49 15 38 55.`;
    } else {
        // Confirmation immédiate
        messageText = `Barber C L'Hair : Bonjour ${clientName}, votre RDV est confirme pour le ${dateStr} a ${time} avec ${barberName}. 33 rue de l'hotel de ville, Aulnoye. Tel: 07 49 15 38 55.`;
    }

    try {
        const u = new URL(gatewayUrl);
        // Ajout des paramètres standard pour MacroDroid / Webhook
        u.searchParams.set('phone', phone);
        u.searchParams.set('phone_int', '+33' + phone.slice(1));
        u.searchParams.set('msg', messageText);
        u.searchParams.set('message', messageText);

        const targetUrl = u.toString();
        const payloadJson = JSON.stringify({
            phone: phone,
            phone_int: '+33' + phone.slice(1),
            msg: messageText,
            message: messageText
        });

        // Appel de la passerelle Android (MacroDroid accepte GET ou POST)
        const gwRes = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payloadJson
        }).catch(async () => {
            // Fallback en simple GET si le serveur webhook refuse le POST
            return await fetch(targetUrl, { method: 'GET' });
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: true,
            configured: true,
            status: gwRes ? gwRes.status : 200,
            recipient: phone
        }));
    } catch (err) {
        console.error('Erreur appel passerelle SMS :', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
    }
};

