// Nettoyage automatique d'anciens verrous de test éventuels
try { localStorage.removeItem('barber_active_booking'); } catch(e) {}

// Toggle Mobile Menu
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close');

function openNavMenu() {
    if (navMenu) navMenu.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeNavMenu() {
    if (navMenu) navMenu.classList.remove('show');
    document.body.style.overflow = '';
}

if(navToggle) {
    navToggle.addEventListener('click', openNavMenu);
}

if(navClose) {
    navClose.addEventListener('click', closeNavMenu);
}

// Close mobile menu when a link is clicked
const navLink = document.querySelectorAll('.nav-link');
navLink.forEach(n => n.addEventListener('click', closeNavMenu));

// Close mobile menu on click outside or Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu && navMenu.classList.contains('show')) {
        closeNavMenu();
    }
});

// Header background change on scroll
function scrollHeader() {
    const header = document.querySelector('.header');
    if(window.scrollY >= 50) header.classList.add('scroll');
    else header.classList.remove('scroll');
}
window.addEventListener('scroll', scrollHeader);

// Reveal Animation (Intersection Observer)
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// FAQ Toggle
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if(question) {
        question.addEventListener('click', () => {
            item.classList.toggle('open');
        });
    }
});

// ── Gallery Tabs (Salon / Produits) ───────────────────────────
const galleryTabBtns = document.querySelectorAll('.gallery-tab');
const galleryPanes  = document.querySelectorAll('.gallery-pane');

galleryTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        galleryTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        galleryPanes.forEach(pane => {
            if (pane.id === 'tab-' + target) {
                pane.style.display = 'grid';
                // Re-trigger reveal animations
                pane.querySelectorAll('.reveal').forEach(el => {
                    el.classList.remove('visible');
                    setTimeout(() => el.classList.add('visible'), 50);
                });
            } else {
                pane.style.display = 'none';
            }
        });
    });
});

// Lightbox for Gallery — fermeture : bouton ✕, clic n'importe où, Échap, glisser vers le bas, bouton retour du téléphone
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');
const galleryItems = document.querySelectorAll('.gallery-item');

