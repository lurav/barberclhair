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

// Lightbox for Gallery
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');
const galleryItems = document.querySelectorAll('.gallery-item');

if(lightbox && galleryItems.length > 0) {
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const imgUrl = item.querySelector('img').src;
            if(lightboxImg) {
                lightboxImg.src = imgUrl;
                lightbox.style.display = 'flex';
                // Adjusting CSS dynamically to center it properly if needed
                lightbox.style.alignItems = 'center';
                lightbox.style.justifyContent = 'center';
                lightbox.style.paddingTop = '0';
            }
        });
    });

    if(lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightbox.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if(e.target === lightbox) {
            lightbox.style.display = 'none';
        }
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

// Salon Data & Opening Hours
// Lun: Fermé | Mar-Jeu: 09h-19h | Ven: 09h-12h30 / 14h-19h | Sam: 09h-19h | Dim: 10h-14h
const DAY_NAMES_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

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
        const isDisabled = isPast || isMonday;
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

    slotsContainer.innerHTML = '<div class="slots-loading">Vérification des disponibilités en direct...</div>';

    const selectedIso = formatDateISO(selectedDate);

    // Unsubscribe previous real-time listener if any
    if (unsubscribeBookings) {
        unsubscribeBookings();
        unsubscribeBookings = null;
    }

    if (db) {
        unsubscribeBookings = db.collection('bookings')
            .where('date', '==', selectedIso)
            .onSnapshot((snapshot) => {
                const bookedTimes = new Set();
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data && data.time) {
                        bookedTimes.add(data.time);
                    }
                });
                renderSlots(bookedTimes);
            }, (error) => {
                console.warn("Écouteur Firestore non actif (vérifier les règles Firestore) :", error);
                // Fallback to local storage or empty booked list
                const localBookings = getLocalBookings(selectedIso);
                renderSlots(localBookings);
            });
    } else {
        const localBookings = getLocalBookings(selectedIso);
        renderSlots(localBookings);
    }
}

// Local Storage Fallback for Bookings
function getLocalBookings(dateIso) {
    try {
        const stored = localStorage.getItem(`barber_bookings_${dateIso}`);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
        return new Set();
    }
}

function saveLocalBooking(dateIso, time) {
    try {
        const current = getLocalBookings(dateIso);
        current.add(time);
        localStorage.setItem(`barber_bookings_${dateIso}`, JSON.stringify(Array.from(current)));
    } catch (e) {
        console.error(e);
    }
}

