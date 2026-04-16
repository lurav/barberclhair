/* SHOW MENU */
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

/* Menu Show */
if(navToggle){
    navToggle.addEventListener('click', () =>{
        navMenu.classList.add('show')
    })
}

/* Menu Hidden */
if(navClose){
    navClose.addEventListener('click', () =>{
        navMenu.classList.remove('show')
    })
}

/* REMOVE MENU MOBILE */
const navLink = document.querySelectorAll('.nav-link')

function linkAction(){
    const navMenu = document.getElementById('nav-menu')
    navMenu.classList.remove('show')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/* CHANGE BACKGROUND HEADER */
function scrollHeader() {
    const header = document.querySelector('.header')
    if(window.scrollY >= 50) header.classList.add('scroll'); 
    else header.classList.remove('scroll')
}
window.addEventListener('scroll', scrollHeader)
window.addEventListener('load', scrollHeader)

/* INTERSECTION OBSERVER FOR REVEAL */
const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Only reveal once
        }
    });
}, revealOptions);

document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
});

/* FAQ TOGGLE */
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        
        // Close other items
        faqItems.forEach(otherItem => {
            otherItem.classList.remove('open');
        });

        if (!isOpen) {
            item.classList.add('open');
        }
    });
});

/* SMOOTH SCROLL FOR ANCHORS */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

/* BOOKING CALENDAR LOGIC */
const calendarDays = document.getElementById('calendarDays');
const currentMonthYear = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const timeSlotsSection = document.getElementById('timeSlotsSection');
const timeSlotsGrid = document.getElementById('timeSlotsGrid');
const selectedDateText = document.getElementById('selectedDateText');
const hiddenDateInput = document.getElementById('hiddenDate');
const hiddenTimeInput = document.getElementById('hiddenTime');

let date = new Date();
let currentMonth = date.getMonth();
let currentYear = date.getFullYear();

const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const renderCalendar = () => {
    calendarDays.innerHTML = "";
    currentMonthYear.textContent = `${months[currentMonth]} ${currentYear}`;

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Adjust for Monday start (JS default is Sunday)
    let startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < startDay; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.classList.add("calendar-day", "empty");
        calendarDays.appendChild(emptyDiv);
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 1; i <= lastDateOfMonth; i++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("calendar-day");
        dayDiv.textContent = i;
        
        const checkDate = new Date(currentYear, currentMonth, i);
        // JS getDay() returns 1 for Monday
        if (checkDate < today || checkDate.getDay() === 1) {
            dayDiv.classList.add("disabled");
            if (checkDate.getDay() === 1) {
                dayDiv.title = "Fermé le Lundi";
            }
        } else {
            if (checkDate.getTime() === today.getTime()) {
                dayDiv.classList.add("today");
            }
            dayDiv.addEventListener('click', () => selectDate(checkDate, dayDiv));
        }
        
        calendarDays.appendChild(dayDiv);
    }
};

const selectDate = (dateObj, element) => {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    element.classList.add('selected');
    
    const formattedDate = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    selectedDateText.textContent = formattedDate;
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    hiddenDateInput.value = `${year}-${month}-${day}`;
    
    timeSlotsSection.style.display = 'block';
    renderTimeSlots();
};

const renderTimeSlots = async () => {
    timeSlotsGrid.innerHTML = "Chargement des créneaux...";
    
    // Get busy slots from Vercel Node.js API
    let busySlots = [];
    try {
        const response = await fetch(`api/get-busy-slots?date=${hiddenDateInput.value}`);
        if(response.ok) {
            busySlots = await response.json();
        }
    } catch(e) { console.log("Mode hors-ligne ou Vercel non configuré"); }

    timeSlotsGrid.innerHTML = "";
    
    const parts = hiddenDateInput.value.split('-');
    const selectedDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayOfWeek = selectedDateObj.getDay();
    
    let slots = [];
    if (dayOfWeek >= 2 && dayOfWeek <= 4) { // Mar - Jeu (09:00 - 19:00)
        slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];
    } else if (dayOfWeek === 5) { // Vendredi (09:00-12:30 / 14:00-19:00)
        slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];
    } else if (dayOfWeek === 6) { // Samedi (09:00 - 19:00)
        slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];
    } else if (dayOfWeek === 0) { // Dimanche (10:00 - 14:00)
        slots = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"];
    }
    
    slots.forEach(time => {
        const slotDiv = document.createElement("div");
        slotDiv.classList.add("time-slot");
        slotDiv.textContent = time;
        
        if (busySlots.includes(time)) {
            slotDiv.classList.add("booked");
            slotDiv.title = "Déjà réservé";
        } else {
            slotDiv.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slotDiv.classList.add('selected');
                hiddenTimeInput.value = time;
            });
        }
        
        timeSlotsGrid.appendChild(slotDiv);
    });
};

if(prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });
}

if(nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });
}

renderCalendar();

/* FORM SUBMISSION */
const form = document.querySelector('form');
if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!hiddenDateInput.value || !hiddenTimeInput.value) {
            alert('Veuillez choisir une date et une heure sur le calendrier.');
            return;
        }

        const btn = form.querySelector('button');
        const originalText = btn.textContent;
        const formData = new FormData(form);
        
        btn.textContent = 'Envoi en cours...';
        btn.style.opacity = '0.7';
        btn.disabled = true;

        try {
            const data = Object.fromEntries(formData.entries());

            // 1. Sauvegarde du créneau dans Vercel KV (pour le bloquer)
            fetch('api/save-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(err => console.log('KV non dispo en local:', err));

            // 2. Envoi de l'email via Formspree
            const response = await fetch('https://formspree.io/f/xkokjnao', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                alert('Merci ! Votre réservation a bien été envoyée. Vous recevrez un e-mail de confirmation.');
                form.reset();
                timeSlotsSection.style.display = 'none';
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                renderTimeSlots();
            } else {
                alert('Oups ! Une erreur est survenue. Veuillez réessayer.');
            }
        } catch (error) {
            alert('Une erreur s\'est produite. Vérifiez votre connexion.');
        } finally {
            btn.textContent = originalText;
            btn.style.opacity = '1';
            btn.disabled = false;
        }
    });
}

/* LIGHTBOX LOGIC */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');
const galleryItems = document.querySelectorAll('.gallery-item');

if (lightbox && galleryItems.length > 0) {
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            lightboxImg.src = img.src;
            lightbox.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scroll
        });
    });

    lightboxClose.addEventListener('click', () => {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