if (lightbox && lightboxImg && galleryItems.length > 0) {
    const imgs = [...galleryItems].map(it => it.querySelector('img')).filter(Boolean);
    let current = 0, isOpen = false;

    // Flèches précédent / suivant + compteur
    const mk = (cls, html, label) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = cls; b.innerHTML = html; b.setAttribute('aria-label', label);
        lightbox.appendChild(b); return b;
    };
    const prevBtn = mk('lightbox-nav lightbox-prev', '&#8249;', 'Photo précédente');
    const nextBtn = mk('lightbox-nav lightbox-next', '&#8250;', 'Photo suivante');
    const counter = document.createElement('div');
    counter.className = 'lightbox-counter';
    lightbox.appendChild(counter);
    const hint = document.createElement('div');
    hint.className = 'lightbox-hint';
    hint.textContent = 'Touchez n\'importe où pour fermer';
    lightbox.appendChild(hint);
    if (lightboxClose) { lightboxClose.setAttribute('role', 'button'); lightboxClose.setAttribute('aria-label', 'Fermer'); lightboxClose.tabIndex = 0; }

    const show = (i) => {
        current = (i + imgs.length) % imgs.length;
        lightboxImg.classList.remove('lb-in'); void lightboxImg.offsetWidth;
        lightboxImg.src = imgs[current].currentSrc || imgs[current].src;
        lightboxImg.alt = imgs[current].alt || '';
        lightboxImg.classList.add('lb-in');
        counter.textContent = `${current + 1} / ${imgs.length}`;
    };
    const open = (i) => {
        show(i);
        lightbox.style.display = 'flex';
        lightbox.style.alignItems = 'center';
        lightbox.style.justifyContent = 'center';
        lightbox.style.paddingTop = '0';
        requestAnimationFrame(() => lightbox.classList.add('lb-open'));
        document.body.style.overflow = 'hidden';
        isOpen = true;
        history.pushState({ lightbox: true }, '');
    };
    const close = (fromHistory = false) => {
        if (!isOpen) return;
        isOpen = false;
        lightbox.classList.remove('lb-open');
        lightboxImg.style.transform = '';
        document.body.style.overflow = '';
        setTimeout(() => { if (!isOpen) lightbox.style.display = 'none'; }, 250);
        if (!fromHistory && history.state && history.state.lightbox) history.back();
    };

    galleryItems.forEach((item, i) => item.addEventListener('click', () => open(i)));
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); show(current - 1); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); show(current + 1); });
    // Clic n'importe où (fond, photo, croix) = fermer
    lightbox.addEventListener('click', (e) => { if (!e.target.closest('.lightbox-nav')) close(); });
    addEventListener('keydown', (e) => {
        if (!isOpen) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') show(current - 1);
        else if (e.key === 'ArrowRight') show(current + 1);
    });
    // Bouton retour Android / navigateur
    addEventListener('popstate', () => close(true));

    // Glisser : gauche/droite = changer de photo, vers le bas = fermer
    let sx = 0, sy = 0, dragging = false;
    lightbox.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; dragging = true; }, { passive: true });
    lightbox.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        const dy = e.touches[0].clientY - sy;
        if (dy > 0) lightboxImg.style.transform = `translateY(${dy}px) scale(${1 - Math.min(dy / 1500, .15)})`;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
        if (!dragging) return; dragging = false;
        const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        lightboxImg.style.transform = '';
        if (dy > 100) { e.preventDefault(); close(); }
        else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); show(current + (dx < 0 ? 1 : -1)); }
    });
}
/* ==========================================================================
   FIREBASE RESERVATION SYSTEM - BARBER C L'HAIR
   ========================================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyBCUp8nPoZf-rtwAgvI-mZPNyK96PXKgQ8",
    authDomain: "rdv-coiffeur-a785b.firebaseapp.com",
    projectId: "rdv-coiffeur-a785b",
    storageBucket: "rdv-coiffeur-a785b.firebasestorage.app",
    messagingSenderId: "395286987237",
    appId: "1:395286987237:web:283d3904ed3350d9502f0c",
    measurementId: "G-MQD77MQ6VH"
};

// Initialize Firebase & Firestore
let db = null;
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        // Active le cache local pour un chargement instantané (0 ms)
        try {
            db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
        } catch(e) {}
        console.log("✓ Firebase & Firestore connectés avec succès.");
    } else {
        console.warn("Firebase SDK non détecté. Mode démo actif.");
    }
} catch (err) {
    console.error("Erreur Firebase:", err);
}

// ── Fermetures exceptionnelles / Jours bloqués par le salon ──
const closedDays = new Set();
async function loadClosures() {
    if (!db) return;
    try {
        const snap = await db.collection('closures').get();
        closedDays.clear();
        snap.forEach(doc => { if (doc.id) closedDays.add(doc.id); });
        renderCalendarDays();
    } catch (e) {
        console.warn('Lecture closures :', e);
    }
}
if (db) {
    loadClosures();
}

// Salon Data & Opening Hours
// Lun: Fermé | Mar-Jeu: 09h-19h | Ven: 09h-12h30 / 14h-19h | Sam: 09h-19h | Dim: 10h-14h
const DAY_NAMES_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// ==========================================================================
// COIFFEURS DU SALON
// Pour changer un nom : modifier "name". Ne plus changer "id" une fois en ligne
// (il sert à relier les rendez-vous enregistrés au bon coiffeur).
// Les anciens rendez-vous (avant l'ajout du 2e coiffeur) sont attribués au 1er.
// ==========================================================================
const BARBERS = [
    { id: 'isma', name: 'Isma' }
];
const ANY_BARBER = 'any';
let selectedBarber = BARBERS[0].id;
let currentBookedMap = new Map(); // "HH:MM" -> Set(barberId)
let adminBarberFilter = 'all';

function getBarberName(id) {
    const b = BARBERS.find(x => x.id === id);
    return b ? b.name : BARBERS[0].name;
}

function bookingBarberId(data) {
    return (data && data.barber && BARBERS.some(b => b.id === data.barber)) ? data.barber : BARBERS[0].id;
}

function addToBookedMap(map, time, barberId) {
    if (!map.has(time)) map.set(time, new Set());
    map.get(time).add(barberId);
}

function getFreeBarbers(time, bookedMap) {
    const busy = bookedMap.get(time) || new Set();
    return BARBERS.filter(b => !busy.has(b.id));
}

// « Peu importe » : on prend le coiffeur libre qui a le moins de RDV ce jour-là
function pickBarberForSlot(time, bookedMap) {
    const free = getFreeBarbers(time, bookedMap);
    if (free.length === 0) return null;
    const countFor = (id) => {
        let n = 0;
        bookedMap.forEach(set => { if (set.has(id)) n++; });
        return n;
    };
    return free.slice().sort((a, b) => countFor(a.id) - countFor(b.id))[0];
}

function isSlotTaken(time, bookedMap, barberChoice) {
    const busy = bookedMap.get(time) || new Set();
    if (barberChoice === ANY_BARBER) return BARBERS.every(b => busy.has(b.id));
    return busy.has(barberChoice);
}

// Boutons de choix du coiffeur
function renderBarberOptions() {
    const container = document.getElementById('barber-options');
    if (!container) return;
    container.innerHTML = '';

    const options = BARBERS.map(b => ({ id: b.id, name: b.name, hint: 'Coiffeur' }));

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'barber-option' + (selectedBarber === opt.id ? ' active' : '');
        btn.id = `barber-option-${opt.id}`;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', selectedBarber === opt.id ? 'true' : 'false');
        const initial = opt.id === ANY_BARBER ? '★' : opt.name.trim().charAt(0).toUpperCase();
        btn.innerHTML = `
            <span class="barber-avatar">${escapeHtml(initial)}</span>
            <span class="barber-text">
                <span class="barber-name">${escapeHtml(opt.name)}</span>
                <span class="barber-hint">${escapeHtml(opt.hint)}</span>
            </span>
        `;
        btn.addEventListener('click', () => {
            selectedBarber = opt.id;
            renderBarberOptions();
            renderCalendarDays();
            renderSlots(currentBookedMap);
        });
        container.appendChild(btn);
    });
}

function getSlotsForDay(dayOfWeek) {
    if (dayOfWeek === 1) return []; // Lundi : fermé
    if (dayOfWeek === 0) {
        // Dimanche : 10h00 à 14h00
        return ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"];
    }
    if (dayOfWeek === 5) {
        // Vendredi : 09h00 à 12h30 et 14h00 à 19h00
        return [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
        ];
    }
    // Mardi, Mercredi, Jeudi, Samedi : 09h00 à 19h00
    return [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
        "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
        "17:00", "17:30", "18:00", "18:30"
    ];
}

// Calendar State
let currentWeekOffset = 0; // 0 = current week, 1 = next week, etc.
const MAX_WEEK_OFFSET = 8; // Réservation possible jusqu'à 8 semaines à l'avance
let selectedDate = new Date();
// If today is Monday, auto-select Tuesday
if (selectedDate.getDay() === 1) {
    selectedDate.setDate(selectedDate.getDate() + 1);
}
let unsubscribeBookings = null;
let currentSlotForBooking = null;

// Helper: Format date to YYYY-MM-DD
function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper: Format date to French label (ex: "Mardi 14 Octobre 2026")
function formatDateFull(date) {
    const dayName = DAY_NAMES_FULL[date.getDay()];
    const dayNum = date.getDate();
    const monthName = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName} ${dayNum} ${monthName} ${year}`;
}

// Helper: Get start date of the week for given offset
function getWeekStartDate(offset = 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
    // Monday as start of week
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + (offset * 7));
    return monday;
}

// Marge minimale avant un créneau pour pouvoir le réserver (en minutes)
const SLOT_MARGIN_MIN = 10;

// Un créneau est « passé » s'il commence dans moins de SLOT_MARGIN_MIN minutes (ou déjà commencé)
function isSlotPast(date, time) {
    const [h, m] = time.split(':').map(Number);
    const slot = new Date(date);
    slot.setHours(h, m, 0, 0);
    return slot.getTime() <= Date.now() + SLOT_MARGIN_MIN * 60 * 1000;
}

function hasBookableSlot(date, bookedMap) {
    const iso = formatDateISO(date);
    if (closedDays.has(iso)) return false;
    const slots = getSlotsForDay(date.getDay());
    if (slots.length === 0) return false;
    const map = bookedMap || bookingsCache.get(iso) || getLocalBookings(iso);
    return slots.some(t => !isSlotPast(date, t) && !isSlotTaken(t, map, selectedBarber));
}

// Numéro de semaine (offset) contenant une date donnée
function weekOffsetOf(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diffToMonday = (d.getDay() === 0 ? -6 : 1) - d.getDay();
    d.setDate(d.getDate() + diffToMonday);
    return Math.round((d - getWeekStartDate(0)) / (7 * 24 * 60 * 60 * 1000));
}

// Premier jour à partir de `start` qui a encore au moins un créneau réservable
function firstBookableDayFrom(start) {
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 28; i++) {
        if (hasBookableSlot(d)) return d;
        d.setDate(d.getDate() + 1);
    }
    return new Date(start);
}

// Sélectionne automatiquement le prochain jour réservable et la bonne semaine
function resetToFirstBookableDay() {
    selectedDate = firstBookableDayFrom(new Date());
    currentWeekOffset = weekOffsetOf(selectedDate);
}

// Render Calendar Days
function renderCalendarDays() {
    const daysContainer = document.getElementById('calendar-days-container');
    const monthTitle = document.getElementById('current-month');
    const prevWeekBtn = document.getElementById('prev-week');
    if (!daysContainer) return;

    const wrapper = daysContainer.closest('.calendar-days-wrapper');
    const savedScrollLeft = wrapper ? wrapper.scrollLeft : 0;

    daysContainer.innerHTML = '';
    const monday = getWeekStartDate(currentWeekOffset);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable prev button if current week
    if (prevWeekBtn) {
        prevWeekBtn.disabled = currentWeekOffset <= 0;
        prevWeekBtn.style.opacity = currentWeekOffset <= 0 ? '0.3' : '1';
        prevWeekBtn.style.cursor = currentWeekOffset <= 0 ? 'not-allowed' : 'pointer';
    }
    const nextWeekBtnEl = document.getElementById('next-week');
    if (nextWeekBtnEl) {
        const atMax = currentWeekOffset >= MAX_WEEK_OFFSET;
        nextWeekBtnEl.disabled = atMax;
        nextWeekBtnEl.style.opacity = atMax ? '0.3' : '1';
        nextWeekBtnEl.style.cursor = atMax ? 'not-allowed' : 'pointer';
    }

    const displayedDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        displayedDates.push(d);
    }

    // Update Month Title (ex: "Octobre 2026" or "Octobre - Novembre 2026")
    const firstMonth = MONTH_NAMES[displayedDates[0].getMonth()];
    const lastMonth = MONTH_NAMES[displayedDates[6].getMonth()];
    const year = displayedDates[6].getFullYear();
    if (monthTitle) {
        if (firstMonth === lastMonth) {
            monthTitle.textContent = `${firstMonth} ${year}`;
        } else {
            monthTitle.textContent = `${firstMonth} - ${lastMonth} ${year}`;
        }
    }

    displayedDates.forEach(date => {
        const dayOfWeek = date.getDay();
        const isPast = date < today;
        const isMonday = (dayOfWeek === 1);
        const iso = formatDateISO(date);
        const isClosed = closedDays.has(iso);
        const daySlots = getSlotsForDay(dayOfWeek);
        const dayMap = bookingsCache.get(iso) || getLocalBookings(iso);
        const isFull = !isPast && !isMonday && !isClosed && (daySlots.length > 0) && daySlots.every(t => isSlotPast(date, t) || isSlotTaken(t, dayMap, selectedBarber));
        const isDisabled = isPast || isMonday || isClosed;
        const isSelected = iso === formatDateISO(selectedDate);

        const col = document.createElement('div');
        col.className = 'cal-col';

        const dayName = document.createElement('span');
        dayName.className = 'cal-day-name';
        dayName.textContent = DAY_NAMES_SHORT[dayOfWeek];

        const dateBtn = document.createElement('div');
        dateBtn.className = 'cal-date';
        dateBtn.textContent = date.getDate();

        if (isSelected) {
            dateBtn.classList.add('active');
        }

        if (isDisabled) {
            dateBtn.classList.add('disabled');
            col.classList.add('disabled');
            if (isMonday || isClosed) {
                const closedBadge = document.createElement('span');
                closedBadge.className = 'cal-closed-badge';
                closedBadge.textContent = 'Fermé';
                col.appendChild(dayName);
                col.appendChild(dateBtn);
                col.appendChild(closedBadge);
                daysContainer.appendChild(col);
                return;
            }
        } else if (isFull) {
            col.classList.add('cal-full-day');
            const fullBadge = document.createElement('span');
            fullBadge.className = 'cal-closed-badge cal-full-badge';
            fullBadge.textContent = 'Complet';
            col.style.cursor = 'pointer';
            col.addEventListener('click', (e) => {
                e.preventDefault();
                selectedDate = new Date(date);
                renderCalendarDays();
                loadSlotsForSelectedDate();
            });
            col.appendChild(dayName);
            col.appendChild(dateBtn);
            col.appendChild(fullBadge);
            daysContainer.appendChild(col);
            return;
        } else {
            col.style.cursor = 'pointer';
            col.addEventListener('click', (e) => {
                e.preventDefault();
                selectedDate = new Date(date);
                renderCalendarDays();
                loadSlotsForSelectedDate();
            });
        }

        col.appendChild(dayName);
        col.appendChild(dateBtn);
        daysContainer.appendChild(col);
    });

    if (wrapper && savedScrollLeft) {
        wrapper.scrollLeft = savedScrollLeft;
    }
}

// Load Slots and Listen to Bookings for Selected Date
function loadSlotsForSelectedDate() {
    const slotsContainer = document.getElementById('slots-container');
    const selectedDateTitle = document.getElementById('selected-date-title');
    if (!slotsContainer) return;

    if (selectedDateTitle) {
        selectedDateTitle.textContent = formatDateFull(selectedDate);
    }

    const selectedIso = formatDateISO(selectedDate);

    // Jour fermé : affichage immédiat
    if (getSlotsForDay(selectedDate.getDay()).length === 0) {
        renderSlots(new Map());
        startBookingsListener();
        return;
    }

    // Affichage instantané en 0 ms sans spinner bloquant :
    // On prend immédiatement le cache mémoire ou local s'il existe
    const cached = bookingsCache.get(selectedIso) || getLocalBookings(selectedIso);
    renderSlots(cached);

    // L'écouteur Firebase tourne en arrière-plan et actualise les créneaux en direct
    startBookingsListener();

    // Vérification réseau immédiate en tâche de fond pour garantir la fraîcheur à la seconde près
    if (db) {
        db.collection('slots').where('date', '==', selectedIso).get().then(snap => {
            const freshMap = new Map();
            snap.forEach(doc => {
                const data = doc.data();
                if (data && data.time && !doc.id.includes('_phone_') && !String(data.barber || '').startsWith('phone_')) {
                    addToBookedMap(freshMap, data.time, bookingBarberId(data));
                }
            });
            bookingsCache.set(selectedIso, freshMap);
            if (formatDateISO(selectedDate) === selectedIso) {
                renderSlots(freshMap);
            }
        }).catch(() => {});
    }
}

// ===== Cache des réservations =====
// Un seul écouteur temps réel couvre toute la période réservable (aujourd'hui → +MAX_WEEK_OFFSET semaines).
// Changer de jour ne refait donc plus aucune requête réseau.
const bookingsCache = new Map(); // "YYYY-MM-DD" -> Map(time -> barbers)
const activePhoneBookings = new Map(); // "phoneHash" -> { date, time, docId }
let bookingsCacheReady = false;

function restartBookingsListener() {
    if (unsubscribeBookings) {
        try { unsubscribeBookings(); } catch (e) {}
        unsubscribeBookings = null;
    }
    startBookingsListener();
}

function startBookingsListener() {
    if (!db || unsubscribeBookings) return; // déjà actif

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(getWeekStartDate(MAX_WEEK_OFFSET));
    end.setDate(end.getDate() + 6);

    try {
        unsubscribeBookings = db.collection('slots')
            .where('date', '>=', formatDateISO(start))
            .where('date', '<=', formatDateISO(end))
            .onSnapshot((snapshot) => {
                bookingsCache.clear();
                activePhoneBookings.clear();
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (!data || !data.time || !data.date) return;

                    // Verrou cross-device de numéro de téléphone (anonymisé par SHA-256) avec date, heure et prestation (zéro donnée personnelle)
                    if (doc.id.includes('_phone_') || (data.barber && String(data.barber).startsWith('phone_'))) {
                        let pHash = '';
                        let barberId = 'isma';
                        let service = 'Coupe';
                        const barberStr = String(data.barber || '');
                        if (barberStr.includes('|')) {
                            const parts = barberStr.split('|');
                            pHash = parts[0].replace('phone_', '');
                            barberId = parts[1] || 'isma';
                            try { service = decodeURIComponent(parts[2] || ''); } catch (e) { service = parts[2] || 'Coupe'; }
                        } else if (barberStr.startsWith('phone_')) {
                            pHash = barberStr.replace('phone_', '');
                        } else if (doc.id.includes('_phone_')) {
                            pHash = doc.id.split('_phone_')[1];
                        }
                        if (pHash && !isBookingPast(data.date, data.time)) {
                            const [py, pm, pd] = data.date.split('-').map(Number);
                            activePhoneBookings.set(pHash, {
                                date: data.date,
                                dateFull: formatDateFull(new Date(py, pm - 1, pd)),
                                time: data.time,
                                barberId: barberId,
                                barberName: getBarberName(barberId),
                                service: service || 'Coupe',
                                docId: doc.id
                            });
                        }
                        return; // Ne pas compter comme un créneau coiffeur !
                    }

                    if (!bookingsCache.has(data.date)) bookingsCache.set(data.date, new Map());
                    addToBookedMap(bookingsCache.get(data.date), data.time, bookingBarberId(data));
                });
                bookingsCacheReady = true;

                // Si la date actuelle n'a aucun créneau disponible (ex : jour complet),
                // on bascule automatiquement vers le premier jour disponible
                if (!hasBookableSlot(selectedDate)) {
                    const nextAvailable = firstBookableDayFrom(new Date());
                    if (nextAvailable && formatDateISO(nextAvailable) !== formatDateISO(selectedDate)) {
                        selectedDate = nextAvailable;
                        currentWeekOffset = weekOffsetOf(selectedDate);
                    }
                }
                renderCalendarDays();
                renderActiveBookingBanner();
                renderSlots(bookingsCache.get(formatDateISO(selectedDate)) || new Map());

                // Anti-collision temps réel : si l'utilisateur est en train de remplir la réservation pour un créneau qui vient d'être pris par un autre client
                if (bookingModal && bookingModal.classList.contains('show') && currentSlotForBooking) {
                    const dayMap = bookingsCache.get(currentSlotForBooking.dateIso) || new Map();
                    if (isSlotTaken(currentSlotForBooking.time, dayMap, currentSlotForBooking.barberChoice)) {
                        showBookingError("⚠️ Ce créneau vient tout juste d'être réservé par un autre client à l'instant ! Veuillez fermer cette fenêtre et choisir un autre créneau dans le calendrier.");
                        if (btnSubmitBooking) {
                            btnSubmitBooking.disabled = true;
                            if (btnSubmitText) btnSubmitText.textContent = "Créneau déjà réservé";
                        }
                    }
                }
            }, (error) => {
                console.warn("Écouteur slots :", error);
                unsubscribeBookings = null;
                renderCalendarDays();
                renderActiveBookingBanner();
                renderSlots(getLocalBookings(formatDateISO(selectedDate)));
            });
    } catch (e) {
        console.warn("Erreur démarrage écouteur slots :", e);
        unsubscribeBookings = null;
    }
}

// Local Storage Fallback for Bookings
// Format stocké : ["09:30|coiffeur2", ...] (les anciennes entrées "09:30" = coiffeur 1)
function getLocalBookings(dateIso) {
    const map = new Map();
    try {
        const stored = localStorage.getItem(`barber_bookings_${dateIso}`);
        const list = stored ? JSON.parse(stored) : [];
        list.forEach(entry => {
            const [time, barberId] = String(entry).split('|');
            addToBookedMap(map, time, bookingBarberId({ barber: barberId }));
        });
    } catch (e) {
        // ignore
    }
    return map;
}

function saveLocalBooking(dateIso, time, barberId) {
    try {
        const key = `barber_bookings_${dateIso}`;
        const stored = localStorage.getItem(key);
        const list = new Set(stored ? JSON.parse(stored) : []);
        list.add(`${time}|${barberId || BARBERS[0].id}`);
        localStorage.setItem(key, JSON.stringify(Array.from(list)));
    } catch (e) {
        console.error(e);
    }
}

// Render Time Slots
function renderSlots(bookedMap = new Map()) {
    const slotsContainer = document.getElementById('slots-container');
    if (!slotsContainer) return;

    currentBookedMap = bookedMap;
    slotsContainer.innerHTML = '';
    const selectedIso = formatDateISO(selectedDate);
    if (closedDays.has(selectedIso)) {
        slotsContainer.innerHTML = '<div class="slots-empty" style="color: #ff8787; font-weight: 600;">🚫 Le salon est exceptionnellement fermé ce jour-là.</div>';
        return;
    }
    const dayOfWeek = selectedDate.getDay();
    const availableSlots = getSlotsForDay(dayOfWeek);

    if (availableSlots.length === 0) {
        slotsContainer.innerHTML = '<div class="slots-empty">Le salon est fermé ce jour-là.</div>';
        return;
    }

    const activeClient = (typeof getActiveClientBooking === 'function') ? getActiveClientBooking() : null;
    if (activeClient && (!authUser || !authUser.email)) {
        const clientNotice = document.createElement('div');
        clientNotice.className = 'slots-full-notice';
        clientNotice.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 0.85rem 1rem; margin-bottom: 0.75rem; background: rgba(229, 169, 59, 0.12); border: 1px solid rgba(229, 169, 59, 0.4); border-radius: 8px; color: #fff; font-size: 0.88rem;';
        clientNotice.innerHTML = `<span>⚠️ Vous avez déjà un rendez-vous réservé le <strong>${escapeHtml(activeClient.dateFull)} à ${escapeHtml(activeClient.time)}</strong>.<br>Un seul rendez-vous à la fois est autorisé sur le site et l'application.</span>`;
        slotsContainer.appendChild(clientNotice);
    }

    const allBusyOrPast = availableSlots.every(t => isSlotPast(selectedDate, t) || isSlotTaken(t, bookedMap, selectedBarber));
    if (allBusyOrPast) {
        const notice = document.createElement('div');
        notice.className = 'slots-full-notice';
        notice.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 0.85rem 1rem; margin-bottom: 0.75rem; background: rgba(229, 169, 59, 0.1); border: 1px solid rgba(229, 169, 59, 0.35); border-radius: 8px; color: var(--accent-gold); font-size: 0.88rem; font-weight: 500;';
        notice.textContent = "Tous les créneaux pour cette date sont complets. Cliquez sur un autre jour dans le calendrier ci-dessus pour réserver.";
        slotsContainer.appendChild(notice);
    }

    let renderedCount = 0;

    availableSlots.forEach(time => {
        // Créneau passé (ou trop proche) — gère aussi les jours déjà passés
        const isPastSlot = isSlotPast(selectedDate, time);
        const isBooked = isSlotTaken(time, bookedMap, selectedBarber);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot-btn';

        if (isBooked) {
            btn.classList.add('booked');
            btn.disabled = true;
            btn.innerHTML = `<span>${time}</span> <span style="font-size: 0.75rem; font-weight: 700;">(Complet)</span>`;
        } else if (isPastSlot) {
            btn.classList.add('past');
            btn.disabled = true;
            btn.innerHTML = `<span>${time}</span> <span style="font-size: 0.7rem; opacity: 0.4;">(Passé)</span>`;
        } else {
            btn.textContent = time;
            btn.addEventListener('click', () => {
                openBookingModal(time);
            });
        }

        slotsContainer.appendChild(btn);
        renderedCount++;
    });

    if (renderedCount === 0) {
        slotsContainer.innerHTML = '<div class="slots-empty">Aucun créneau disponible pour cette date.</div>';
    }

    if (window.feather) feather.replace();
}

// Booking Modal Logic
const bookingModal = document.getElementById('booking-modal');
const modalOverlay = document.getElementById('booking-modal-close-overlay');
const modalCloseBtn = document.getElementById('booking-modal-close-btn');
const modalRecap = document.getElementById('modal-slot-recap');
const bookingForm = document.getElementById('booking-form');
const bookingFormStep = document.getElementById('booking-form-step');
const bookingSuccessStep = document.getElementById('booking-success-step');
const successCloseBtn = document.getElementById('booking-success-close-btn');
const bookingError = document.getElementById('booking-error');
const btnSubmitBooking = document.getElementById('btn-submit-booking');
const btnSubmitText = document.getElementById('btn-submit-text');

function openBookingModal(time) {
    if (!bookingModal) return;

    // Règle stricte : 1 seul rendez-vous à la fois pour les clients (le coiffeur connecté peut en prendre plusieurs)
    const isBarberAdmin = !!(authUser && authUser.email);
    if (!isBarberAdmin) {
        const activeBooking = (typeof getActiveClientBooking === 'function') ? getActiveClientBooking() : null;
        if (activeBooking) {
            alert(`Vous avez déjà un rendez-vous réservé le ${activeBooking.dateFull} à ${activeBooking.time} (${activeBooking.service} avec ${activeBooking.barberName}).\n\nPour le confort de tous les clients, un seul rendez-vous à la fois est autorisé sur le site et l'application.\n\nPour modifier ou annuler votre réservation, contactez le salon au 07 49 15 38 55 ou par WhatsApp.`);
            if (typeof renderActiveBookingBanner === 'function') renderActiveBookingBanner();
            const banner = document.getElementById('active-booking-banner');
            if (banner) {
                banner.style.display = 'block';
                banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
    }

    // Vérification immédiate anti-collision : le créneau est-il déjà pris ?
    const latestMap = bookingsCache.get(formatDateISO(selectedDate)) || currentBookedMap;
    if (isSlotTaken(time, latestMap, selectedBarber)) {
        alert("Désolé, ce créneau vient tout juste d'être réservé par un autre client. Veuillez en choisir un autre.");
        renderSlots(latestMap);
        return;
    }

    currentSlotForBooking = {
        dateIso: formatDateISO(selectedDate),
        dateFull: formatDateFull(selectedDate),
        time: time,
        barberChoice: selectedBarber
    };

    if (modalRecap) {
        const withWho = selectedBarber === ANY_BARBER
            ? 'premier coiffeur disponible'
            : `avec ${getBarberName(selectedBarber)}`;
        modalRecap.textContent = `${currentSlotForBooking.dateFull} à ${time} — ${withWho}`;
    }

    // Reset steps
    if (bookingFormStep) bookingFormStep.style.display = 'block';
    if (bookingSuccessStep) bookingSuccessStep.style.display = 'none';
    if (bookingError) bookingError.style.display = 'none';
    if (btnSubmitBooking) btnSubmitBooking.disabled = false;
    if (btnSubmitText) btnSubmitText.textContent = 'Confirmer mon rendez-vous';
    if (addonShampooInput) addonShampooInput.checked = false;
    if (addonShampooWrap && bookingServiceSelect) {
        addonShampooWrap.style.display = bookingServiceSelect.value.startsWith('Shampoing') ? 'none' : 'flex';
    }

    bookingModal.classList.add('show');
    bookingModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const modalCard = bookingModal.querySelector('.booking-modal-card');
    if (modalCard) modalCard.scrollTop = 0;

    // Ne pas auto-focus sur mobile (évite le clavier virtuel qui écrase le modal)
    const nameInput = document.getElementById('booking-name');
    if (nameInput && window.innerWidth > 768) {
        setTimeout(() => nameInput.focus(), 150);
    }

    // Adapter la hauteur du modal au clavier virtuel (iOS Safari / Android Chrome)
    if (window.visualViewport && window.innerWidth <= 768) {
        const onViewportResize = () => {
            if (modalCard) {
                const vvHeight = window.visualViewport.height;
                modalCard.style.maxHeight = Math.min(vvHeight * 0.92, window.innerHeight * 0.92) + 'px';
            }
        };
        window.visualViewport.addEventListener('resize', onViewportResize);
        // Stocker pour cleanup à la fermeture
        bookingModal._vpListener = onViewportResize;
        onViewportResize();
    }

    try {
        if (!history.state || history.state.modal !== 'booking') {
            history.pushState({ modal: 'booking' }, '');
        }
    } catch {}

    if (window.feather) feather.replace();
}

function closeBookingModal(fromHistory = false) {
    if (!bookingModal || !bookingModal.classList.contains('show')) return;
    bookingModal.classList.remove('show');
    bookingModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Nettoyage du listener visualViewport
    if (bookingModal._vpListener && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', bookingModal._vpListener);
        bookingModal._vpListener = null;
    }
    // Réinitialise la hauteur forcée
    const modalCard = bookingModal.querySelector('.booking-modal-card');
    if (modalCard) modalCard.style.maxHeight = '';

    const addonShampoo = document.getElementById('booking-addon-shampoo');
    if (addonShampoo) addonShampoo.checked = false;

    if (!fromHistory && history.state && history.state.modal === 'booking') {
        history.back();
    }
}

// Option Shampoing (+5€) dynamique
const bookingServiceSelect = document.getElementById('booking-service');
const addonShampooWrap = document.getElementById('addon-shampoo-wrap');
const addonShampooInput = document.getElementById('booking-addon-shampoo');
if (bookingServiceSelect && addonShampooWrap) {
    bookingServiceSelect.addEventListener('change', () => {
        if (bookingServiceSelect.value.startsWith('Shampoing')) {
            addonShampooWrap.style.display = 'none';
            if (addonShampooInput) addonShampooInput.checked = false;
        } else {
            addonShampooWrap.style.display = 'flex';
        }
    });
}

if (modalOverlay) modalOverlay.addEventListener('click', closeBookingModal);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeBookingModal);
if (successCloseBtn) successCloseBtn.addEventListener('click', closeBookingModal);

// Submit Booking Form
if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentSlotForBooking) return;

        let serviceVal = document.getElementById('booking-service').value;
        const addonShampoo = document.getElementById('booking-addon-shampoo');
        if (addonShampoo && addonShampoo.checked && !serviceVal.includes('Shampoing')) {
            const priceMatch = serviceVal.match(/\((\d+)€\)/);
            if (priceMatch) {
                const newPrice = parseInt(priceMatch[1], 10) + 5;
                const baseName = serviceVal.split('(')[0].trim();
                serviceVal = `${baseName} + Shampoing (${newPrice}€)`;
            } else {
                serviceVal += ' + Shampoing (+5€)';
            }
        }
        const nameVal = document.getElementById('booking-name').value.trim();
        const phoneVal = document.getElementById('booking-phone').value.trim();
        const noteVal = document.getElementById('booking-note').value.trim();

        if (!nameVal || !phoneVal) {
            showBookingError("Veuillez renseigner votre nom et votre numéro de téléphone.");
            return;
        }

        const cleanPhone = phoneVal.replace(/\D/g, '');
        if (cleanPhone.length < 9) {
            showBookingError("Veuillez renseigner un numéro de téléphone valide (au moins 9 chiffres).");
            return;
        }

        if (!currentSlotForBooking || !currentSlotForBooking.dateIso || !currentSlotForBooking.time) {
            showBookingError("Créneau non sélectionné ou expiré. Veuillez choisir un créneau horaire.");
            return;
        }

        // Le formulaire a pu rester ouvert longtemps : le créneau est-il toujours dans le futur ?
        const [sy, sm, sd] = currentSlotForBooking.dateIso.split('-').map(Number);
        if (isSlotPast(new Date(sy, sm - 1, sd), currentSlotForBooking.time)) {
            showBookingError("Ce créneau est désormais passé. Veuillez en choisir un autre.");
            renderCalendarDays();
            renderSlots(currentBookedMap);
            return;
        }

        // Set Loading State
        if (btnSubmitBooking) btnSubmitBooking.disabled = true;
        if (btnSubmitText) btnSubmitText.textContent = "Réservation en cours...";
        if (bookingError) bookingError.style.display = 'none';

        const resetSubmitBtn = () => {
            if (btnSubmitBooking) btnSubmitBooking.disabled = false;
            if (btnSubmitText) btnSubmitText.textContent = 'Confirmer mon rendez-vous';
        };

        // Données en temps réel (instantanées en mémoire, 0 ms de latence)
        const latestMap = bookingsCache.get(currentSlotForBooking.dateIso) || currentBookedMap;
        const phoneNorm = normalizePhone(phoneVal);
        const phoneHash = (await sha256Hex(phoneNorm)).slice(0, 32);

        const isBarberAdmin = !!(authUser && authUser.email);

        // Règle stricte cross-device pour les clients : 1 seul RDV à la fois par numéro (le coiffeur peut en prendre autant qu'il veut)
        if (!isBarberAdmin) {
            const existingBooking = await checkPhoneHasActiveBooking(phoneVal);
            if (existingBooking) {
                const [ey, em, ed] = existingBooking.date.split('-').map(Number);
                const when = `${formatDateFull(new Date(ey, em - 1, ed))} à ${existingBooking.time}`;
                const waMsg = `Bonjour Barber C L'Hair, je souhaite modifier mon rendez-vous du ${when}.`;
                showBookingError(`
                    <div style="font-weight: 700; margin-bottom: 0.35rem; color: #ffb8b8;">
                        ⚠️ Vous avez déjà un rendez-vous réservé le ${when} !
                    </div>
                    <div style="font-size: 0.82rem; margin-bottom: 0.65rem; color: rgba(255,255,255,0.85); line-height: 1.4;">
                        Prestation : <strong>${escapeHtml(existingBooking.service || 'Coupe')}</strong>.<br>
                        Un seul rendez-vous à la fois est autorisé sur le site et l'application.
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <a href="https://wa.me/33749153855?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
                            Modifier / Annuler via WhatsApp
                        </a>
                        <a href="tel:0749153855" class="btn btn-outline btn-sm" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
                            Appeler le salon
                        </a>
                    </div>
                `, true);
                resetSubmitBtn();
                return;
            }
        }

        // Coiffeurs à essayer, dans l'ordre de préférence
        let candidates = [];
        if (currentSlotForBooking.barberChoice === ANY_BARBER) {
            const first = pickBarberForSlot(currentSlotForBooking.time, latestMap);
            if (first) {
                candidates = [first].concat(getFreeBarbers(currentSlotForBooking.time, latestMap).filter(b => b.id !== first.id));
            }
        } else if (!isSlotTaken(currentSlotForBooking.time, latestMap, currentSlotForBooking.barberChoice)) {
            const b = BARBERS.find(x => x.id === currentSlotForBooking.barberChoice);
            if (b) candidates = [b];
        }

        const slotTakenMsg = "Désolé, ce créneau vient tout juste d'être réservé par un autre client à l'instant. Veuillez choisir un autre horaire ou un autre jour dans le calendrier.";
        if (candidates.length === 0) {
            showBookingError(slotTakenMsg);
            resetSubmitBtn();
            renderSlots(latestMap);
            return;
        }

        if (!db) {
            showBookingError("La réservation en ligne est momentanément indisponible. Merci de réessayer dans un instant ou d'appeler le salon au 07 49 15 38 55.");
            resetSubmitBtn();
            return;
        }

        const showSuccess = (assignedBarber) => {
            document.getElementById('success-datetime').textContent = `${currentSlotForBooking.dateFull} à ${currentSlotForBooking.time}`;
            const successBarber = document.getElementById('success-barber');
            if (successBarber) successBarber.textContent = assignedBarber.name;
            document.getElementById('success-service').textContent = serviceVal;
            document.getElementById('success-client').textContent = `${nameVal} (${phoneVal})`;
            setupCalendarButtons(currentSlotForBooking.dateIso, currentSlotForBooking.time, serviceVal, nameVal, assignedBarber.name);

            // WhatsApp confirmation pour le client
            const waSuccessBtn = document.getElementById('btn-success-whatsapp');
            if (waSuccessBtn) {
                const waDateStr = currentSlotForBooking.dateFull || formatDateFull(selectedDate);
                const waMsg = `Bonjour Barber C L'Hair, je confirme ma réservation pour le ${waDateStr} à ${currentSlotForBooking.time} (${serviceVal}) avec ${assignedBarber.name}. Nom : ${nameVal}.`;
                waSuccessBtn.href = `https://wa.me/33749153855?text=${encodeURIComponent(waMsg)}`;
            }

            if (bookingFormStep) bookingFormStep.style.display = 'none';
            if (bookingSuccessStep) bookingSuccessStep.style.display = 'block';
            bookingForm.reset();

            // Mémorise le rendez-vous actif uniquement pour les clients (pas sur l'appareil du coiffeur)
            if (!isBarberAdmin) {
                saveActiveClientBooking({
                    dateIso: currentSlotForBooking.dateIso,
                    dateFull: currentSlotForBooking.dateFull,
                    time: currentSlotForBooking.time,
                    barberId: assignedBarber.id,
                    barberName: assignedBarber.name,
                    service: serviceVal,
                    clientName: nameVal,
                    clientPhone: phoneVal,
                    clientPhoneNorm: phoneNorm,
                    slotId: `${currentSlotForBooking.dateIso}_${currentSlotForBooking.time.replace(':', '')}_${assignedBarber.id}`,
                    createdAt: new Date().toISOString()
                });
                renderActiveBookingBanner();
            }
            loadSlotsForSelectedDate();

            if (window.feather) feather.replace();

            // Ouverture automatique de l'alerte de rappel sur le téléphone du client
            setTimeout(() => {
                const calBtn = document.getElementById('btn-add-calendar');
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
                if (calBtn && isMobile && !calBtn.classList.contains('btn-reminder-done')) {
                    calBtn.click();
                }
            }, 800);
        };

        // Enregistrement atomique Firebase garanti sans doublon (Transaction ACID)
        const SLOT_TAKEN = 'SLOT_TAKEN';
        const tryBook = async (barber) => {
            const docId = `${currentSlotForBooking.dateIso}_${currentSlotForBooking.time.replace(':', '')}_${barber.id}`;
            const slotPayload = {
                date: currentSlotForBooking.dateIso,
                time: currentSlotForBooking.time,
                barber: barber.id
            };
            const bookingPayload = {
                date: currentSlotForBooking.dateIso,
                time: currentSlotForBooking.time,
                barber: barber.id,
                barberName: barber.name,
                service: serviceVal,
                clientName: nameVal,
                clientPhone: phoneVal,
                clientPhoneNorm: phoneNorm,
                clientNote: noteVal || '',
                createdAt: new Date().toISOString()
            };

            // 1. Transaction atomique Firebase (Garantie anti-collision absolue : impossible que 2 personnes réservent le même créneau)
            if (db) {
                try {
                    const slotRef = db.collection('slots').doc(docId);
                    const bookingRef = db.collection('bookings').doc(docId);
                    const phoneDocId = phoneHash ? `${currentSlotForBooking.dateIso}_${currentSlotForBooking.time.replace(':', '')}_phone_${phoneHash}` : null;
                    const phoneRef = phoneDocId ? db.collection('slots').doc(phoneDocId) : null;
                    const phoneBarberMeta = phoneHash ? ('phone_' + phoneHash + '|' + barber.id + '|' + encodeURIComponent(serviceVal)) : null;

                    await db.runTransaction(async (transaction) => {
                        // 1.1 Vérification de l'existence réelle du créneau en base (autorité serveur)
                        const slotDoc = await transaction.get(slotRef);
                        if (slotDoc.exists) {
                            throw new Error(SLOT_TAKEN);
                        }

                        // 1.2 Vérification du verrou téléphone s'il existe (uniquement pour les clients réguliers)
                        if (phoneRef && !isBarberAdmin) {
                            const phoneDoc = await transaction.get(phoneRef);
                            if (phoneDoc.exists) {
                                throw new Error('PHONE_ALREADY_HAS_BOOKING');
                            }
                        }

                        // 1.3 Écritures atomiques simultanées dans la même transaction
                        transaction.set(slotRef, slotPayload);
                        transaction.set(bookingRef, bookingPayload);
                        if (phoneRef) {
                            transaction.set(phoneRef, {
                                date: currentSlotForBooking.dateIso,
                                time: currentSlotForBooking.time,
                                barber: phoneBarberMeta
                            });
                        }
                    });

                    // Mise à jour de la mémoire locale
                    if (phoneHash && phoneDocId) {
                        activePhoneBookings.set(phoneHash, {
                            date: currentSlotForBooking.dateIso,
                            dateFull: currentSlotForBooking.dateFull,
                            time: currentSlotForBooking.time,
                            barberId: barber.id,
                            barberName: barber.name,
                            service: serviceVal,
                            docId: phoneDocId
                        });
                    }
                    return true;
                } catch (dbErr) {
                    if (dbErr && (dbErr.message === SLOT_TAKEN || dbErr.message === 'PHONE_ALREADY_HAS_BOOKING')) {
                        throw dbErr;
                    }
                    if (dbErr && (dbErr.code === 'permission-denied' || dbErr.message?.includes('permission'))) {
                        throw new Error(SLOT_TAKEN);
                    }
                    console.warn('Transaction directe en échec, bascule sur API REST :', dbErr);
                }
            }

            // 2. Secours via API REST
            const slotOk = await fsCreateDocIn('slots', docId, slotPayload, 4000);
            if (!slotOk) throw new Error(SLOT_TAKEN);
            try {
                const bookOk = await fsCreateDocIn('bookings', docId, bookingPayload, 4000);
                if (!bookOk) throw new Error("BOOKING_FAILED");
            } catch (errBook) {
                // Rollback immédiat : si la réservation échoue, supprimer le créneau pour éviter un créneau fantôme
                try {
                    await fsFetch(`${FS_BASE}/slots/${docId}?key=${firebaseConfig.apiKey}`, { method: 'DELETE' }, 3000);
                } catch (e) {}
                throw errBook;
            }
            if (phoneHash) {
                const phoneDocId = `${currentSlotForBooking.dateIso}_${currentSlotForBooking.time.replace(':', '')}_phone_${phoneHash}`;
                const phoneBarberMeta = 'phone_' + phoneHash + '|' + barber.id + '|' + encodeURIComponent(serviceVal);
                try {
                    await fsCreateDocIn('slots', phoneDocId, {
                        date: currentSlotForBooking.dateIso,
                        time: currentSlotForBooking.time,
                        barber: phoneBarberMeta
                    }, 4000);
                } catch (e) {
                    console.warn('Phone lock slot REST :', e);
                }

                activePhoneBookings.set(phoneHash, {
                    date: currentSlotForBooking.dateIso,
                    dateFull: currentSlotForBooking.dateFull,
                    time: currentSlotForBooking.time,
                    barberId: barber.id,
                    barberName: barber.name,
                    service: serviceVal,
                    docId: phoneDocId
                });
            }
            return true;
        };

        try {
            let booked = null;
            for (const barber of candidates) {
                try {
                    await Promise.race([
                        tryBook(barber),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 4500))
                    ]);
                    booked = barber;
                    break;
                } catch (err) {
                    if (err && err.message === SLOT_TAKEN) continue; // essayer le coiffeur suivant
                    if (err && err.message === 'PHONE_ALREADY_HAS_BOOKING') {
                        throw err;
                    }
                    throw err;
                }
            }

            if (!booked) {
                showBookingError(slotTakenMsg);
                loadSlotsForSelectedDate();
                resetSubmitBtn();
                return;
            }

            saveLocalBooking(currentSlotForBooking.dateIso, currentSlotForBooking.time, booked.id);
            if (!bookingsCache.has(currentSlotForBooking.dateIso)) bookingsCache.set(currentSlotForBooking.dateIso, new Map());
            addToBookedMap(bookingsCache.get(currentSlotForBooking.dateIso), currentSlotForBooking.time, booked.id);
            renderCalendarDays();
            renderSlots(bookingsCache.get(currentSlotForBooking.dateIso) || new Map());
            showSuccess(booked);

            // Déclenchement facultatif de SMS si une passerelle est configurée en local
            const localGw = localStorage.getItem('barber_sms_gateway_url');
            if (localGw) {
                fetch('/api/send-sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'confirmation',
                        phone: phoneVal,
                        clientName: nameVal,
                        dateStr: currentSlotForBooking.dateFull,
                        time: currentSlotForBooking.time,
                        barberName: booked.name,
                        gatewayUrl: localGw
                    })
                }).catch(() => {});
            }
        } catch (err) {
            console.warn("Échec de l'enregistrement de la réservation :", err);
            if (err && err.message === 'PHONE_ALREADY_HAS_BOOKING') {
                showBookingError(`
                    <div style="font-weight: 700; margin-bottom: 0.35rem; color: #ffb8b8;">
                        ⚠️ Vous avez déjà un rendez-vous réservé !
                    </div>
                    <div style="font-size: 0.82rem; color: rgba(255,255,255,0.85); line-height: 1.4;">
                        Un seul rendez-vous à la fois est autorisé sur le site et l'application.
                    </div>
                `, true);
                resetSubmitBtn();
                return;
            }
            showBookingError("Désolé, ce créneau vient tout juste d'être réservé par un autre client à l'instant. Veuillez choisir un autre horaire disponible.");
            loadSlotsForSelectedDate();
            resetSubmitBtn();
        }
    });
}

// ---- Firestore via API REST (rapide et fiable, sans connexion persistante) ----
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

function fsFetch(url, options, timeoutMs) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs || 8000);
    return fetch(url, Object.assign({}, options, { signal: ctrl.signal })).finally(() => clearTimeout(t));
}

function fsToValue(v) {
    if (v instanceof Date) return { timestampValue: v.toISOString() };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (v === null || v === undefined) return { nullValue: null };
    return { stringValue: String(v) };
}

function fsFromFields(fields) {
    const out = {};
    Object.keys(fields || {}).forEach(k => {
        const f = fields[k];
        out[k] = f.stringValue ?? f.integerValue ?? f.doubleValue ?? f.booleanValue ?? f.timestampValue ?? null;
    });
    return out;
}

async function fsQueryEqual(field, value, timeoutMs) {
    const res = await fsFetch(`${FS_BASE}:runQuery?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structuredQuery: {
            from: [{ collectionId: 'slots' }],
            where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } }
        } })
    }, timeoutMs);
    if (!res.ok) throw new Error('Firestore query ' + res.status);
    const rows = await res.json();
    return rows.filter(r => r.document).map(r => fsFromFields(r.document.fields));
}

// Crée un document dans la collection spécifiée (ex: 'slots' ou 'bookings')
async function fsCreateDocIn(collection, docId, data, timeoutMs) {
    const fields = {};
    Object.keys(data).forEach(k => { fields[k] = fsToValue(data[k]); });
    const res = await fsFetch(`${FS_BASE}/${collection}?documentId=${encodeURIComponent(docId)}&key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    }, timeoutMs);
    if (res.status === 409) return false;
    if (!res.ok) throw new Error('Firestore create ' + res.status);
    return true;
}

// Crée le document ; renvoie false si le créneau existe déjà (409)
async function fsCreateDoc(docId, data, timeoutMs) {
    return fsCreateDocIn('bookings', docId, data, timeoutMs);
}

// Normalise un numéro : "+33 6 12..." / "06 12..." / "612..." / "0033..." -> "0612..."
function normalizePhone(phone) {
    let d = String(phone || '').replace(/\D/g, '');
    if (d.startsWith('0033')) d = '0' + d.slice(4);
    else if (d.startsWith('33')) {
        const rest = d.slice(2);
        d = rest.startsWith('0') ? rest : '0' + rest;
    }
    if (d.length === 9 && (d.startsWith('6') || d.startsWith('7') || d.startsWith('1') || d.startsWith('2') || d.startsWith('3') || d.startsWith('4') || d.startsWith('5') || d.startsWith('9'))) {
        d = '0' + d;
    }
    return d;
}

// Implémentation pure JS de SHA-256 standard (FIPS 180-4) pour compatibilité 100% universelle
function sha256Pure(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let result = '';
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = [];
    let k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (let i = candidate * candidate; i < 313; i += candidate) {
                isComposite[i] = true;
            }
            if (primeCounter < 8) {
                hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
            }
            k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            primeCounter++;
        }
    }
    ascii += '\x80';
    while ((ascii.length % 64) - 56) ascii += '\x00';
    for (let i = 0; i < ascii.length; i++) {
        const j = ascii.charCodeAt(i);
        words[i >> 2] |= j << ((3 - (i % 4)) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength | 0;
    for (let j = 0; j < words.length;) {
        const w = words.slice(j, j += 16);
        const oldHash = hash.slice(0);
        for (let i = 0; i < 64; i++) {
            const w15 = w[i - 15], w2 = w[i - 2];
            const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
            const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
            w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
            const s1_maj = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
            const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
            const t2 = (s1_maj + maj) | 0;
            const s1_ch = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
            const ch = (hash[4] & hash[5]) ^ ((~hash[4]) & hash[6]);
            const t1 = (hash[7] + s1_ch + ch + k[i] + w[i]) | 0;
            hash = [(t1 + t2) | 0].concat(hash);
            hash[4] = (hash[4] + t1) | 0;
            hash.pop();
        }
        for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (let i = 0; i < 8; i++) {
        for (let i2 = 3; i2 >= 0; i2--) {
            const b = (hash[i] >> (8 * i2)) & 255;
            result += (b < 16 ? '0' : '') + b.toString(16);
        }
    }
    return result;
}

// Hachage cryptographique sécurisé (SHA-256 standard) identique sur tous les appareils
async function sha256Hex(str) {
    if (typeof window !== 'undefined' && window.crypto && crypto.subtle && window.TextEncoder) {
        try {
            const enc = new TextEncoder().encode(str);
            const buf = await crypto.subtle.digest('SHA-256', enc);
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {}
    }
    return sha256Pure(String(str || ''));
}

// Vérifie si un rendez-vous est déjà passé
function isBookingPast(dateIso, time) {
    const [h, m] = (time || '00:00').split(':').map(Number);
    const [y, mo, d] = (dateIso || '').split('-').map(Number);
    const slotDate = new Date(y, mo - 1, d, h, m, 0, 0);
    return slotDate.getTime() <= Date.now();
}

// ===== Gestion de la règle : 1 seul rendez-vous actif à la fois =====
const CLIENT_BOOKING_KEY = 'barber_client_booking';

function getActiveClientBooking() {
    // Si le coiffeur/salon est connecté, aucune restriction client ne s'applique
    if (authUser && authUser.email) return null;
    try {
        const raw = localStorage.getItem(CLIENT_BOOKING_KEY);
        if (!raw) return null;
        const b = JSON.parse(raw);
        if (!b || !b.dateIso || !b.time) return null;

        // 1. Si le rendez-vous est déjà passé, le verrou expire automatiquement
        if (isBookingPast(b.dateIso, b.time)) {
            localStorage.removeItem(CLIENT_BOOKING_KEY);
            return null;
        }

        // 2. Si le salon a supprimé / annulé ce créneau dans son planning Firebase,
        // le verrou se libère immédiatement et automatiquement
        if (bookingsCacheReady && b.slotId) {
            const dayMap = bookingsCache.get(b.dateIso);
            if (dayMap && (!dayMap.has(b.time) || !dayMap.get(b.time).has(b.barberId))) {
                localStorage.removeItem(CLIENT_BOOKING_KEY);
                return null;
            }
        }

        return b;
    } catch (e) {
        return null;
    }
}

function saveActiveClientBooking(data) {
    try {
        localStorage.setItem(CLIENT_BOOKING_KEY, JSON.stringify(data));
    } catch (e) {}
}

// Vérifie si un numéro de téléphone a déjà un rendez-vous futur actif (cross-device : PC, mobile, appli)
async function checkPhoneHasActiveBooking(phoneVal) {
    // Si le coiffeur/salon est connecté, il peut prendre autant de rendez-vous qu'il souhaite
    if (authUser && authUser.email) return null;

    const phoneNorm = normalizePhone(phoneVal);
    if (!phoneNorm || phoneNorm.length < 9) return null;
    const phoneHash = (await sha256Hex(phoneNorm)).slice(0, 32);

    // 1. Vérification dans les verrous cross-device Firestore (synchronisés en direct en mémoire)
    const remote = activePhoneBookings.get(phoneHash);
    if (remote && !isBookingPast(remote.date, remote.time)) {
        return remote;
    }

    // 2. Vérification locale sur cet appareil (au cas où le cache réseau tarde)
    const local = getActiveClientBooking();
    if (local && (local.clientPhoneNorm === phoneNorm || !phoneVal) && !isBookingPast(local.dateIso, local.time)) {
        return {
            date: local.dateIso,
            dateFull: local.dateFull,
            time: local.time,
            barberId: local.barberId || 'isma',
            barberName: local.barberName || 'Isma',
            service: local.service || 'Coupe',
            clientName: local.clientName || '',
            docId: local.docId || ''
        };
    }

    // 3. Secours direct Firestore /slots (au cas où le snapshot listener n'est pas encore arrivé)
    if (db) {
        try {
            const todayIso = formatDateISO(new Date());
            const snap = await db.collection('slots').where('date', '>=', todayIso).get();
            let found = null;
            snap.forEach(doc => {
                if (found) return;
                const d = doc.data();
                if (!d || !d.date || !d.time) return;
                if (doc.id.includes('_phone_' + phoneHash) || (d.barber && String(d.barber).includes(phoneHash))) {
                    if (!isBookingPast(d.date, d.time)) {
                        let bId = 'isma';
                        let serv = 'Coupe';
                        const bStr = String(d.barber || '');
                        if (bStr.includes('|')) {
                            const parts = bStr.split('|');
                            bId = parts[1] || 'isma';
                            try { serv = decodeURIComponent(parts[2] || ''); } catch (e) { serv = parts[2] || 'Coupe'; }
                        }
                        const [y, m, day] = d.date.split('-').map(Number);
                        found = {
                            date: d.date,
                            dateFull: formatDateFull(new Date(y, m - 1, day)),
                            time: d.time,
                            barberId: bId,
                            barberName: getBarberName(bId),
                            service: serv || 'Coupe',
                            docId: doc.id
                        };
                        activePhoneBookings.set(phoneHash, found);
                    }
                }
            });
            if (found) return found;
        } catch (e) {
            console.warn('Check direct slot error :', e);
        }
    }

    // 4. Secours ultime via API REST /slots (garantit 100% de détection cross-device même sans SDK)
    try {
        const res = await fsFetch(`${FS_BASE}/slots?pageSize=300&key=${firebaseConfig.apiKey}`, {}, 3500);
        if (res.ok) {
            const data = await res.json();
            if (data && data.documents) {
                for (const doc of data.documents) {
                    const name = doc.name || '';
                    const docId = name.split('/').pop() || '';
                    const fields = doc.fields || {};
                    const dDate = fields.date ? fields.date.stringValue : '';
                    const dTime = fields.time ? fields.time.stringValue : '';
                    const dBarber = fields.barber ? fields.barber.stringValue : '';
                    if (!dDate || !dTime) continue;
                    if (docId.includes('_phone_' + phoneHash) || dBarber.includes(phoneHash)) {
                        if (!isBookingPast(dDate, dTime)) {
                            let bId = 'isma';
                            let serv = 'Coupe';
                            if (dBarber.includes('|')) {
                                const parts = dBarber.split('|');
                                bId = parts[1] || 'isma';
                                try { serv = decodeURIComponent(parts[2] || ''); } catch (e) { serv = parts[2] || 'Coupe'; }
                            }
                            const [y, m, day] = dDate.split('-').map(Number);
                            const found = {
                                date: dDate,
                                dateFull: formatDateFull(new Date(y, m - 1, day)),
                                time: dTime,
                                barberId: bId,
                                barberName: getBarberName(bId),
                                service: serv || 'Coupe',
                                docId: docId
                            };
                            activePhoneBookings.set(phoneHash, found);
                            return found;
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.warn('Check REST slot error :', e);
    }

    return null;
}

function renderActiveBookingBanner() {
    const banner = document.getElementById('active-booking-banner');
    if (!banner) return;

    // Si le gérant est connecté au salon (admin), pas de restriction
    if (authUser && authUser.email) {
        banner.style.display = 'none';
        return;
    }

    const b = getActiveClientBooking();
    if (!b) {
        banner.style.display = 'none';
        banner.innerHTML = '';
        return;
    }

    const waMsg = `Bonjour Barber C L'Hair, je souhaite modifier ou annuler mon rendez-vous du ${b.dateFull} à ${b.time}.`;
    banner.innerHTML = `
        <div class="active-booking-card">
            <div class="active-booking-badge">
                <i data-feather="check-circle"></i>
                <span>Votre rendez-vous confirmé</span>
            </div>
            <h4 class="active-booking-time">${escapeHtml(b.dateFull)} à ${escapeHtml(b.time)}</h4>
            <p class="active-booking-desc">${escapeHtml(b.service)} avec ${escapeHtml(b.barberName)}</p>
            <div class="active-booking-limit-note">
                <i data-feather="info"></i>
                <span>Un seul rendez-vous à la fois est autorisé sur le site et l'application.</span>
            </div>
            <div class="active-booking-btns">
                <a href="https://wa.me/33749153855?text=${encodeURIComponent(waMsg)}" class="btn btn-outline btn-sm" target="_blank" rel="noopener">
                    <i data-feather="message-circle"></i> Modifier / Annuler (WhatsApp)
                </a>
                <a href="tel:0749153855" class="btn btn-outline btn-sm">
                    <i data-feather="phone"></i> 07 49 15 38 55
                </a>
                <button type="button" class="btn-clear-booking" id="btn-clear-active-booking" title="Réinitialiser si le rendez-vous a été annulé ou pour faire un test">
                    Libérer cet appareil
                </button>
            </div>
        </div>
    `;
    banner.style.display = 'block';
    if (window.feather) feather.replace();
}

// Clic pour libérer l'appareil (test ou annulation)
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#btn-clear-active-booking');
    if (btn) {
        if (confirm("Réinitialiser le rendez-vous enregistré sur cet appareil ?\n\n(À utiliser si vous avez annulé votre rendez-vous avec le salon ou pour effectuer un test)")) {
            localStorage.removeItem(CLIENT_BOOKING_KEY);
            renderActiveBookingBanner();
            renderSlots(currentBookedMap);
        }
    }
});

function showBookingError(msg, isHtml = false) {
    if (bookingError) {
        if (isHtml) {
            bookingError.innerHTML = msg;
        } else {
            bookingError.textContent = msg;
        }
        bookingError.style.display = 'block';
        if (window.feather) feather.replace();
    }
}

// Formatage automatique du numéro de téléphone en direct (06 12 34 56 78)
const bookingPhoneInput = document.getElementById('booking-phone');
if (bookingPhoneInput) {
    bookingPhoneInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const isInternational = val.trim().startsWith('+');
        const digits = val.replace(/\D/g, '');

        if (isInternational && digits.startsWith('33')) {
            const num = digits.substring(2, 11);
            let formatted = '+33';
            if (num.length > 0) formatted += ' ' + num.substring(0, 1);
            if (num.length > 1) formatted += ' ' + num.substring(1, 3);
            if (num.length > 3) formatted += ' ' + num.substring(3, 5);
            if (num.length > 5) formatted += ' ' + num.substring(5, 7);
            if (num.length > 7) formatted += ' ' + num.substring(7, 9);
            e.target.value = formatted;
        } else {
            const num = digits.substring(0, 10);
            const chunks = [];
            for (let i = 0; i < num.length; i += 2) {
                chunks.push(num.substring(i, i + 2));
            }
            e.target.value = chunks.join(' ');
        }

        if (digits.length >= 10 && (!authUser || !authUser.email)) {
            checkPhoneHasActiveBooking(digits).then(existing => {
                if (existing) {
                    const [ey, em, ed] = existing.date.split('-').map(Number);
                    const when = `${formatDateFull(new Date(ey, em - 1, ed))} à ${existing.time}`;
                    const waMsg = `Bonjour Barber C L'Hair, je souhaite modifier mon rendez-vous du ${when}.`;
                    showBookingError(`
                        <div style="font-weight: 700; margin-bottom: 0.35rem; color: #ffb8b8;">
                            ⚠️ Vous avez déjà un rendez-vous réservé le ${when} !
                        </div>
                        <div style="font-size: 0.82rem; margin-bottom: 0.65rem; color: rgba(255,255,255,0.85); line-height: 1.4;">
                            Prestation : <strong>${escapeHtml(existing.service || 'Coupe')}</strong>.<br>
                            Un seul rendez-vous à la fois est autorisé sur le site et l'application.
                        </div>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <a href="https://wa.me/33749153855?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
                                Modifier / Annuler via WhatsApp
                            </a>
                            <a href="tel:0749153855" class="btn btn-outline btn-sm" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
                                Appeler le salon
                            </a>
                        </div>
                    `, true);
                    const submitBtn = document.getElementById('btn-submit-booking');
                    if (submitBtn) submitBtn.disabled = true;
                } else {
                    if (bookingError && bookingError.innerHTML.includes('Vous avez déjà un rendez-vous')) {
                        bookingError.style.display = 'none';
                        bookingError.innerHTML = '';
                        const submitBtn = document.getElementById('btn-submit-booking');
                        if (submitBtn) submitBtn.disabled = false;
                    }
                }
            }).catch(() => {});
        }
    });
}

// Export Calendrier (Google Calendar, Apple Agenda .ics, Android)
function triggerCalendarExport(dateIso, time, service, clientName, barberName) {
    if (!dateIso || !time) return;
    const [year, month, day] = dateIso.split('-').map(Number);
    const [hour, min] = time.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, hour, min, 0);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min

    const pad = (n) => String(n).padStart(2, '0');
    const formatCalDateUTC = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const startUtcStr = formatCalDateUTC(startDate);
    const endUtcStr = formatCalDateUTC(endDate);

    const barberLine = barberName ? `Coiffeur : ${barberName}` : '';
    const clientLine = clientName ? `Client : ${clientName}\n` : '';
    const title = `Barber C L'Hair — ${service || 'Coupe'}`;
    const location = "33 rue de l'hôtel de ville, 59620 Aulnoye-Aymeries";
    const descPlain = `Rendez-vous Barber C L'Hair\nForfait : ${service || 'Coupe'}\n${barberLine ? barberLine + '\n' : ''}${clientLine}Adresse : 33 rue de l'hôtel de ville, Aulnoye-Aymeries\nTél : 07 49 15 38 55`;

    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);

    if (isAndroid) {
        window.location.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startUtcStr}/${endUtcStr}&details=${encodeURIComponent(descPlain)}&location=${encodeURIComponent(location)}`;
        return;
    }

    if (isIOS) {
        const params = new URLSearchParams({ start: startUtcStr, end: endUtcStr, title, desc: descPlain, loc: location });
        window.location.href = `/api/ics?${params.toString()}`;
        return;
    }

    // Ordinateur : téléchargement du fichier .ics
    const icsEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Barber C L\'Hair//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:barber-${Date.now()}@barberclhair.fr`,
        `DTSTAMP:${formatCalDateUTC(new Date())}`,
        `DTSTART:${startUtcStr}`,
        `DTEND:${endUtcStr}`,
        `SUMMARY:${icsEsc(title)}`,
        `DESCRIPTION:${icsEsc(descPlain)}`,
        `LOCATION:${icsEsc(location)}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Rappel RDV Barber C L\'Hair dans 2h',
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Rappel RDV Barber C L\'Hair dans 1h',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rdv-barber-c-l-hair-${dateIso}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Configuration du bouton Agenda Téléphone (Apple Agenda / Google Calendar / Android) avec rappel 1h avant
function setupCalendarButtons(dateIso, time, service, clientName, barberName) {
    const calBtn = document.getElementById('btn-add-calendar');
    const calText = document.getElementById('btn-add-calendar-text');
    if (!calBtn) return;

    if (calText) calText.textContent = 'Alerte de rappel (sonnera 2h & 1h avant)';
    calBtn.classList.remove('btn-reminder-done');

    calBtn.onclick = (e) => {
        if (e) e.preventDefault();
        if (calText) calText.textContent = '✓ Alerte enregistrée sur votre téléphone !';
        calBtn.classList.add('btn-reminder-done');
        triggerCalendarExport(dateIso, time, service, clientName, barberName);
    };
}

// ==========================================================================
// Module Retrouver mon rendez-vous (par téléphone)
// ==========================================================================
function initBookingLookup() {
    const toggleBtn = document.getElementById('btn-toggle-lookup');
    const lookupCard = document.getElementById('booking-lookup-card');
    const closeBtn = document.getElementById('lookup-close-btn');
    const phoneInput = document.getElementById('lookup-phone-input');
    const doLookupBtn = document.getElementById('btn-do-lookup');
    const resultBox = document.getElementById('lookup-result-box');

    if (!toggleBtn || !lookupCard || !phoneInput) return;

    const toggleOpen = (show) => {
        const isCurrentlyOpen = lookupCard.style.display !== 'none';
        const willOpen = (typeof show === 'boolean') ? show : !isCurrentlyOpen;
        lookupCard.style.display = willOpen ? 'block' : 'none';
        toggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        if (willOpen) {
            // Si l'utilisateur a déjà un rendez-vous mémorisé sur cet appareil, préremplir son numéro
            const local = getActiveClientBooking();
            if (local && local.clientPhoneNorm && !phoneInput.value.trim()) {
                const p = local.clientPhoneNorm;
                if (p.length === 10) {
                    phoneInput.value = `${p.slice(0, 2)} ${p.slice(2, 4)} ${p.slice(4, 6)} ${p.slice(6, 8)} ${p.slice(8, 10)}`;
                } else {
                    phoneInput.value = p;
                }
                performLookup();
            } else {
                phoneInput.focus();
            }
        }
    };

    toggleBtn.addEventListener('click', () => toggleOpen());
    if (closeBtn) closeBtn.addEventListener('click', () => toggleOpen(false));

    // Formatage automatique du numéro en direct dans le champ de recherche
    phoneInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const isInternational = val.trim().startsWith('+');
        const digits = val.replace(/\D/g, '');

        if (isInternational && digits.startsWith('33')) {
            const num = digits.substring(2, 11);
            let formatted = '+33';
            if (num.length > 0) formatted += ' ' + num.substring(0, 1);
            if (num.length > 1) formatted += ' ' + num.substring(1, 3);
            if (num.length > 3) formatted += ' ' + num.substring(3, 5);
            if (num.length > 5) formatted += ' ' + num.substring(5, 7);
            if (num.length > 7) formatted += ' ' + num.substring(7, 9);
            e.target.value = formatted;
        } else {
            const num = digits.substring(0, 10);
            const chunks = [];
            for (let i = 0; i < num.length; i += 2) {
                chunks.push(num.substring(i, i + 2));
            }
            e.target.value = chunks.join(' ');
        }

        // Si le client a tapé ses 10 chiffres, recherche automatique instantanée
        if (digits.length >= 10) {
            performLookup();
        } else if (resultBox) {
            resultBox.style.display = 'none';
            resultBox.innerHTML = '';
        }
    });

    phoneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performLookup();
        }
    });

    if (doLookupBtn) {
        doLookupBtn.addEventListener('click', () => performLookup());
    }

    async function performLookup() {
        if (!resultBox) return;
        const rawVal = phoneInput.value.trim();
        const phoneNorm = normalizePhone(rawVal);

        if (!phoneNorm || phoneNorm.length < 10) {
            resultBox.innerHTML = `
                <div class="lookup-empty-box">
                    <i data-feather="alert-circle"></i>
                    <div class="lookup-empty-text">
                        Veuillez saisir un numéro de téléphone valide à 10 chiffres (ex : 06 12 34 56 78).
                    </div>
                </div>
            `;
            resultBox.style.display = 'block';
            if (window.feather) feather.replace();
            return;
        }

        const phoneHash = (await sha256Hex(phoneNorm)).slice(0, 32);

        // 1. Recherche dans activePhoneBookings (en mémoire Firestore 0ms)
        let booking = activePhoneBookings.get(phoneHash);

        // 2. Si non trouvé en mémoire, vérifier la réservation enregistrée sur cet appareil
        if (!booking) {
            const local = getActiveClientBooking();
            if (local && (local.clientPhoneNorm === phoneNorm) && !isBookingPast(local.dateIso, local.time)) {
                booking = {
                    date: local.dateIso,
                    dateFull: local.dateFull,
                    time: local.time,
                    barberId: local.barberId || 'isma',
                    barberName: local.barberName || 'Isma',
                    service: local.service || 'Coupe',
                    docId: local.docId || ''
                };
            }
        }

        // 3. Secours requête directe Firestore dans /slots si disponible
        if (!booking && db) {
            try {
                const snap = await db.collection('slots')
                    .where('date', '>=', formatDateISO(new Date()))
                    .get();
                snap.forEach(doc => {
                    const d = doc.data();
                    if (!d || !d.date || !d.time) return;
                    if (doc.id.includes('_phone_' + phoneHash) || (d.barber && String(d.barber).includes(phoneHash))) {
                        let bId = 'isma';
                        let serv = 'Coupe';
                        const bStr = String(d.barber || '');
                        if (bStr.includes('|')) {
                            const parts = bStr.split('|');
                            bId = parts[1] || 'isma';
                            try { serv = decodeURIComponent(parts[2] || ''); } catch (e) { serv = parts[2]; }
                        }
                        if (!isBookingPast(d.date, d.time)) {
                            const [y, m, day] = d.date.split('-').map(Number);
                            booking = {
                                date: d.date,
                                dateFull: formatDateFull(new Date(y, m - 1, day)),
                                time: d.time,
                                barberId: bId,
                                barberName: getBarberName(bId),
                                service: serv || 'Coupe',
                                docId: doc.id
                            };
                        }
                    }
                });
            } catch (e) {
                console.warn("Direct slots lookup :", e);
            }
        }

        // 4. Secours via API REST si le client est sur un réseau restreint ou webview
        if (!booking) {
            try {
                const res = await fsFetch(`${FS_BASE}/slots?pageSize=300&key=${firebaseConfig.apiKey}`, {}, 3500);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.documents) {
                        for (const doc of data.documents) {
                            const name = doc.name || '';
                            const docId = name.split('/').pop() || '';
                            const fields = doc.fields || {};
                            const dDate = fields.date ? fields.date.stringValue : '';
                            const dTime = fields.time ? fields.time.stringValue : '';
                            const dBarber = fields.barber ? fields.barber.stringValue : '';
                            if (!dDate || !dTime) continue;
                            if (docId.includes('_phone_' + phoneHash) || dBarber.includes(phoneHash)) {
                                if (!isBookingPast(dDate, dTime)) {
                                    let bId = 'isma';
                                    let serv = 'Coupe';
                                    if (dBarber.includes('|')) {
                                        const parts = dBarber.split('|');
                                        bId = parts[1] || 'isma';
                                        try { serv = decodeURIComponent(parts[2] || ''); } catch (e) { serv = parts[2]; }
                                    }
                                    const [y, m, day] = dDate.split('-').map(Number);
                                    booking = {
                                        date: dDate,
                                        dateFull: formatDateFull(new Date(y, m - 1, day)),
                                        time: dTime,
                                        barberId: bId,
                                        barberName: getBarberName(bId),
                                        service: serv || 'Coupe',
                                        docId: docId
                                    };
                                    break;
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn("REST slots lookup :", e);
            }
        }

        if (booking && !isBookingPast(booking.date, booking.time)) {
            const waMsg = `Bonjour Barber C L'Hair, je vous contacte concernant mon rendez-vous du ${booking.dateFull} à ${booking.time}.`;
            resultBox.innerHTML = `
                <div class="lookup-found-card">
                    <div class="lookup-found-badge">
                        <i data-feather="check-circle"></i>
                        <span>Rendez-vous confirmé</span>
                    </div>
                    <h4 class="lookup-found-time">${escapeHtml(booking.dateFull)} à ${escapeHtml(booking.time)}</h4>
                    <div class="lookup-found-details">
                        <div class="lookup-detail-row">
                            <i data-feather="scissors"></i>
                            <span>Prestation : <strong>${escapeHtml(booking.service || 'Coupe')}</strong></span>
                        </div>
                        <div class="lookup-detail-row">
                            <i data-feather="user-check"></i>
                            <span>Coiffeur : <strong>${escapeHtml(booking.barberName || 'Salon')}</strong></span>
                        </div>
                        <div class="lookup-detail-row">
                            <i data-feather="map-pin"></i>
                            <span>Salon : <strong>Barber C L'Hair — 33 Rue de l'Hôtel de Ville, 59620 Aulnoye-Aymeries</strong></span>
                        </div>
                    </div>
                    <div class="lookup-found-actions">
                        <button type="button" class="btn btn-primary btn-sm" id="btn-lookup-add-cal">
                            <i data-feather="calendar"></i> Ajouter à mon agenda
                        </button>
                        <a href="https://wa.me/33749153855?text=${encodeURIComponent(waMsg)}" class="btn btn-outline btn-sm" target="_blank" rel="noopener">
                            <i data-feather="message-circle"></i> Modifier / Annuler (WhatsApp)
                        </a>
                        <a href="tel:0749153855" class="btn btn-outline btn-sm">
                            <i data-feather="phone"></i> 07 49 15 38 55
                        </a>
                        <a href="https://maps.google.com/?q=Barber+C+L'Hair+33+rue+de+l'hotel+de+ville+59620+Aulnoye-Aymeries" class="btn btn-outline btn-sm" target="_blank" rel="noopener">
                            <i data-feather="navigation"></i> Itinéraire GPS
                        </a>
                    </div>
                </div>
            `;
            const calBtn = resultBox.querySelector('#btn-lookup-add-cal');
            if (calBtn) {
                calBtn.addEventListener('click', () => {
                    triggerCalendarExport(booking.date, booking.time, booking.service, '', booking.barberName);
                });
            }
        } else {
            resultBox.innerHTML = `
                <div class="lookup-empty-box">
                    <i data-feather="info"></i>
                    <div class="lookup-empty-text">
                        Aucun rendez-vous à venir trouvé pour le numéro <strong>${escapeHtml(phoneInput.value)}</strong>.<br>
                        Vous n'avez pas encore réservé ? Choisissez votre créneau ci-dessous dans le calendrier !
                    </div>
                </div>
            `;
        }
        resultBox.style.display = 'block';
        if (window.feather) feather.replace();
    }
}

// ---- Fonctions Rappels SMS & WhatsApp pour le Salon ----
function getSmsUrl(phone, text) {
    const cleanPhone = String(phone || '').replace(/[^\d+]/g, '');
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const sep = isIOS ? '&' : '?';
    return `sms:${cleanPhone}${sep}body=${encodeURIComponent(text || '')}`;
}

function getWhatsAppUrl(phone, text) {
    let clean = String(phone || '').replace(/\D/g, '');
    if (clean.startsWith('0') && clean.length === 10) {
        clean = '33' + clean.slice(1);
    }
    return `https://wa.me/${clean}?text=${encodeURIComponent(text || '')}`;
}

function buildReminderMessage(booking, dateIso) {
    const rawDate = dateIso || booking.date;
    let dateStr = '';
    if (rawDate) {
        const [y, m, d] = String(rawDate).split('-').map(Number);
        if (y && m && d) {
            dateStr = formatDateFull(new Date(y, m - 1, d));
        }
    }
    const barber = getBarberName(booking.barberId || booking.barber);
    const client = (booking.clientName || 'Client').trim();
    const time = booking.time || '';
    const service = booking.service ? ` (${booking.service})` : '';

    return `Bonjour ${client}, petit rappel de votre rendez-vous chez Barber C L'Hair le ${dateStr} à ${time}${service} avec ${barber}.\nAdresse : 33 rue de l'hôtel de ville, 59620 Aulnoye-Aymeries.\nEn cas d'empêchement, merci de prévenir au 07 49 15 38 55. À bientôt !`;
}

// Week Navigation Buttons
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');

// Premier jour réservable de la semaine affichée (jamais un jour passé ou terminé, jamais un lundi)
function getFirstAvailableDay(offset) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = getWeekStartDate(offset);
    const start = new Date(monday > today ? monday : today);
    const candidate = firstBookableDayFrom(start);
    if (weekOffsetOf(candidate) === offset) return candidate;
    // Plus rien de libre cette semaine : on garde le premier jour non passé
    if (start.getDay() === 1) start.setDate(start.getDate() + 1);
    return start;
}

if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
        if (currentWeekOffset > 0) {
            currentWeekOffset--;
            selectedDate = getFirstAvailableDay(currentWeekOffset);
            renderCalendarDays();
            loadSlotsForSelectedDate();
        }
    });
}

if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
        if (currentWeekOffset >= MAX_WEEK_OFFSET) return;
        currentWeekOffset++;
        selectedDate = getFirstAvailableDay(currentWeekOffset);
        renderCalendarDays();
        loadSlotsForSelectedDate();
    });
}

// Close Modal with Escape Key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const shortcutModal = document.getElementById('admin-shortcut-modal');
        if (shortcutModal && shortcutModal.classList.contains('show')) {
            shortcutModal.classList.remove('show');
            shortcutModal.setAttribute('aria-hidden', 'true');
            return;
        }
        closeBookingModal();
        closeAdminModal();
    }
});

/* ==========================================================================
   ADMIN / COIFFEUR PLANNING MODAL
   ========================================================================== */
