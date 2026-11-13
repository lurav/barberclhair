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
        loadSlotsForSelectedDate();
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

function hasBookableSlot(date) {
    const iso = formatDateISO(date);
    if (closedDays.has(iso)) return false;
    return getSlotsForDay(date.getDay()).some(t => !isSlotPast(date, t));
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
    for (let i = 0; i < 14; i++) {
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
        const isFinishedToday = !isPast && !isMonday && !hasBookableSlot(date);
        const isDisabled = isPast || isMonday || isFinishedToday;
        const isSelected = formatDateISO(date) === formatDateISO(selectedDate);

        const col = document.createElement('div');
        col.className = 'cal-col';

        const dayName = document.createElement('span');
        dayName.className = 'cal-day-name';
        dayName.textContent = DAY_NAMES_SHORT[dayOfWeek];

        const dateBtn = document.createElement('div');
        dateBtn.className = 'cal-date';
        dateBtn.textContent = date.getDate();

        if (isSelected && !isDisabled) {
            dateBtn.classList.add('active');
        }

        if (isDisabled) {
            dateBtn.classList.add('disabled');
            col.classList.add('disabled');
            if (isMonday) {
                const closedBadge = document.createElement('span');
                closedBadge.className = 'cal-closed-badge';
                closedBadge.textContent = 'Fermé';
                col.appendChild(dayName);
                col.appendChild(dateBtn);
                col.appendChild(closedBadge);
                daysContainer.appendChild(col);
                return;
            }
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

    // Jour fermé : affichage immédiat, inutile d'attendre Firebase
    if (getSlotsForDay(selectedDate.getDay()).length === 0) {
        renderSlots(new Map());
        startBookingsListener(); // précharge les autres jours en arrière-plan
        return;
    }

    if (!db) {
        renderSlots(getLocalBookings(selectedIso));
        return;
    }

    // Données déjà en mémoire : affichage instantané
    if (bookingsCacheReady) {
        renderSlots(bookingsCache.get(selectedIso) || new Map());
        return;
    }

    slotsContainer.innerHTML = '<div class="slots-loading">Vérification des disponibilités en direct...</div>';
    startBookingsListener();
}

// ===== Cache des réservations =====
// Un seul écouteur temps réel couvre toute la période réservable (aujourd'hui → +MAX_WEEK_OFFSET semaines).
// Changer de jour ne refait donc plus aucune requête réseau.
const bookingsCache = new Map(); // "YYYY-MM-DD" -> Map(time -> barbers)
let bookingsCacheReady = false;

function startBookingsListener() {
    if (!db || unsubscribeBookings) return; // déjà actif

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(getWeekStartDate(MAX_WEEK_OFFSET));
    end.setDate(end.getDate() + 6);

    unsubscribeBookings = db.collection('slots')
        .where('date', '>=', formatDateISO(start))
        .where('date', '<=', formatDateISO(end))
        .onSnapshot((snapshot) => {
            bookingsCache.clear();
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data || !data.time || !data.date) return;
                if (!bookingsCache.has(data.date)) bookingsCache.set(data.date, new Map());
                addToBookedMap(bookingsCache.get(data.date), data.time, bookingBarberId(data));
            });
            bookingsCacheReady = true;
            renderSlots(bookingsCache.get(formatDateISO(selectedDate)) || new Map());
        }, (error) => {
            console.warn("Écouteur slots :", error);
            unsubscribeBookings = null;
            renderSlots(getLocalBookings(formatDateISO(selectedDate)));
        });
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

        // Vérification de dernière seconde : qui est encore libre sur ce créneau ?
        let latestMap = currentBookedMap;
        const phoneNorm = normalizePhone(phoneVal);
        // Lancée en parallèle de la vérification du créneau pour gagner du temps
        const dupCheckPromise = db ? Promise.race([
            findUpcomingBookingForPhone(phoneNorm, phoneVal),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 8000))
        ]) : null;
        if (dupCheckPromise) dupCheckPromise.catch(() => {});
        if (db) {
            try {
                const docs = await fsQueryEqual('date', currentSlotForBooking.dateIso, 5000);
                latestMap = new Map();
                docs.forEach(d => {
                    if (d && d.time) addToBookedMap(latestMap, d.time, bookingBarberId(d));
                });
            } catch (checkErr) {
                console.warn("Vérification en direct impossible, utilisation des dernières données :", checkErr);
            }
        }

        const resetSubmitBtn = () => {
            if (btnSubmitBooking) btnSubmitBooking.disabled = false;
            if (btnSubmitText) btnSubmitText.textContent = 'Confirmer mon rendez-vous';
        };

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

        const slotTakenMsg = "Désolé, ce créneau vient d'être réservé. Veuillez choisir un autre horaire ou un autre coiffeur.";
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

        // Un seul rendez-vous à venir par numéro de téléphone
        try {
            const existing = await dupCheckPromise;
            if (existing) {
                const [ey, em, ed] = existing.date.split('-').map(Number);
                const when = `${formatDateFull(new Date(ey, em - 1, ed))} à ${existing.time}`;
                showBookingError(`Vous avez déjà un rendez-vous le ${when}. Un seul rendez-vous à la fois est possible. Pour le modifier ou l'annuler, appelez le salon au 07 49 15 38 55.`);
                resetSubmitBtn();
                return;
            }
        } catch (dupErr) {
            console.warn("Vérification du numéro impossible :", dupErr);
            showBookingError("Connexion impossible, votre rendez-vous n'a pas été enregistré. Vérifiez votre connexion internet et réessayez, ou appelez le salon au 07 49 15 38 55.");
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

        // Enregistrement atomique : un document par (date, heure, coiffeur).
        // Si deux clients valident en même temps, un seul réussit.
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

            const slotOk = await fsCreateDocIn('slots', docId, slotPayload, 10000);
            if (!slotOk) throw new Error(SLOT_TAKEN);

            try {
                await fsCreateDocIn('bookings', docId, bookingPayload, 10000);
            } catch (bErr) {
                console.warn("Échec création booking privé :", bErr);
            }
        };

        try {
            let booked = null;
            for (const barber of candidates) {
                try {
                    await Promise.race([
                        tryBook(barber),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 10000))
                    ]);
                    booked = barber;
                    break;
                } catch (err) {
                    if (err && err.message === SLOT_TAKEN) continue; // essayer le coiffeur suivant
                    throw err;
                }
            }

            if (!booked) {
                showBookingError(slotTakenMsg);
                loadSlotsForSelectedDate();
                return;
            }

            saveLocalBooking(currentSlotForBooking.dateIso, currentSlotForBooking.time, booked.id);
            showSuccess(booked);

            // Déclenchement automatique du SMS de confirmation (via passerelle Android si configurée)
            fetch('/api/send-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'confirmation',
                    phone: phoneVal,
                    clientName: nameVal,
                    dateStr: currentSlotForBooking.dateFull,
                    time: currentSlotForBooking.time,
                    barberName: booked.name
                })
            }).catch(e => console.warn('Passerelle SMS non joignable :', e));
        } catch (err) {
            console.warn("Échec de l'enregistrement de la réservation :", err);
            showBookingError("Connexion impossible, votre rendez-vous n'a pas été enregistré. Vérifiez votre connexion internet et réessayez, ou appelez le salon au 07 49 15 38 55.");
        } finally {
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

// Normalise un numéro : "+33 6 12..." / "06 12..." -> "0612..."
function normalizePhone(phone) {
    let d = String(phone || '').replace(/\D/g, '');
    if (d.startsWith('0033')) d = '0' + d.slice(4);
    else if (d.startsWith('33') && d.length === 11) d = '0' + d.slice(2);
    return d;
}

// Cherche un rendez-vous à venir pour ce numéro (désactivé côté public pour garantir la confidentialité totale)
async function findUpcomingBookingForPhone(phoneNorm, phoneRaw) {
    return null;
}

function showBookingError(msg) {
    if (bookingError) {
        bookingError.textContent = msg;
        bookingError.style.display = 'block';
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
    });
}