// Render Time Slots
function renderSlots(bookedTimes = new Set()) {
    const slotsContainer = document.getElementById('slots-container');
    if (!slotsContainer) return;

    slotsContainer.innerHTML = '';
    const dayOfWeek = selectedDate.getDay();
    const availableSlots = getSlotsForDay(dayOfWeek);

    if (availableSlots.length === 0) {
        slotsContainer.innerHTML = '<div class="slots-empty">Le salon est fermé ce jour-là.</div>';
        return;
    }

    const now = new Date();
    const isToday = formatDateISO(selectedDate) === formatDateISO(now);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let renderedCount = 0;

    availableSlots.forEach(time => {
        const [slotHourStr, slotMinStr] = time.split(':');
        const slotHour = parseInt(slotHourStr, 10);
        const slotMin = parseInt(slotMinStr, 10);

        // Check if slot is already in the past today
        const isPastSlot = isToday && (slotHour < currentHour || (slotHour === currentHour && slotMin <= currentMin + 10));
        const isBooked = bookedTimes.has(time);

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
        time: time
    };

    if (modalRecap) {
        modalRecap.textContent = `${currentSlotForBooking.dateFull} à ${time}`;
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

    if (window.feather) feather.replace();
}

function closeBookingModal() {
    if (!bookingModal) return;
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
}

if (modalOverlay) modalOverlay.addEventListener('click', closeBookingModal);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeBookingModal);
if (successCloseBtn) successCloseBtn.addEventListener('click', closeBookingModal);

// Submit Booking Form
if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentSlotForBooking) return;

        const serviceVal = document.getElementById('booking-service').value;
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

        // Set Loading State
        if (btnSubmitBooking) btnSubmitBooking.disabled = true;
        if (btnSubmitText) btnSubmitText.textContent = "Réservation en cours...";
        if (bookingError) bookingError.style.display = 'none';

        const bookingPayload = {
            date: currentSlotForBooking.dateIso,
            time: currentSlotForBooking.time,
            service: serviceVal,
            clientName: nameVal,
            clientPhone: phoneVal,
            clientNote: noteVal || '',
            createdAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        };

        try {
            if (db) {
                // Add to Firestore collection with a strict 3.5s timeout to prevent hanging on mobile
                await Promise.race([
                    db.collection('bookings').add(bookingPayload),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3500))
                ]);
            } else {
                saveLocalBooking(currentSlotForBooking.dateIso, currentSlotForBooking.time);
            }

            // Also keep in localStorage as safety backup
            saveLocalBooking(currentSlotForBooking.dateIso, currentSlotForBooking.time);

            // Update Success Step UI
            document.getElementById('success-datetime').textContent = `${currentSlotForBooking.dateFull} à ${currentSlotForBooking.time}`;
            document.getElementById('success-service').textContent = serviceVal;
            document.getElementById('success-client').textContent = `${nameVal} (${phoneVal})`;
            setupCalendarButtons(currentSlotForBooking.dateIso, currentSlotForBooking.time, serviceVal, nameVal);

            if (bookingFormStep) bookingFormStep.style.display = 'none';
            if (bookingSuccessStep) bookingSuccessStep.style.display = 'block';

            // Reset form
            bookingForm.reset();

            // Refresh slots view immediately
            loadSlotsForSelectedDate();

            if (window.feather) feather.replace();
        } catch (err) {
            console.warn("Enregistrement en ligne différé ou hors-ligne :", err);
            // Save locally so the client's reservation is guaranteed
            saveLocalBooking(currentSlotForBooking.dateIso, currentSlotForBooking.time);
            document.getElementById('success-datetime').textContent = `${currentSlotForBooking.dateFull} à ${currentSlotForBooking.time}`;
            document.getElementById('success-service').textContent = serviceVal;
            document.getElementById('success-client').textContent = `${nameVal} (${phoneVal})`;
            setupCalendarButtons(currentSlotForBooking.dateIso, currentSlotForBooking.time, serviceVal, nameVal);

            if (bookingFormStep) bookingFormStep.style.display = 'none';
            if (bookingSuccessStep) bookingSuccessStep.style.display = 'block';
            bookingForm.reset();
            loadSlotsForSelectedDate();

            if (window.feather) feather.replace();
        } finally {
            if (btnSubmitBooking) btnSubmitBooking.disabled = false;
            if (btnSubmitText) btnSubmitText.textContent = 'Confirmer mon rendez-vous';
        }
    });
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
function setupCalendarButtons(dateIso, time, service, clientName) {
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

    const title = `Barber C L'Hair — Forfait : ${service}`;
    const location = "33 rue de l'hôtel de ville, 59620 Aulnoye-Aymeries";
    const descPlain = `Rendez-vous Barber C L'Hair\nForfait : ${service}\nClient : ${clientName}\nAdresse : 33 rue de l'hôtel de ville, Aulnoye-Aymeries\nTél : 07 49 15 38 55`;
    const descICS = `Rendez-vous Barber C L'Hair\\nForfait : ${service}\\nClient : ${clientName}\\nAdresse : 33 rue de l'hôtel de ville, Aulnoye-Aymeries\\nTél : 07 49 15 38 55`;

    const calBtn = document.getElementById('btn-add-calendar');
    if (!calBtn) return;

    calBtn.onclick = (e) => {
        if (e) e.preventDefault();
        const ua = navigator.userAgent || '';
        const isAndroid = /Android/i.test(ua);
        const isIOS = /iPhone|iPad|iPod/i.test(ua);

        if (isAndroid) {
            // Sur Android, redirection directe vers Google Agenda
            const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startUtcStr}/${endUtcStr}&details=${encodeURIComponent(descPlain)}&location=${encodeURIComponent(location)}`;
            window.open(googleUrl, '_blank');
        } else {
            // Sur iPhone (iOS) et macOS / Windows : génération .ics standard
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
                `SUMMARY:${title}`,
                `DESCRIPTION:${descICS}`,
                `LOCATION:${location}`,
                'STATUS:CONFIRMED',
                'BEGIN:VALARM',
                'TRIGGER:-PT1H',
                'ACTION:DISPLAY',
                'DESCRIPTION:Rappel RDV Barber C L\'Hair dans 1h',
                'END:VALARM',
                'END:VEVENT',
                'END:VCALENDAR'
            ].join('\r\n');

            if (isIOS) {
                // Sur iOS Safari, le data URI text/calendar déclenche directement l'ajout dans Apple Calendar
                const uri = 'data:text/calendar;charset=utf8,' + encodeURIComponent(icsContent);
                window.location.href = uri;
            } else {
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
        }
    };
}

// Week Navigation Buttons
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');

if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
        if (currentWeekOffset > 0) {
            currentWeekOffset--;
            const newMon = getWeekStartDate(currentWeekOffset);
            selectedDate = new Date(newMon);
            if (selectedDate.getDay() === 1) selectedDate.setDate(selectedDate.getDate() + 1);
            renderCalendarDays();
            loadSlotsForSelectedDate();
        }
    });
}

if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
        currentWeekOffset++;
        const newMon = getWeekStartDate(currentWeekOffset);
        selectedDate = new Date(newMon);
        if (selectedDate.getDay() === 1) selectedDate.setDate(selectedDate.getDate() + 1);
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

const ADMIN_PIN = "176521";
let isAdminAuthenticated = false;

function openAdminModal() {
    if (!adminModal) return;
    adminModal.classList.add('show');
    adminModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (isAdminAuthenticated) {
        showAdminPlanning();
    } else {
        if (adminAuthBox) adminAuthBox.style.display = 'block';
        if (adminContentBox) adminContentBox.style.display = 'none';
        if (adminPinInput) {
            adminPinInput.value = '';
            // Ne pas forcer le .focus() automatique sur mobile car iOS zoome automatiquement sur la page
        }
    }
    if (window.feather) feather.replace();
}

function closeAdminModal() {
    if (!adminModal) return;
    adminModal.classList.remove('show');
    adminModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

if (openAdminBtn) openAdminBtn.addEventListener('click', openAdminModal);
if (adminModalCloseBtn) adminModalCloseBtn.addEventListener('click', closeAdminModal);
if (adminModalCloseOverlay) adminModalCloseOverlay.addEventListener('click', closeAdminModal);

if (adminPinSubmit && adminPinInput) {
    adminPinSubmit.addEventListener('click', () => {
        // Enlève le focus du champ pour forcer iOS à refermer le clavier et remettre le zoom à 1
        adminPinInput.blur();
        if (adminPinInput.value.trim() === ADMIN_PIN) {
            isAdminAuthenticated = true;
            if (adminPinError) adminPinError.style.display = 'none';
            showAdminPlanning();
        } else {
            if (adminPinError) adminPinError.style.display = 'block';
        }
    });

    adminPinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            adminPinSubmit.click();
        }
    });
}

if (adminRefreshBtn) {
    adminRefreshBtn.addEventListener('click', showAdminPlanning);
}

async function showAdminPlanning() {
    if (adminAuthBox) adminAuthBox.style.display = 'none';
    if (adminContentBox) adminContentBox.style.display = 'block';

    const selectedIso = formatDateISO(selectedDate);
    if (adminFilterDate) {
        adminFilterDate.textContent = `Date : ${formatDateFull(selectedDate)}`;
    }

    if (!adminBookingsList) return;
    adminBookingsList.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 1.5rem;">Chargement des rendez-vous...</div>';

    if (db) {
        try {
            const snap = await db.collection('bookings')
                .where('date', '==', selectedIso)
                .get();

            const bookings = [];
            snap.forEach(doc => {
                bookings.push({ id: doc.id, ...doc.data() });
            });

            // Sort by time
            bookings.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            if (bookings.length === 0) {
                adminBookingsList.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 1.5rem; font-style: italic;">Aucun rendez-vous enregistré pour cette journée.</div>';
                return;
            }

            adminBookingsList.innerHTML = '';
            bookings.forEach(b => {
                const item = document.createElement('div');
                item.className = 'admin-booking-item';
                item.innerHTML = `
                    <div class="admin-booking-header">
                        <span class="admin-booking-time">${escapeHtml(b.time || '')}</span>
                        <span class="admin-booking-service-badge">✂️ ${escapeHtml(b.service || 'Coupe')}</span>
                    </div>
                    <div class="admin-booking-details">
                        <div class="admin-booking-client">${escapeHtml(b.clientName || 'Client')}</div>
                        <div class="admin-booking-meta">
                            <span>📞 <a href="tel:${escapeHtml(b.clientPhone || '')}">${escapeHtml(b.clientPhone || 'Non renseigné')}</a></span>
                            ${formatCreatedAt(b.createdAt) ? `<div style="margin-top: 0.3rem; font-size: 0.8rem; opacity: 0.75;">🗓️ Réservé le ${formatCreatedAt(b.createdAt)}</div>` : ''}
                            ${b.clientNote ? `<div style="margin-top: 0.3rem;"><em>Note: ${escapeHtml(b.clientNote)}</em></div>` : ''}
                        </div>
                    </div>
                `;

                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'admin-cancel-btn';
                cancelBtn.textContent = 'Supprimer';
                cancelBtn.addEventListener('click', async () => {
                    if (confirm(`Annuler le rendez-vous de ${b.clientName} à ${b.time} ?`)) {
                        await db.collection('bookings').doc(b.id).delete();
                        showAdminPlanning();
                        loadSlotsForSelectedDate();
                    }
                });

                item.appendChild(cancelBtn);
                adminBookingsList.appendChild(item);
            });
        } catch (e) {
            console.error("Erreur de chargement des réservations:", e);
            const local = getLocalBookings(selectedIso);
            if (local && local.size > 0) {
                renderAdminLocalBookings(local);
            } else {
                adminBookingsList.innerHTML = `<div style="color: #ff6b6b; padding: 1rem;">Erreur de chargement en ligne : ${e.message}</div>`;
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

function renderAdminLocalBookings(localTimesSet) {
    if (!adminBookingsList) return;
    const sorted = Array.from(localTimesSet).sort();
    adminBookingsList.innerHTML = '<div style="padding: 0.5rem; font-size: 0.8rem; color: var(--accent-gold); font-style: italic;">Rendez-vous enregistrés sur cet appareil :</div>';
    sorted.forEach(time => {
        const item = document.createElement('div');
        item.className = 'admin-booking-item';
        item.innerHTML = `
            <div class="admin-booking-header">
                <span class="admin-booking-time">${escapeHtml(time)}</span>
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        renderCalendarDays();
        loadSlotsForSelectedDate();
    });
} else {
    renderCalendarDays();
    loadSlotsForSelectedDate();
}

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