const adminModal = document.getElementById('admin-modal');
const openAdminBtn = document.getElementById('open-admin-btn');
const adminModalCloseBtn = document.getElementById('admin-modal-close-btn');
const adminModalCloseOverlay = document.getElementById('admin-modal-close-overlay');
const adminAuthBox = document.getElementById('admin-auth-box');
const adminContentBox = document.getElementById('admin-content-box');
const adminBookingsList = document.getElementById('admin-bookings-list');
const adminFilterDate = document.getElementById('admin-filter-date');
const adminRefreshBtn = document.getElementById('admin-refresh-btn');

let authUser = null;

if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(user => {
        authUser = user;
        if (typeof renderActiveBookingBanner === 'function') renderActiveBookingBanner();
        renderSlots(currentBookedMap);
        const logoutBtn = document.getElementById('admin-logout-btn');
        if (user) {
            // Nettoyer tout verrou client sur l'appareil du coiffeur connecté
            try { localStorage.removeItem(CLIENT_BOOKING_KEY); } catch (e) {}
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
            if (adminAuthBox) adminAuthBox.style.display = 'none';
            if (adminContentBox) adminContentBox.style.display = 'block';
            if (adminModal && adminModal.classList.contains('show')) {
                showAdminPlanning();
            }
            // Purge automatique en arrière-plan des anciens créneaux et RDV (> 7 jours)
            purgeOldBookings(7);
            // Réconciliation automatique : supprime tout créneau fantôme dans /slots
            reconcileAllSlotsWithBookings();
        } else {
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (adminAuthBox) adminAuthBox.style.display = 'block';
            if (adminContentBox) adminContentBox.style.display = 'none';
        }
    });
}