// Configuration du bouton Agenda Téléphone (Apple Agenda / Google Calendar / Android) avec rappel 1h avant
function setupCalendarButtons(dateIso, time, service, clientName, barberName) {
    if (!dateIso || !time) return;
    const [year, month, day] = dateIso.split('-').map(Number);
    const [hour, min] = time.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, hour, min, 0);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // Durée 30 min

    const pad = (n) => String(n).padStart(2, '0');
    // Format UTC pour Google Calendar et iCalendar standard
    const formatCalDateUTC = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const startUtcStr = formatCalDateUTC(startDate);
    const endUtcStr = formatCalDateUTC(endDate);

    const barberLine = barberName ? `Coiffeur : ${barberName}` : '';
    const title = `Barber C L'Hair — Forfait : ${service}`;
    const location = "33 rue de l'hôtel de ville, 59620 Aulnoye-Aymeries";
    const descPlain = `Rendez-vous Barber C L'Hair\nForfait : ${service}\n${barberLine ? barberLine + '\n' : ''}Client : ${clientName}\nAdresse : 33 rue de l'hôtel de ville, Aulnoye-Aymeries\nTél : 07 49 15 38 55`;
    const descICS = `Rendez-vous Barber C L'Hair\\nForfait : ${service}\\n${barberLine ? barberLine + '\\n' : ''}Client : ${clientName}\\nAdresse : 33 rue de l'hôtel de ville, Aulnoye-Aymeries\\nTél : 07 49 15 38 55`;

    const calBtn = document.getElementById('btn-add-calendar');
    const calText = document.getElementById('btn-add-calendar-text');
    if (!calBtn) return;

    if (calText) calText.textContent = 'Alerte de rappel (sonnera 2h & 1h avant)';
    calBtn.classList.remove('btn-reminder-done');

    calBtn.onclick = (e) => {
        if (e) e.preventDefault();

        if (calText) calText.textContent = '✓ Alerte enregistrée sur votre téléphone !';
        calBtn.classList.add('btn-reminder-done');

        const ua = navigator.userAgent || '';
        const isAndroid = /Android/i.test(ua);
        // iPadOS se présente comme un Mac : on détecte l'écran tactile
        const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);

        if (isAndroid) {
            // Google Agenda (même onglet : pas bloqué par l'anti-popup)
            window.location.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startUtcStr}/${endUtcStr}&details=${encodeURIComponent(descPlain)}&location=${encodeURIComponent(location)}`;
            return;
        }

        if (isIOS) {
            // Vrai fichier .ics servi par le serveur -> « Ajouter au calendrier » d'Apple
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
        void descICS;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rdv-barber-c-l-hair-${dateIso}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
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
const adminPinInput = document.getElementById('admin-pin-input');
const adminPinSubmit = document.getElementById('admin-pin-submit');
const adminPinError = document.getElementById('admin-pin-error');
const adminBookingsList = document.getElementById('admin-bookings-list');
const adminFilterDate = document.getElementById('admin-filter-date');
const adminRefreshBtn = document.getElementById('admin-refresh-btn');

let authUser = null;

if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(user => {
        authUser = user;
        const logoutBtn = document.getElementById('admin-logout-btn');
        if (user) {
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
            if (adminAuthBox) adminAuthBox.style.display = 'none';
            if (adminContentBox) adminContentBox.style.display = 'block';
            if (adminModal && adminModal.classList.contains('show')) {
                showAdminPlanning();
            }
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
    adminModal.classList.remove('show');
    adminModal.setAttribute('aria-hidden', 'true');
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
    // Dimanche fermé (0) -> sauter au samedi ou mardi
    if (d.getDay() === 0) d.setDate(d.getDate() + (delta >= 0 ? 2 : -1));
    // Lundi fermé (1) -> sauter au mardi ou samedi
    if (d.getDay() === 1) d.setDate(d.getDate() + (delta >= 0 ? 1 : -2));

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
                if (adminEmailInput) adminEmailInput.value = '';
                if (adminPasswordInput) adminPasswordInput.value = '';
                showAdminPlanning();
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

// ---- Passerelle SMS Android (MacroDroid / Webhook 0 €) ----
let gatewayControlsInitialized = false;

async function loadGatewaySettings() {
    let url = localStorage.getItem('barber_sms_gateway_url') || '';
    if (db) {
        try {
            const doc = await db.collection('bookings').doc('_config_sms_gateway').get();
            if (doc.exists && doc.data()?.url) {
                url = doc.data().url;
                localStorage.setItem('barber_sms_gateway_url', url);
            }
        } catch (e) {
            console.warn('Lecture config gateway Firestore :', e);
        }
    }
    const input = document.getElementById('admin-gateway-url');
    const badge = document.getElementById('gateway-status-badge');
    if (input && url && !input.value) input.value = url;
    if (badge) {
        if (url) {
            badge.textContent = '🟢 Actif';
            badge.className = 'badge-status configured';
        } else {
            badge.textContent = 'Non configuré';
            badge.className = 'badge-status not-configured';
        }
    }
    if (!gatewayControlsInitialized) {
        initGatewayControls();
    }
}

function initGatewayControls() {
    gatewayControlsInitialized = true;
    const gatewayToggle = document.getElementById('admin-gateway-toggle');
    const gatewayBody = document.getElementById('admin-gateway-body');
    const gatewayChevron = document.getElementById('gateway-chevron');
    if (gatewayToggle && gatewayBody) {
        gatewayToggle.onclick = () => {
            const open = gatewayBody.style.display !== 'none';
            gatewayBody.style.display = open ? 'none' : 'block';
            if (gatewayChevron) gatewayChevron.style.transform = open ? '' : 'rotate(180deg)';
        };
    }

    const saveGatewayBtn = document.getElementById('admin-save-gateway-btn');
    if (saveGatewayBtn) {
        saveGatewayBtn.onclick = async () => {
            const input = document.getElementById('admin-gateway-url');
            const val = (input?.value || '').trim();
            const fb = document.getElementById('admin-gateway-feedback');
            saveGatewayBtn.disabled = true;
            saveGatewayBtn.textContent = '...';
            try {
                localStorage.setItem('barber_sms_gateway_url', val);
                if (db) {
                    await db.collection('bookings').doc('_config_sms_gateway').set({
                        url: val,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
                if (fb) {
                    fb.style.display = 'block';
                    fb.style.color = '#4ade80';
                    fb.textContent = val ? '✓ Passerelle enregistrée avec succès !' : '✓ Passerelle désactivée.';
                }
                loadGatewaySettings();
            } catch (err) {
                if (fb) {
                    fb.style.display = 'block';
                    fb.style.color = '#ff6b6b';
                    fb.textContent = 'Erreur d\'enregistrement : ' + err.message;
                }
            } finally {
                saveGatewayBtn.disabled = false;
                saveGatewayBtn.textContent = 'Enregistrer';
            }
        };
    }

    const testSmsBtn = document.getElementById('admin-test-sms-btn');
    if (testSmsBtn) {
        testSmsBtn.onclick = async () => {
            const fb = document.getElementById('admin-gateway-feedback');
            const phoneTest = prompt("Numéro de téléphone pour recevoir le SMS test :", "0749153855");
            if (!phoneTest) return;
            testSmsBtn.disabled = true;
            testSmsBtn.textContent = 'Envoi...';
            if (fb) { fb.style.display = 'block'; fb.style.color = '#ffd166'; fb.textContent = 'Envoi du SMS test vers ' + phoneTest + '...'; }
            try {
                const res = await fetch('/api/send-sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'test',
                        phone: phoneTest
                    })
                });
                const data = await res.json();
                if (data.success) {
                    if (fb) { fb.style.color = '#4ade80'; fb.textContent = '✓ SMS test transmis à votre téléphone Android !'; }
                } else {
                    if (fb) { fb.style.color = '#ff6b6b'; fb.textContent = '⚠️ ' + (data.message || 'Passerelle non connectée'); }
                }
            } catch (err) {
                if (fb) { fb.style.color = '#ff6b6b'; fb.textContent = 'Erreur : ' + err.message; }
            } finally {
                testSmsBtn.disabled = false;
                testSmsBtn.textContent = '📲 Tester un SMS';
            }
        };
    }

    const cronTomorrowBtn = document.getElementById('admin-cron-tomorrow-btn');
    if (cronTomorrowBtn) {
        cronTomorrowBtn.onclick = async () => {
            if (!confirm("Envoyer automatiquement un SMS de rappel à tous les clients prévus demain ?")) return;
            const fb = document.getElementById('admin-gateway-feedback');
            cronTomorrowBtn.disabled = true;
            cronTomorrowBtn.textContent = 'Rappels en cours...';
            try {
                const res = await fetch('/api/cron-reminders');
                const data = await res.json();
                if (data.success) {
                    if (fb) {
                        fb.style.display = 'block';
                        fb.style.color = '#4ade80';
                        fb.textContent = `✓ ${data.sentCount} rappel(s) envoyé(s) pour demain (${data.totalBookings} RDV au total).`;
                    }
                    showAdminPlanning();
                } else {
                    if (fb) {
                        fb.style.display = 'block';
                        fb.style.color = '#ff6b6b';
                        fb.textContent = '⚠️ ' + (data.message || 'Erreur lors des rappels');
                    }
                }
            } catch (err) {
                if (fb) {
                    fb.style.display = 'block';
                    fb.style.color = '#ff6b6b';
                    fb.textContent = 'Erreur : ' + err.message;
                }
            } finally {
                cronTomorrowBtn.disabled = false;
                cronTomorrowBtn.textContent = '📢 Rappeler les clients de demain';
            }
        };
    }
}

async function showAdminPlanning() {
    if (adminAuthBox) adminAuthBox.style.display = 'none';
    if (adminContentBox) adminContentBox.style.display = 'block';

    loadGatewaySettings();

    const selectedIso = formatDateISO(selectedDate);
    if (adminFilterDate) {
        adminFilterDate.textContent = formatDateFull(selectedDate);
    }

    if (!adminBookingsList) return;
    adminBookingsList.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 1.5rem;">Chargement des rendez-vous...</div>';

    if (db) {
        try {
            const snap = await db.collection('bookings')
                .where('date', '==', selectedIso)
                .get();

            const allBookings = [];
            snap.forEach(doc => {
                const data = doc.data();
                allBookings.push({ id: doc.id, ...data, barberId: bookingBarberId(data) });
            });

            // Auto-sync des réservations vers les slots publics anonymes
            if (allBookings.length > 0) {
                const batch = db.batch();
                let hasBatch = false;
                allBookings.forEach(b => {
                    if (b.id && b.date && b.time) {
                        const slotRef = db.collection('slots').doc(b.id);
                        batch.set(slotRef, {
                            date: b.date,
                            time: b.time,
                            barber: b.barberId || 'isma'
                        }, { merge: true });
                        hasBatch = true;
                    }
                });
                if (hasBatch) batch.commit().catch(e => console.warn('Sync batch slots :', e));
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

            // Actions de journée : Imprimer & Bloquer/Débloquer
            const printBtn = document.getElementById('admin-print-btn');
            if (printBtn) {
                printBtn.onclick = () => window.print();
            }

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

            adminBookingsList.innerHTML = '';
            bookings.forEach(b => {
                const barberName = getBarberName(b.barberId);
                const barberIndex = Math.max(0, BARBERS.findIndex(x => x.id === b.barberId));
                const item = document.createElement('div');
                item.className = 'admin-booking-item';

                const reminderKey = `barber_reminder_sent_${b.id}`;
                const alreadySent = !!localStorage.getItem(reminderKey);
                const reminderMsg = buildReminderMessage(b, selectedIso);
                const gReviewMsg = `Bonjour ${(b.clientName || 'Client').trim()}, merci pour votre visite chez Barber C L'Hair ! Si votre coupe vous plaît, un petit avis 5 étoiles sur Google nous aide énormément : https://maps.google.com/?q=Barber+c+l%27hair+33+rue+de+l%27hotel+de+ville+59620+Aulnoye-Aymeries . À bientôt !`;
                const hasPhone = !!(b.clientPhone && String(b.clientPhone).replace(/\D/g, '').length >= 9);
                const smsUrl = hasPhone ? getSmsUrl(b.clientPhone, reminderMsg) : '#';
                const waUrl = hasPhone ? getWhatsAppUrl(b.clientPhone, reminderMsg) : '#';
                const gReviewSmsUrl = hasPhone ? getSmsUrl(b.clientPhone, gReviewMsg) : '#';

                item.innerHTML = `
                    <div class="admin-booking-header">
                        <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                            <span class="admin-booking-time">${escapeHtml(b.time || '')}</span>
                            <span class="admin-booking-barber-badge barber-color-${barberIndex}">👤 ${escapeHtml(barberName)}</span>
                            <span class="admin-booking-service-badge">✂️ ${escapeHtml(b.service || 'Coupe')}</span>
                        </div>
                        <button type="button" class="admin-cancel-btn" title="Annuler et supprimer ce rendez-vous" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.65rem; font-size: 0.76rem; border: 1px solid rgba(255, 107, 107, 0.4); color: #ff8787; background: rgba(255, 107, 107, 0.12); border-radius: 6px; cursor: pointer; flex-shrink: 0; margin-left: auto;">
                            <i data-feather="trash-2" style="width: 13px; height: 13px;"></i>
                            <span>Supprimer</span>
                        </button>
                    </div>
                    <div class="admin-booking-details">
                        <div class="admin-booking-client">${escapeHtml(b.clientName || 'Client')}</div>
                        <div class="admin-booking-meta">
                            <span>📞 <a href="tel:${escapeHtml(b.clientPhone || '')}">${escapeHtml(b.clientPhone || 'Non renseigné')}</a></span>
                            ${formatCreatedAt(b.createdAt) ? `<div style="margin-top: 0.3rem; font-size: 0.8rem; opacity: 0.75;">🗓️ Réservé le ${formatCreatedAt(b.createdAt)}</div>` : ''}
                            ${b.clientNote ? `<div style="margin-top: 0.3rem;"><em>Note: ${escapeHtml(b.clientNote)}</em></div>` : ''}
                        </div>
                    </div>
                    ${hasPhone ? `
                        <div class="admin-booking-actions">
                            <a href="${escapeHtml(smsUrl)}" class="admin-sms-btn ${alreadySent ? 'sent' : ''}" title="Ouvrir le SMS de rappel pré-rempli sur votre téléphone">
                                <span class="sms-label">${alreadySent ? '✓ SMS préparé' : '💬 Rappel SMS'}</span>
                            </a>
                            <a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener" class="admin-wa-btn" title="Envoyer par WhatsApp">
                                <span>WhatsApp</span>
                            </a>
                            <a href="${escapeHtml(gReviewSmsUrl)}" class="admin-sms-btn" style="border-color: rgba(251, 191, 36, 0.45); color: #fbbf24;" title="Envoyer une demande d'avis 5 étoiles Google par SMS">
                                <span>⭐ Avis Google</span>
                            </a>
                        </div>
                    ` : ''}
                `;

                if (hasPhone) {
                    const smsLink = item.querySelector('.admin-sms-btn');
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
                            await db.collection('slots').doc(b.id).delete().catch(() => {});
                            await db.collection('bookings').doc(b.id).delete();
                            localStorage.removeItem(reminderKey);
                            showAdminPlanning();
                            loadSlotsForSelectedDate();
                        }
                    });
                }

                adminBookingsList.appendChild(item);
            });
            if (window.feather) feather.replace();
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
        item.className = 'admin-booking-item';
        item.innerHTML = `
            <div class="admin-booking-header">
                <span class="admin-booking-time">${escapeHtml(time)}</span>
                <span class="admin-booking-barber-badge barber-color-${barberIndex}">👤 ${escapeHtml(getBarberName(barberId))}</span>
                <span class="admin-booking-service-badge">✂️ RDV Réservé</span>
            </div>
            <div class="admin-booking-details">
                <div class="admin-booking-client">Créneau réservé</div>
            </div>
        `;
        adminBookingsList.appendChild(item);
    });
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
    loadSlotsForSelectedDate();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
} else {
    initCalendar();
}

// Onglet resté ouvert longtemps (ex : après minuit) : on remet le calendrier à jour au retour
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (!hasBookableSlot(selectedDate)) {
        resetToFirstBookableDay();
        loadSlotsForSelectedDate();
    } else {
        renderSlots(currentBookedMap);
    }
    renderCalendarDays();
});

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
            el.querySelector('.open-status-text').textContent = s.text;
        });
    }

    render();
    setInterval(render, 60000);
})();