function openAdminModal() {
    if (!adminModal) return;
    adminModal.classList.add('show');
    adminModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    try {
        if (!history.state || history.state.modal !== 'admin') {
            history.pushState({ modal: 'admin' }, '');
        }
    } catch {}

    const user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (user) {
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (adminAuthBox) adminAuthBox.style.display = 'none';
        if (adminContentBox) adminContentBox.style.display = 'block';
        showAdminPlanning();
    } else {
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminAuthBox) adminAuthBox.style.display = 'block';
        if (adminContentBox) adminContentBox.style.display = 'none';
    }
    if (window.feather) feather.replace();
}

function closeAdminModal(fromHistory = false) {
    if (!adminModal || !adminModal.classList.contains('show')) return;
    if (unsubscribeAdminPlanning) {
        try { unsubscribeAdminPlanning(); } catch (e) {}
        unsubscribeAdminPlanning = null;
    }
    adminModal.classList.remove('show');
    adminModal.setAttribute('aria-hidden', 'true');
    const shortcutModal = document.getElementById('admin-shortcut-modal');
    if (shortcutModal) {
        shortcutModal.classList.remove('show');
        shortcutModal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';

    if (!fromHistory && history.state && history.state.modal === 'admin') {
        history.back();
    }
}

if (openAdminBtn) openAdminBtn.addEventListener('click', openAdminModal);
if (adminModalCloseBtn) adminModalCloseBtn.addEventListener('click', () => closeAdminModal());
if (adminModalCloseOverlay) adminModalCloseOverlay.addEventListener('click', () => closeAdminModal());

// Boutons Retour au site dans l'Espace Salon
const adminTopBackBtn = document.getElementById('admin-top-back-btn');
const adminBottomBackBtn = document.getElementById('admin-bottom-back-btn');
const adminAuthBackBtn = document.getElementById('admin-auth-back-btn');

if (adminTopBackBtn) adminTopBackBtn.addEventListener('click', () => closeAdminModal());
if (adminBottomBackBtn) adminBottomBackBtn.addEventListener('click', () => closeAdminModal());
if (adminAuthBackBtn) adminAuthBackBtn.addEventListener('click', () => closeAdminModal());

// Navigation par jour dans le planning (◀ jour précédent / jour suivant ▶)
function changeAdminDay(delta) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    // Lundi fermé (1) -> sauter au mardi ou dimanche
    if (d.getDay() === 1) d.setDate(d.getDate() + (delta >= 0 ? 1 : -1));

    selectedDate = d;
    currentWeekOffset = weekOffsetOf(selectedDate);
    renderCalendarDays();
    loadSlotsForSelectedDate();
    showAdminPlanning();
}

const adminPrevDayBtn = document.getElementById('admin-prev-day-btn');
const adminNextDayBtn = document.getElementById('admin-next-day-btn');
if (adminPrevDayBtn) adminPrevDayBtn.addEventListener('click', () => changeAdminDay(-1));
if (adminNextDayBtn) adminNextDayBtn.addEventListener('click', () => changeAdminDay(1));

// Écouteur global pour fermer les modales avec la touche "Retour" du smartphone
window.addEventListener('popstate', () => {
    const shortcutModal = document.getElementById('admin-shortcut-modal');
    if (shortcutModal && shortcutModal.classList.contains('show')) {
        shortcutModal.classList.remove('show');
        shortcutModal.setAttribute('aria-hidden', 'true');
    }
    if (adminModal && adminModal.classList.contains('show')) {
        closeAdminModal(true);
    }
    if (bookingModal && bookingModal.classList.contains('show')) {
        closeBookingModal(true);
    }
});

// Formulaire de connexion sécurisée salon (Firebase Auth)
const adminLoginForm = document.getElementById('admin-login-form');
const adminEmailInput = document.getElementById('admin-email-input');
const adminPasswordInput = document.getElementById('admin-password-input');
const adminLoginError = document.getElementById('admin-login-error');
const adminLoginSubmit = document.getElementById('admin-login-submit');

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (adminEmailInput?.value || '').trim();
        const password = adminPasswordInput?.value || '';
        if (!email || !password) return;

        if (adminLoginSubmit) {
            adminLoginSubmit.disabled = true;
            adminLoginSubmit.innerHTML = '<span>Connexion en cours...</span>';
        }
        if (adminLoginError) adminLoginError.style.display = 'none';

        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                await firebase.auth().signInWithEmailAndPassword(email, password);
                if (adminLoginSubmit) {
                    adminLoginSubmit.disabled = false;
                    adminLoginSubmit.innerHTML = '<span>Connexion Sécurisée</span>';
                }
                try { localStorage.removeItem(CLIENT_BOOKING_KEY); } catch (e) {}
                if (adminEmailInput) adminEmailInput.value = '';
                if (adminPasswordInput) adminPasswordInput.value = '';
                showAdminPlanning();
                purgeOldBookings(7);
                reconcileAllSlotsWithBookings();
            }
        } catch (err) {
            console.error('Erreur login salon :', err);
            if (adminLoginSubmit) {
                adminLoginSubmit.disabled = false;
                adminLoginSubmit.innerHTML = '<span>Connexion Sécurisée</span>';
            }
            if (adminLoginError) {
                adminLoginError.style.display = 'block';
                adminLoginError.textContent = "Email ou mot de passe incorrect.";
            }
        }
    });
}

const adminLogoutBtn = document.getElementById('admin-logout-btn');
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
        if (confirm("Se déconnecter de l'Espace Salon ?")) {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().signOut();
            }
            closeAdminModal();
        }
    });
}

if (adminRefreshBtn) {
    adminRefreshBtn.addEventListener('click', showAdminPlanning);
}

// Filtre par coiffeur dans le planning (Tous / Coiffeur 1 / Coiffeur 2), avec le nombre de RDV
function renderAdminBarberFilter(counts = {}) {
    const container = document.getElementById('admin-barber-filter');
    if (!container) return;
    container.innerHTML = '';
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    const options = [{ id: 'all', name: 'Tous', count: total }]
        .concat(BARBERS.map(b => ({ id: b.id, name: b.name, count: counts[b.id] || 0 })));

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = `admin-filter-${opt.id}`;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', adminBarberFilter === opt.id ? 'true' : 'false');
        btn.className = 'admin-filter-chip' + (adminBarberFilter === opt.id ? ' active' : '');
        btn.innerHTML = `${escapeHtml(opt.name)} <span class="admin-filter-count">${opt.count}</span>`;
        btn.addEventListener('click', () => {
            adminBarberFilter = opt.id;
            showAdminPlanning();
        });
        container.appendChild(btn);
    });
}

let isPurgingOld = false;

/**
 * Nettoyage automatique silencieux de tous les créneaux et réservations passés de plus de 7 jours.
 * - Supprime dans /slots (créneaux publics anonymes et verrous hash téléphone)
 * - Supprime dans /bookings (détails complets des réservations du salon)
 * - Nettoie le cache localStorage des rappels anciens
 */
async function purgeOldBookings(days = 7) {
    if (!db || !authUser || isPurgingOld) return 0;

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);
    threshold.setHours(0, 0, 0, 0);
    const thresholdIso = formatDateISO(threshold);

    isPurgingOld = true;
    let totalDeletedSlots = 0;
    let totalDeletedBookings = 0;

    try {
        // 1. Purge des créneaux dans /slots
        const slotsSnap = await db.collection('slots')
            .where('date', '<=', thresholdIso)
            .get();

        if (!slotsSnap.empty) {
            let batch = db.batch();
            let count = 0;
            for (const doc of slotsSnap.docs) {
                batch.delete(doc.ref);
                count++;
                if (count % 400 === 0) {
                    await batch.commit();
                    batch = db.batch();
                }
            }
            if (count % 400 !== 0) {
                await batch.commit();
            }
            totalDeletedSlots = count;
        }

        // 2. Purge des réservations dans /bookings
        const bookingsSnap = await db.collection('bookings')
            .where('date', '<=', thresholdIso)
            .get();

        if (!bookingsSnap.empty) {
            let batch = db.batch();
            let count = 0;
            for (const doc of bookingsSnap.docs) {
                batch.delete(doc.ref);
                count++;
                if (count % 400 === 0) {
                    await batch.commit();
                    batch = db.batch();
                }
            }
            if (count % 400 !== 0) {
                await batch.commit();
            }
            totalDeletedBookings = count;
        }

        // 3. Nettoyage des clés locales expirées
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('barber_reminder_sent_')) {
                    const val = localStorage.getItem(k);
                    if (val) {
                        const t = new Date(val).getTime();
                        if (Date.now() - t > 14 * 86400000) {
                            localStorage.removeItem(k);
                        }
                    }
                }
            }
        } catch (_) {}

        const total = totalDeletedSlots + totalDeletedBookings;
        if (total > 0) {
            console.log(`[Purge auto] ${totalDeletedSlots} slots et ${totalDeletedBookings} bookings supprimés (date <= ${thresholdIso}).`);
        }
        return total;
    } catch (err) {
        console.warn('[Purge auto] Erreur :', err);
        return 0;
    } finally {
        isPurgingOld = false;
    }
}

// Purge automatique récurrente toutes les heures si la page reste ouverte
setInterval(() => {
    if (authUser) {
        purgeOldBookings(7);
        reconcileAllSlotsWithBookings();
    }
}, 1800000);

let isReconciling = false;

/**
 * Réconciliation automatique complète :
 * Parcourt tous les créneaux dans /slots à partir d'aujourd'hui et supprime immédiatement tout créneau fantôme
 * qui n'existe pas dans les réservations réelles du salon (/bookings).
 */
async function reconcileAllSlotsWithBookings() {
    if (!db || !authUser || !authUser.email || isReconciling) return 0;
    isReconciling = true;

    try {
        const todayIso = formatDateISO(new Date());

        // 1. Récupérer toutes les vraies réservations futures
        const bookingsSnap = await db.collection('bookings')
            .where('date', '>=', todayIso)
            .get();

        const validBookingIds = new Set();
        const validDateTimeBarbers = new Set();
        const validPhoneSlotIds = new Set();

        for (const doc of bookingsSnap.docs) {
            validBookingIds.add(doc.id);
            const b = doc.data();
            if (b && b.date && b.time) {
                validDateTimeBarbers.add(`${b.date}_${(b.time || '').replace(':', '')}_${b.barberId || b.barber || 'isma'}`);
                validDateTimeBarbers.add(`${b.date}_${b.time}_${b.barberId || b.barber || 'isma'}`);
                if (b.clientPhone) {
                    const pNorm = normalizePhone(b.clientPhone);
                    if (pNorm) {
                        const h = await sha256Hex(pNorm);
                        const pHash = h.slice(0, 32);
                        validPhoneSlotIds.add(`${b.date}_${b.time.replace(':', '')}_phone_${pHash}`);
                    }
                }
            }
        }

        // 2. Récupérer tous les créneaux dans /slots
        const slotsSnap = await db.collection('slots')
            .where('date', '>=', todayIso)
            .get();

        let batch = db.batch();
        let deleteCount = 0;

        for (const doc of slotsSnap.docs) {
            const sId = doc.id;
            let isGhost = false;

            if (sId.includes('_phone_')) {
                // Verrou test ou orphelin
                if (sId.includes('test') || !validPhoneSlotIds.has(sId)) {
                    isGhost = true;
                }
            } else {
                // Créneau coiffeur : s'il n'existe pas dans les vraies réservations bookings, c'est un créneau fantôme !
                if (!validBookingIds.has(sId) && !validDateTimeBarbers.has(sId)) {
                    isGhost = true;
                }
            }

            if (isGhost) {
                batch.delete(doc.ref);
                deleteCount++;
                console.warn(`[Auto-Clean] Créneau fantôme supprimé : ${sId}`);
                if (deleteCount % 400 === 0) {
                    await batch.commit();
                    batch = db.batch();
                }
            }
        }

        if (deleteCount % 400 !== 0) {
            await batch.commit();
        }

        if (deleteCount > 0) {
            console.log(`[Auto-Clean] ${deleteCount} créneau(x) fantôme(s) libéré(s) avec succès.`);
            loadSlotsForSelectedDate();
        }
        return deleteCount;
    } catch (err) {
        console.warn('[Auto-Clean] Erreur réconciliation slots/bookings :', err);
        return 0;
    } finally {
        isReconciling = false;
    }
}

let unsubscribeAdminPlanning = null;

async function showAdminPlanning() {
    if (adminAuthBox) adminAuthBox.style.display = 'none';
    if (adminContentBox) adminContentBox.style.display = 'block';

    // Purge automatique silencieuse des créneaux et réservations de plus de 7 jours
    purgeOldBookings(7);
    reconcileAllSlotsWithBookings();

    const selectedIso = formatDateISO(selectedDate);
    if (adminFilterDate) {
        adminFilterDate.textContent = formatDateFull(selectedDate);
    }

    if (!adminBookingsList) return;

    if (unsubscribeAdminPlanning) {
        try { unsubscribeAdminPlanning(); } catch (e) {}
        unsubscribeAdminPlanning = null;
    }

    if (db) {
        adminBookingsList.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 1.5rem;">Chargement des rendez-vous en direct...</div>';
        try {
            unsubscribeAdminPlanning = db.collection('bookings')
                .where('date', '==', selectedIso)
                .onSnapshot(async (snap) => {
                    const allBookings = [];
                    snap.forEach(doc => {
                        const data = doc.data();
                        allBookings.push({ id: doc.id, ...data, barberId: bookingBarberId(data) });
                    });

            // Auto-sync des réservations vers les slots publics anonymes
            if (allBookings.length > 0) {
                const batch = db.batch();
                let hasBatch = false;
                for (const b of allBookings) {
                    if (b.id && b.date && b.time) {
                        const slotRef = db.collection('slots').doc(b.id);
                        batch.set(slotRef, {
                            date: b.date,
                            time: b.time,
                            barber: b.barberId || 'isma'
                        }, { merge: true });
                        hasBatch = true;
                    }
                    if (b.clientPhone && b.date && b.time && !isBookingPast(b.date, b.time)) {
                        const pNorm = normalizePhone(b.clientPhone);
                        if (pNorm) {
                            const pHash = (await sha256Hex(pNorm)).slice(0, 32);
                            const pDocId = `${b.date}_${b.time.replace(':', '')}_phone_${pHash}`;
                            const pBarberMeta = 'phone_' + pHash + '|' + (b.barberId || 'isma') + '|' + encodeURIComponent(b.service || 'Coupe');
                            batch.set(db.collection('slots').doc(pDocId), {
                                date: b.date,
                                time: b.time,
                                barber: pBarberMeta
                            }, { merge: true });
                            hasBatch = true;
                        }
                    }
                }
                if (hasBatch) {
                    try {
                        await batch.commit();
                    } catch (e) {
                        console.warn('Sync batch slots :', e);
                    }
                }
            }

            // Nettoyage immédiat des créneaux fantômes pour la journée sélectionnée
            try {
                const daySlotsSnap = await db.collection('slots')
                    .where('date', '==', selectedIso)
                    .get();

                const validBookingIds = new Set(allBookings.map(b => b.id));
                const validDateTimeBarbers = new Set();
                const validPhoneSlotIds = new Set();
                for (const b of allBookings) {
                    validDateTimeBarbers.add(`${b.date}_${(b.time || '').replace(':', '')}_${b.barberId || 'isma'}`);
                    validDateTimeBarbers.add(`${b.date}_${b.time}_${b.barberId || 'isma'}`);
                    if (b.clientPhone && b.date && b.time) {
                        const pNorm = normalizePhone(b.clientPhone);
                        if (pNorm) {
                            const pHash = (await sha256Hex(pNorm)).slice(0, 32);
                            validPhoneSlotIds.add(`${b.date}_${b.time.replace(':', '')}_phone_${pHash}`);
                        }
                    }
                }

                let deleteBatch = db.batch();
                let hasDeletes = false;
                daySlotsSnap.forEach(doc => {
                    const sId = doc.id;
                    if (sId.includes('_phone_')) {
                        if (sId.includes('test') || !validPhoneSlotIds.has(sId)) {
                            deleteBatch.delete(doc.ref);
                            hasDeletes = true;
                        }
                    } else {
                        if (!validBookingIds.has(sId) && !validDateTimeBarbers.has(sId)) {
                            deleteBatch.delete(doc.ref);
                            hasDeletes = true;
                        }
                    }
                });
                if (hasDeletes) {
                    await deleteBatch.commit();
                    console.log(`[Sync] Créneaux fantômes nettoyés pour le ${selectedIso}`);
                    if (bookingsCache.has(selectedIso)) {
                        const dMap = bookingsCache.get(selectedIso);
                        if (dMap) {
                            dMap.clear();
                            allBookings.forEach(ab => {
                                addToBookedMap(dMap, ab.time, ab.barberId);
                            });
                        }
                    }
                    renderCalendarDays();
                    renderSlots(bookingsCache.get(selectedIso) || new Map());
                }
            } catch (syncErr) {
                console.warn('Erreur nettoyage slots fantômes du jour :', syncErr);
            }

            const counts = {};
            allBookings.forEach(b => { counts[b.barberId] = (counts[b.barberId] || 0) + 1; });
            renderAdminBarberFilter(counts);

            // Calcul KPIs du jour
            const kpiCount = document.getElementById('kpi-count');
            const kpiRevenue = document.getElementById('kpi-revenue');
            const kpiBarbers = document.getElementById('kpi-barbers');
            if (kpiCount) kpiCount.textContent = allBookings.length;
            if (kpiRevenue) {
                const totalRev = allBookings.reduce((sum, b) => {
                    const m = (b.service || '').match(/(\d+)\s*€/);
                    return sum + (m ? parseInt(m[1], 10) : 14);
                }, 0);
                kpiRevenue.textContent = `${totalRev} €`;
            }
            if (kpiBarbers) {
                const parts = [];
                BARBERS.forEach(b => {
                    const c = counts[b.id] || 0;
                    parts.push(`${b.name} : ${c}`);
                });
                kpiBarbers.textContent = parts.join(' • ') || '-';
            }

            // Bouton Rappel Groupé SMS iPhone
            const remindBtn = document.getElementById('admin-remind-tomorrow-btn');
            const remindBtnText = document.getElementById('admin-remind-tomorrow-text');
            if (remindBtn) {
                const pendingReminders = allBookings.filter(b => {
                    const hasPhone = !!(b.clientPhone && String(b.clientPhone).replace(/\D/g, '').length >= 9);
                    const alreadySent = !!localStorage.getItem(`barber_reminder_sent_${b.id}`);
                    return hasPhone && !alreadySent;
                });

                if (remindBtnText) {
                    if (pendingReminders.length > 0) {
                        remindBtnText.textContent = `📢 Rappeler les clients (${pendingReminders.length} SMS iPhone)`;
                        remindBtn.style.opacity = '1';
                    } else {
                        remindBtnText.textContent = `✓ Tous les rappels envoyés pour ce jour`;
                        remindBtn.style.opacity = '0.75';
                    }
                }

                remindBtn.onclick = () => {
                    if (pendingReminders.length === 0) {
                        alert(`Tous les clients avec téléphone pour le ${formatDateFull(selectedDate)} ont déjà été rappelés.`);
                        return;
                    }

                    const names = pendingReminders.map(b => `• ${b.time} - ${b.clientName} (${b.clientPhone})`).join('\n');
                    const confirmMsg = `Envoyer le rappel SMS automatique à ${pendingReminders.length} client(s) pour le ${formatDateFull(selectedDate)} via votre iPhone ?\n\n${names}`;
                    
                    if (!confirm(confirmMsg)) return;

                    // Construction du payload pour le Raccourci Apple
                    // Format : TEL;;MESSAGE---TEL;;MESSAGE
                    const entries = pendingReminders.map(b => {
                        const cleanPhone = String(b.clientPhone).replace(/\D/g, '');
                        const msg = buildReminderMessage(b, selectedIso);
                        return `${cleanPhone};;${msg}`;
                    });
                    const payload = entries.join('---');

                    // Marquer comme envoyé
                    pendingReminders.forEach(b => {
                        const reminderKey = `barber_reminder_sent_${b.id}`;
                        localStorage.setItem(reminderKey, new Date().toISOString());
                        if (db) {
                            db.collection('bookings').doc(b.id).set({
                                reminderSent: true,
                                reminderSentAt: new Date().toISOString()
                            }, { merge: true }).catch(() => {});
                        }
                    });

                    // Rafraîchir l'affichage du planning
                    showAdminPlanning();

                    // Déclenchement du Raccourci Apple sur iOS
                    const shortcutUrl = `shortcuts://run-shortcut?name=RappelsBarber&input=text&text=${encodeURIComponent(payload)}`;
                    window.location.href = shortcutUrl;
                };
            }

            // Bouton et Modal Aide Raccourci iPhone
            const shortcutHelpBtn = document.getElementById('admin-shortcut-help-btn');
            const shortcutModal = document.getElementById('admin-shortcut-modal');
            const shortcutCloseBtn = document.getElementById('admin-shortcut-close-btn');
            const shortcutOverlay = document.getElementById('admin-shortcut-modal-overlay');
            const shortcutOkBtn = document.getElementById('admin-shortcut-modal-ok-btn');

            const closeShortcutModal = () => {
                if (shortcutModal) {
                    shortcutModal.classList.remove('show');
                    shortcutModal.setAttribute('aria-hidden', 'true');
                }
            };
            const openShortcutModal = () => {
                if (shortcutModal) {
                    shortcutModal.classList.add('show');
                    shortcutModal.setAttribute('aria-hidden', 'false');
                    if (window.feather) feather.replace();
                }
            };

            if (shortcutHelpBtn) shortcutHelpBtn.onclick = openShortcutModal;
            if (shortcutCloseBtn) shortcutCloseBtn.onclick = closeShortcutModal;
            if (shortcutOverlay) shortcutOverlay.onclick = closeShortcutModal;
            if (shortcutOkBtn) shortcutOkBtn.onclick = closeShortcutModal;

            const toggleDayBtn = document.getElementById('admin-toggle-day-btn');
            const toggleDayText = document.getElementById('admin-toggle-day-text');
            const isDayClosed = closedDays.has(selectedIso);
            if (toggleDayBtn && toggleDayText) {
                if (isDayClosed) {
                    toggleDayBtn.classList.add('day-closed');
                    toggleDayText.textContent = '✅ Réouvrir ce jour';
                    toggleDayBtn.style.color = '#4ade80';
                    toggleDayBtn.style.borderColor = 'rgba(74, 222, 128, 0.4)';
                } else {
                    toggleDayBtn.classList.remove('day-closed');
                    toggleDayText.textContent = '🚫 Fermer ce jour';
                    toggleDayBtn.style.color = '#ff8787';
                    toggleDayBtn.style.borderColor = 'rgba(255, 107, 107, 0.4)';
                }

                toggleDayBtn.onclick = async () => {
                    if (isDayClosed) {
                        if (confirm(`Réouvrir les réservations pour le ${formatDateFull(selectedDate)} ?`)) {
                            closedDays.delete(selectedIso);
                            if (db) {
                                try { await db.collection('closures').doc(selectedIso).delete(); } catch(e){}
                            }
                            showAdminPlanning();
                            loadSlotsForSelectedDate();
                        }
                    } else {
                        if (confirm(`Bloquer le salon le ${formatDateFull(selectedDate)} ? Aucun client ne pourra réserver sur cette date.`)) {
                            closedDays.add(selectedIso);
                            if (db) {
                                try { await db.collection('closures').doc(selectedIso).set({ closedAt: new Date().toISOString() }); } catch(e){}
                            }
                            showAdminPlanning();
                            loadSlotsForSelectedDate();
                        }
                    }
                };
            }

            const bookings = adminBarberFilter === 'all'
                ? allBookings
                : allBookings.filter(b => b.barberId === adminBarberFilter);

            // Sort by time, then by barber
            bookings.sort((a, b) => (a.time || '').localeCompare(b.time || '') || a.barberId.localeCompare(b.barberId));

            if (bookings.length === 0) {
                const who = adminBarberFilter === 'all' ? '' : ` pour ${escapeHtml(getBarberName(adminBarberFilter))}`;
                adminBookingsList.innerHTML = `<div style="text-align: center; color: var(--text-light); padding: 1.5rem; font-style: italic;">Aucun rendez-vous enregistré${who} pour cette journée.</div>`;
                return;
            }

            // Détection automatique des doublons / conflits d'horaires
            const duplicateTimesSet = new Set();
            const timeMap = new Map();
            bookings.forEach(b => {
                const k = `${b.time}_${b.barberId}`;
                if (timeMap.has(k)) {
                    duplicateTimesSet.add(b.time);
                }
                timeMap.set(k, true);
            });

            adminBookingsList.innerHTML = '';

            // Si doublons détectés, bandeau d'alerte bien visible en haut
            if (duplicateTimesSet.size > 0) {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'admin-conflict-banner';
                alertDiv.style.cssText = 'background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 12px; padding: 0.9rem 1.15rem; margin-bottom: 1.15rem; color: #fca5a5; font-size: 0.88rem; display: flex; align-items: center; gap: 0.75rem; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.15);';
                alertDiv.innerHTML = `
                    <i data-feather="alert-triangle" style="width: 22px; height: 22px; flex-shrink: 0; stroke: #ef4444;"></i>
                    <div style="line-height: 1.45;">
                        <strong style="color: #fff; display: block; margin-bottom: 0.15rem;">⚠️ Conflit d'horaire détecté !</strong>
                        Plusieurs réservations ont été enregistrées pour le(s) même(s) créneau(x) : <strong>${Array.from(duplicateTimesSet).join(', ')}</strong>.<br>
                        Vous pouvez contacter l'un des clients par téléphone ou WhatsApp pour décaler son horaire.
                    </div>
                `;
                adminBookingsList.appendChild(alertDiv);
            }

            bookings.forEach(b => {
                const barberName = getBarberName(b.barberId);
                const barberIndex = Math.max(0, BARBERS.findIndex(x => x.id === b.barberId));
                const isConflict = duplicateTimesSet.has(b.time);
                const item = document.createElement('div');
                item.className = `admin-booking-item barber-accent-${barberIndex}`;
                if (isConflict) {
                    item.style.borderColor = '#ef4444';
                    item.style.boxShadow = '0 0 16px rgba(239, 68, 68, 0.2)';
                }

                const reminderKey = `barber_reminder_sent_${b.id}`;
                const alreadySent = !!localStorage.getItem(reminderKey);
                const reminderMsg = buildReminderMessage(b, selectedIso);
                const gReviewMsg = `Bonjour ${(b.clientName || 'Client').trim()}, merci pour votre visite chez Barber C L'Hair ! Si votre coupe vous plaît, un petit avis 5 étoiles sur Google nous aide énormément : https://maps.google.com/?q=Barber+c+l%27hair+33+rue+de+l%27hotel+de+ville+59620+Aulnoye-Aymeries . À bientôt !`;
                const hasPhone = !!(b.clientPhone && String(b.clientPhone).replace(/\D/g, '').length >= 9);
                const smsUrl = hasPhone ? getSmsUrl(b.clientPhone, reminderMsg) : '#';
                const waUrl = hasPhone ? getWhatsAppUrl(b.clientPhone, reminderMsg) : '#';
                const gReviewSmsUrl = hasPhone ? getSmsUrl(b.clientPhone, gReviewMsg) : '#';

                item.innerHTML = `
                    <div class="admin-booking-top-bar">
                        <div class="admin-booking-badges">
                            <span class="admin-booking-time-pill" title="Heure du rendez-vous">
                                <i data-feather="clock"></i>
                                <span>${escapeHtml(b.time || '')}</span>
                            </span>
                            ${isConflict ? `
                                <span class="admin-booking-conflict-pill" style="background: rgba(239, 68, 68, 0.25); border: 1px solid #ef4444; color: #fca5a5; padding: 0.2rem 0.55rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem;">
                                    <i data-feather="alert-triangle" style="width: 12px; height: 12px; stroke: #ef4444;"></i>
                                    <span>Conflit horaire</span>
                                </span>
                            ` : ''}
                            <span class="admin-booking-barber-pill barber-color-${barberIndex}">
                                <span>👤 ${escapeHtml(barberName)}</span>
                            </span>
                            <span class="admin-booking-service-pill">
                                <span>✂️ ${escapeHtml(b.service || 'Coupe')}</span>
                            </span>
                        </div>
                        <button type="button" class="admin-cancel-btn" title="Annuler et supprimer ce rendez-vous">
                            <i data-feather="trash-2"></i>
                            <span>Supprimer</span>
                        </button>
                    </div>

                    <div class="admin-booking-client-info">
                        <div class="admin-booking-client-main">
                            <div class="admin-client-avatar">
                                <i data-feather="user"></i>
                            </div>
                            <div class="admin-client-texts">
                                <div class="admin-booking-client-name">${escapeHtml(b.clientName || 'Client')}</div>
                                ${hasPhone ? `
                                    <a href="tel:${escapeHtml(b.clientPhone)}" class="admin-client-phone-link" title="Appeler le client">
                                        <i data-feather="phone"></i>
                                        <span>${escapeHtml(b.clientPhone)}</span>
                                    </a>
                                ` : `<span class="admin-client-no-phone"><i data-feather="phone-off"></i> Numéro non renseigné</span>`}
                            </div>
                        </div>
                        ${formatCreatedAt(b.createdAt) ? `
                            <div class="admin-booking-created-badge" title="Date d'enregistrement de la réservation">
                                <i data-feather="calendar"></i>
                                <span>Pris le ${formatCreatedAt(b.createdAt)}</span>
                            </div>
                        ` : ''}
                    </div>

                    ${b.clientNote ? `
                        <div class="admin-booking-note-box">
                            <i data-feather="message-circle"></i>
                            <span><strong>Note :</strong> ${escapeHtml(b.clientNote)}</span>
                        </div>
                    ` : ''}

                    ${hasPhone ? `
                        <div class="admin-booking-actions-bar">
                            <a href="${escapeHtml(smsUrl)}" class="admin-action-btn admin-action-sms ${alreadySent ? 'sent' : ''}" title="Ouvrir le SMS de rappel pré-rempli sur votre téléphone">
                                <i data-feather="message-square"></i>
                                <span class="sms-label">${alreadySent ? '✓ SMS préparé' : '💬 Rappel SMS'}</span>
                            </a>
                            <a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener" class="admin-action-btn admin-action-wa" title="Envoyer par WhatsApp">
                                <i data-feather="send"></i>
                                <span>WhatsApp</span>
                            </a>
                            <a href="${escapeHtml(gReviewSmsUrl)}" class="admin-action-btn admin-action-review" title="Envoyer une demande d'avis 5 étoiles Google par SMS">
                                <i data-feather="star"></i>
                                <span>⭐ Avis Google</span>
                            </a>
                        </div>
                    ` : ''}
                `;

                if (hasPhone) {
                    const smsLink = item.querySelector('.admin-action-sms');
                    if (smsLink) {
                        smsLink.addEventListener('click', () => {
                            localStorage.setItem(reminderKey, new Date().toISOString());
                            smsLink.classList.add('sent');
                            const label = smsLink.querySelector('.sms-label');
                            if (label) label.textContent = '✓ SMS préparé';
                        });
                    }
                }

                const cancelBtn = item.querySelector('.admin-cancel-btn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', async () => {
                        if (confirm(`Annuler le rendez-vous de ${b.clientName} à ${b.time} (${barberName}) ?`)) {
                            // 1. Suppression du document dans /bookings
                            await db.collection('bookings').doc(b.id).delete();

                            // 2. Suppression de TOUS les documents de créneau dans /slots (coiffeur + verrous téléphone)
                            try {
                                const sameTimeSlots = await db.collection('slots')
                                    .where('date', '==', b.date)
                                    .where('time', '==', b.time)
                                    .get();
                                const sBatch = db.batch();
                                sameTimeSlots.forEach(sDoc => sBatch.delete(sDoc.ref));
                                sBatch.delete(db.collection('slots').doc(b.id));
                                const stdSlotId = `${b.date}_${(b.time || '').replace(':', '')}_${b.barberId || 'isma'}`;
                                sBatch.delete(db.collection('slots').doc(stdSlotId));
                                if (b.clientPhone) {
                                    const pNorm = normalizePhone(b.clientPhone);
                                    if (pNorm) {
                                        const pHash = (await sha256Hex(pNorm)).slice(0, 32);
                                        const pDocId = `${b.date}_${b.time.replace(':', '')}_phone_${pHash}`;
                                        sBatch.delete(db.collection('slots').doc(pDocId));
                                        activePhoneBookings.delete(pHash);
                                    }
                                }
                                await sBatch.commit();
                            } catch (slotErr) {
                                console.warn('Erreur suppression slots lors de l\'annulation :', slotErr);
                            }

                            // 3. Libération immédiate des caches en mémoire pour rendre le créneau disponible en 0 ms
                            if (bookingsCache.has(b.date)) {
                                const dMap = bookingsCache.get(b.date);
                                if (dMap) {
                                    dMap.delete(b.time);
                                }
                            }
                            if (currentBookedMap && formatDateISO(selectedDate) === b.date) {
                                currentBookedMap.delete(b.time);
                            }

                            // 4. Nettoyage de la clé locale du jour
                            try {
                                const lKey = `barber_bookings_${b.date}`;
                                const stored = localStorage.getItem(lKey);
                                if (stored) {
                                    const remaining = JSON.parse(stored).filter(entry => {
                                        const [t] = String(entry).split('|');
                                        return t !== b.time;
                                    });
                                    localStorage.setItem(lKey, JSON.stringify(remaining));
                                }
                            } catch (_) {}

                            // 5. Nettoyage du verrou de réservation client si c'était cet appareil
                            try {
                                const activeB = getActiveClientBooking();
                                if (activeB && activeB.dateIso === b.date && activeB.time === b.time) {
                                    localStorage.removeItem(CLIENT_BOOKING_KEY);
                                }
                            } catch (_) {}

                            localStorage.removeItem(reminderKey);

                            // 6. Rafraîchissement direct de l'affichage planning et du calendrier public
                            showAdminPlanning();
                            renderCalendarDays();
                            renderActiveBookingBanner();
                            renderSlots(bookingsCache.get(formatDateISO(selectedDate)) || new Map());
                        }
                    });
                }

                adminBookingsList.appendChild(item);
            });
            if (window.feather) feather.replace();
        }, (err) => {
            console.error("Erreur écouteur réservations:", err);
            const local = getLocalBookings(selectedIso);
            if (local && local.size > 0) {
                renderAdminLocalBookings(local);
            } else {
                adminBookingsList.innerHTML = `<div style="color: #ff6b6b; padding: 1rem;">Erreur de chargement en direct : ${escapeHtml(err.message)}</div>`;
            }
        });
    } catch (e) {
        console.error("Erreur de chargement des réservations:", e);
        const local = getLocalBookings(selectedIso);
        if (local && local.size > 0) {
            renderAdminLocalBookings(local);
        } else {
            adminBookingsList.innerHTML = `<div style="color: #ff6b6b; padding: 1rem;">Erreur de chargement en ligne : ${escapeHtml(e.message)}</div>`;
        }
    }
    } else {
        const local = getLocalBookings(selectedIso);
        if (local && local.size > 0) {
            renderAdminLocalBookings(local);
        } else {
            adminBookingsList.innerHTML = '<div style="color: var(--text-light); padding: 1rem;">Aucun rendez-vous local pour cette date.</div>';
        }
    }
}

function renderAdminLocalBookings(localMap) {
    if (!adminBookingsList) return;
    const entries = [];
    localMap.forEach((barberSet, time) => {
        barberSet.forEach(barberId => {
            if (adminBarberFilter === 'all' || adminBarberFilter === barberId) entries.push({ time, barberId });
        });
    });
    entries.sort((a, b) => a.time.localeCompare(b.time) || a.barberId.localeCompare(b.barberId));
    adminBookingsList.innerHTML = '<div style="padding: 0.5rem; font-size: 0.8rem; color: var(--accent-gold); font-style: italic;">Rendez-vous enregistrés sur cet appareil :</div>';
    entries.forEach(({ time, barberId }) => {
        const barberIndex = Math.max(0, BARBERS.findIndex(x => x.id === barberId));
        const item = document.createElement('div');
        item.className = `admin-booking-item barber-accent-${barberIndex}`;
        item.innerHTML = `
            <div class="admin-booking-top-bar">
                <div class="admin-booking-badges">
                    <span class="admin-booking-time-pill" title="Heure du créneau">
                        <i data-feather="clock"></i>
                        <span>${escapeHtml(time)}</span>
                    </span>
                    <span class="admin-booking-barber-pill barber-color-${barberIndex}">
                        <span>👤 ${escapeHtml(getBarberName(barberId))}</span>
                    </span>
                    <span class="admin-booking-service-pill">
                        <span>✂️ Créneau réservé</span>
                    </span>
                </div>
            </div>
            <div class="admin-booking-client-info">
                <div class="admin-booking-client-main">
                    <div class="admin-client-avatar"><i data-feather="user"></i></div>
                    <div class="admin-client-texts">
                        <div class="admin-booking-client-name">Créneau bloqué</div>
                        <span class="admin-client-no-phone">Enregistrement local (hors-ligne)</span>
                    </div>
                </div>
            </div>
        `;
        adminBookingsList.appendChild(item);
    });
    if (window.feather) feather.replace();
}

// Format de la date de prise de RDV (ex: "23/10/2026 à 12h05")
function formatCreatedAt(val) {
    if (!val) return '';
    let d = null;
    if (typeof val.toDate === 'function') d = val.toDate();
    else if (val.seconds) d = new Date(val.seconds * 1000);
    else d = new Date(val);
    if (!d || isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}h${pad(d.getMinutes())}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initial Launch of Calendar
function initCalendar() {
    resetToFirstBookableDay();
    renderBarberOptions();
    renderCalendarDays();
    renderActiveBookingBanner();
    loadSlotsForSelectedDate();
    initBookingLookup();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
} else {
    initCalendar();
}

// Synchronisation instantanée dès que l'application est réactivée ou revient au premier plan
async function resumeAndSyncApp() {
    renderActiveBookingBanner();

    if (!hasBookableSlot(selectedDate)) {
        resetToFirstBookableDay();
    }

    // Réveil explicite du réseau Firebase sur mobile (au cas où le socket était en pause)
    if (db) {
        try {
            if (typeof db.enableNetwork === 'function') {
                db.enableNetwork().catch(() => {});
            }
        } catch (e) {}

        // Redémarrage de l'écouteur si nécessaire pour relancer le WebSocket
        restartBookingsListener();

        // Si le planning admin est ouvert, on le réactualise immédiatement en direct
        if (adminModal && adminModal.classList.contains('show') && adminContentBox && adminContentBox.style.display !== 'none') {
            showAdminPlanning();
        }

        // Rafraîchissement direct de la date affichée pour réactivité à la milliseconde
        const iso = formatDateISO(selectedDate);
        try {
            const snap = await db.collection('slots').where('date', '==', iso).get();
            const freshMap = new Map();
            snap.forEach(doc => {
                const data = doc.data();
                if (data && data.time && !doc.id.includes('_phone_') && !String(data.barber || '').startsWith('phone_')) {
                    addToBookedMap(freshMap, data.time, bookingBarberId(data));
                }
            });
            bookingsCache.set(iso, freshMap);
            renderCalendarDays();
            renderSlots(freshMap);
        } catch (e) {}
    } else {
        renderCalendarDays();
        renderSlots(currentBookedMap);
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        resumeAndSyncApp();
    }
});
window.addEventListener('pageshow', resumeAndSyncApp);
window.addEventListener('focus', resumeAndSyncApp);

/* ==========================================================================
   MOBILE-SPECIFIC ENHANCEMENTS (SWIPE, TOAST, QUICK SELECTION)
   ========================================================================== */



// Mobile Toast Notification
function showToast(message) {
    const toast = document.getElementById('mobile-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// Service Selection & Direct Booking
const serviceSelectBtns = document.querySelectorAll('.service-select-btn');
const serviceCards = document.querySelectorAll('.service-card');
const serviceSelectInput = document.getElementById('booking-service');

function handleServiceSelect(serviceVal) {
    if (serviceSelectInput && serviceVal) {
        serviceSelectInput.value = serviceVal;
        const cleanName = serviceVal.split('(')[0].trim();
        showToast(`✂️ Service : ${cleanName}`);
    }
}

serviceSelectBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const serviceVal = btn.getAttribute('data-service');
        if (serviceVal) handleServiceSelect(serviceVal);
    });
});

serviceCards.forEach(card => {
    card.addEventListener('click', (e) => {
        if (e.target.closest('.service-select-btn')) return;
        const serviceVal = card.getAttribute('data-service');
        if (serviceVal) {
            handleServiceSelect(serviceVal);
            const bookingSection = document.getElementById('booking');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Mobile Bottom-Sheet: La fermeture au glissé tactile a été retirée pour éviter
// que la fenêtre de prise de rendez-vous ne se ferme par accident quand on fait défiler le formulaire.
// La fermeture se fait désormais via le bouton (X) ou en tapant en dehors.




/* ===== Badge Ouvert / Fermé (heure de Paris) ===== */
(function () {
    // 0 = Dimanche ... 6 = Samedi — plages en minutes
    const HOURS = {
        0: [[600, 840]],                 // Dim 10:00-14:00
        1: [],                           // Lun fermé
        2: [[540, 1140]],                // Mar 09:00-19:00
        3: [[540, 1140]],                // Mer
        4: [[540, 1140]],                // Jeu
        5: [[540, 750], [840, 1140]],    // Ven 09:00-12:30 / 14:00-19:00
        6: [[540, 1140]]                 // Sam
    };
    const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const fmt = m => String(Math.floor(m / 60)).padStart(2, '0') + 'h' + String(m % 60).padStart(2, '0');

    function parisNow() {
        const p = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        }).formatToParts(new Date());
        const get = t => p.find(x => x.type === t).value;
        const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
        return { day, min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
    }

    function status() {
        const { day, min } = parisNow();
        const current = HOURS[day].find(([o, c]) => min >= o && min < c);
        if (current) {
            const left = current[1] - min;
            return left <= 30
                ? { cls: 'soon', text: `Ferme bientôt · jusqu'à ${fmt(current[1])}` }
                : { cls: 'open', text: `Ouvert maintenant · jusqu'à ${fmt(current[1])}` };
        }
        const later = HOURS[day].find(([o]) => o > min);
        if (later) return { cls: 'closed', text: `Fermé · ouvre à ${fmt(later[0])}` };
        for (let i = 1; i <= 7; i++) {
            const d = (day + i) % 7;
            if (HOURS[d].length) {
                const when = i === 1 ? 'demain' : DAYS[d];
                return { cls: 'closed', text: `Fermé · ouvre ${when} à ${fmt(HOURS[d][0][0])}` };
            }
        }
        return { cls: 'closed', text: 'Fermé' };
    }

    function render() {
        const s = status();
        document.querySelectorAll('[data-open-status]').forEach(el => {
            el.classList.remove('is-open', 'is-soon', 'is-closed');
            el.classList.add('is-' + s.cls);
            const txt = el.querySelector('.open-status-text');
            if (txt) txt.textContent = s.text;
        });
    }

    render();
    setInterval(render, 60000);
})();
