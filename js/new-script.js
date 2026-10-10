// ===================================
// Modern Hotel Website JavaScript
// ===================================

const BOOKING_FORM_ENDPOINT = 'booking.php';

const BOOKING_SECURITY_CONFIG = {
    maxRooms: {
        einzelzimmer: 12,
        doppelzimmer: 6,
        familienzimmer: 3,
        zweibettzimmer: 3,
        apartment: 2,
    },
    maxRoomsTotal: 12,
    minNights: 1,
    maxNights: 30,
    maxAdvanceDays: 365,
};

// Google Analytics 4 (nur nach Einwilligung im Cookie-Banner): Mess-ID aus GA → Verwaltung → Datenstreams,
// z. B. 'G-ABC123XYZ'. Leer = GA und Cookie-Banner sind aus. In GA vorher einstellen, was in
// datenschutz.html#google-analytics steht: Datenverarbeitungsbedingungen akzeptiert, Google Signals und
// Werbefunktionen aus, Datenaufbewahrung 2 Monate.
const GA_MEASUREMENT_ID = '';

// Matomo (selbst gehostet bei STRATO, ohne Cookies, ohne Einwilligung): Adresse der Matomo-Installation
// mit abschließendem Schrägstrich, z. B. 'https://statistik.hotelroessle.eu/'. Leer = Matomo ist aus.
const MATOMO_URL = '';
const MATOMO_SITE_ID = '1';

// Frühere Versionen haben Buchungsanfragen samt E-Mail-Adresse im localStorage gezählt.
// Die Begrenzung läuft nur noch serverseitig, daher alten Eintrag bei Besuchern entfernen.
try {
    localStorage.removeItem('hotel_roessle_booking_rate_limits');
} catch (error) {
    // Speicher nicht verfügbar (z. B. blockiert) – dann gibt es auch nichts zu entfernen.
}

// Kennzeichnet, dass JavaScript läuft (CSS blendet Inhalte erst dann animiert ein)
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function() {

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.nav-menu');

    function toggleMobileMenu(forceOpen) {
        if (!mobileMenu || !mobileMenuBtn) {
            return;
        }
        const isActive = mobileMenu.classList.toggle('active', forceOpen);
        mobileMenuBtn.classList.toggle('active', isActive);

        // Update ARIA attributes for accessibility
        mobileMenuBtn.setAttribute('aria-expanded', isActive);
        mobileMenuBtn.setAttribute('aria-label', isActive ? 'Menü schließen' : 'Menü öffnen');
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => toggleMobileMenu());
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) {
            toggleMobileMenu(false);
            mobileMenuBtn.focus();
        }
    });

    // Jeder Menü-Link schließt das Mobilmenü (auch Links auf andere Seiten)
    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => toggleMobileMenu(false));
        });
    }

    // In-Page-Links: Das Scrollen übernimmt CSS (scroll-behavior, scroll-padding-top).
    // Hier wird nur das Mobilmenü geschlossen und ggf. eine Auswahl vorbelegt.
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function() {
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                toggleMobileMenu(false);
            }

            // „Dieses Zimmer anfragen“: Zimmer im Buchungsformular vorauswählen
            const roomToBook = this.dataset.bookRoom;
            if (roomToBook && bookingCounters[roomToBook] === 0) {
                updateRoomCounter(roomToBook, 1);
            }

            // „Raum anfragen“: Betreff im Kontaktformular vorbelegen
            const contactSubject = this.dataset.contactSubject;
            const subjectSelect = document.getElementById('contact-subject');
            if (contactSubject && subjectSelect) {
                subjectSelect.value = contactSubject;
            }
        });
    });

    // Google Maps erst nach Klick laden (vorher werden keine Daten an Google übertragen).
    // Der Klick gilt nur für diesen Seitenaufruf; dauerhaft geht es über die Cookie-Einstellungen.
    const loadMapBtn = document.getElementById('loadMapBtn');
    if (loadMapBtn) {
        loadMapBtn.addEventListener('click', () => loadHotelMap(true));
    }

    initConsent();
    initStatsOptout();

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        const updateNavbar = () => navbar.classList.toggle('is-scrolled', window.scrollY > 8);
        updateNavbar();
        window.addEventListener('scroll', updateNavbar, { passive: true });
    }

    // Active Navigation Link on Scroll
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', function() {
        const scrollPos = window.scrollY + 150;
        if (!sections.length) {
            return;
        }

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-menu a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });

    initAutoHideHeader();
    initSectionNav();
    initSectionSnap();

    // Form Submission Handling
    const bookingForm = document.getElementById('mainBookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }

    const apartmentBalconyCheckbox = document.getElementById('bookingApartmentBalkon');
    if (apartmentBalconyCheckbox) {
        apartmentBalconyCheckbox.addEventListener('change', updateBookingSummary);
    }

    // Company Information Toggle
    const addCompanyBtn = document.getElementById('addCompanyBtn');
    const companyFieldsWrapper = document.getElementById('companyFieldsWrapper');
    const companyNameSection = document.getElementById('companyNameSection');
    const deleteAllCompanyBtn = document.getElementById('deleteAllCompanyBtn');
    const addCompanyAddressBtn = document.getElementById('addCompanyAddressBtn');
    const companyAddressSection = document.getElementById('companyAddressSection');

    if (addCompanyBtn) {
        addCompanyBtn.addEventListener('click', function() {
            addCompanyBtn.style.display = 'none';
            companyFieldsWrapper.style.display = 'block';
        });
    }

    if (deleteAllCompanyBtn) {
        deleteAllCompanyBtn.addEventListener('click', function() {
            // Clear all company fields
            document.getElementById('bookingCompanyName').value = '';
            document.getElementById('bookingCompanyStreet').value = '';
            document.getElementById('bookingCompanyZip').value = '';
            document.getElementById('bookingCompanyCity').value = '';
            
            // Hide all company sections
            companyFieldsWrapper.style.display = 'none';
            companyAddressSection.style.display = 'none';
            addCompanyAddressBtn.style.display = 'inline-block';
            
            // Show add button again
            addCompanyBtn.style.display = 'inline-block';
        });
    }

    if (addCompanyAddressBtn) {
        addCompanyAddressBtn.addEventListener('click', function() {
            addCompanyAddressBtn.style.display = 'none';
            companyAddressSection.style.display = 'block';
        });
    }

    // Animate Elements on Scroll (Klasse statt Inline-Styles, damit Hover-Effekte erhalten bleiben)
    const animateElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px'
        });
        animateElements.forEach(el => observer.observe(el));
    } else {
        animateElements.forEach(el => el.classList.add('is-visible'));
    }

    // Set minimum date for booking form
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        input.setAttribute('min', today);
    });

    // Update checkout date based on checkin
    const checkinInput = document.querySelector('.booking-form input[type="date"]:nth-of-type(1)');
    const checkoutInput = document.querySelector('.booking-form input[type="date"]:nth-of-type(2)');

    if (checkinInput && checkoutInput) {
        checkinInput.addEventListener('change', function() {
            const checkinDate = new Date(this.value);
            checkinDate.setDate(checkinDate.getDate() + 1);
            const minCheckout = checkinDate.toISOString().split('T')[0];
            checkoutInput.setAttribute('min', minCheckout);
            if (checkoutInput.value && checkoutInput.value <= this.value) {
                checkoutInput.value = minCheckout;
            }
        });
    }

    // ===================================
    // Booking Room Counter & Calendar
    // ===================================

    // Initialize calendar if it exists
    if (document.getElementById('bookingCalendar')) {
        renderBookingCalendar();
    }

    syncBookingHiddenFields();
});

/**
 * Header beim Runterscrollen ausblenden, beim Hochscrollen wieder zeigen.
 * Die Richtung kommt aus der Eingabe (Mausrad, Wischen, Tasten, Link-Sprung), nicht aus dem
 * Scroll-Ereignis: Das Einrasten der Sections verschiebt die Seite selbst ein Stück und soll
 * den Header nicht hin- und herschalten.
 */
function initAutoHideHeader() {
    const header = document.querySelector('.site-header');
    const menu = document.querySelector('.nav-menu');
    if (!header) {
        return;
    }

    let wantsHidden = false;

    // Am Seitenanfang und bei offenem Mobilmenü bleibt der Header immer sichtbar
    const apply = () => {
        const atTop = window.scrollY <= header.offsetHeight;
        const menuOpen = Boolean(menu) && menu.classList.contains('active');
        header.classList.toggle('is-hidden', wantsHidden && !atTop && !menuOpen);
    };

    const setHidden = hidden => {
        wantsHidden = hidden;
        apply();
    };

    window.addEventListener('scroll', apply, { passive: true });

    window.addEventListener('wheel', event => {
        if (event.deltaY !== 0) {
            setHidden(event.deltaY > 0);
        }
    }, { passive: true });

    let touchY = null;
    window.addEventListener('touchstart', event => {
        touchY = event.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchmove', event => {
        if (touchY === null) {
            return;
        }
        const deltaY = event.touches[0].clientY - touchY;
        if (Math.abs(deltaY) > 10) {
            // Finger nach oben = Seite scrollt nach unten
            setHidden(deltaY < 0);
            touchY = event.touches[0].clientY;
        }
    }, { passive: true });

    document.addEventListener('keydown', event => {
        if (event.target.closest('input, textarea, select, [contenteditable="true"]')) {
            return;
        }
        if (event.key === ' ' && event.target.closest('a, button, summary')) {
            return;
        }
        if (['ArrowDown', 'PageDown', 'End'].includes(event.key) || (event.key === ' ' && !event.shiftKey)) {
            setHidden(true);
        } else if (['ArrowUp', 'PageUp', 'Home'].includes(event.key) || (event.key === ' ' && event.shiftKey)) {
            setHidden(false);
        }
    });

    // Sprung über einen Link nach unten: Header ausblenden, damit die Section oben bündig sitzt
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', () => {
            const href = link.getAttribute('href');
            const target = href.length > 1 ? document.getElementById(href.slice(1)) : null;
            if (target && target.getBoundingClientRect().top > 0) {
                setHidden(true);
            }
        });
    });

    // Tastaturfokus im Header: wieder einblenden
    header.addEventListener('focusin', () => setHidden(false));
}

/**
 * Punkte-Navigation rechts: markiert die Section, die gerade die Bildschirmmitte kreuzt.
 */
function initSectionNav() {
    const nav = document.querySelector('.section-nav');
    if (!nav || !('IntersectionObserver' in window)) {
        return;
    }

    const links = [...nav.querySelectorAll('.section-nav-link')];

    const setActive = id => {
        links.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    // Schmales Band in der Bildschirmmitte: Die Section, die es berührt, ist die aktuelle
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActive(entry.target.id);
            }
        });
    }, { rootMargin: '-50% 0px -49% 0px' });

    links.forEach(link => {
        const section = document.getElementById(link.getAttribute('href').slice(1));
        if (section) {
            observer.observe(section);
        }
    });
}

/**
 * Sections rasten in Scroll-Richtung ein (nur Startseite, nicht bei „Bewegung reduzieren“).
 * - Mausrad und Tasten: Schon ein kleiner Schritt startet eine weiche Fahrt zur nächsten Section.
 * - Touch: Nach dem Loslassen gleitet die Seite in Wischrichtung zur nächsten Section weiter.
 * - Sections, die höher als das Fenster sind, lassen sich darin frei scrollen; an ihrem
 *   Anfang bzw. Ende wird kurz angehalten, der nächste Schritt führt dann weiter.
 * Andere Scrollbewegungen (Links, Tastaturfokus, Formular-Fehler) lösen nichts aus.
 */
function initSectionSnap() {
    const sections = [...document.querySelectorAll('main > section')];
    if (!document.querySelector('.section-nav') || !sections.length) {
        return;
    }

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation = null;       // laufende Fahrt (requestAnimationFrame-ID)
    let lockUntil = 0;          // schluckt nachlaufende Trackpad-Impulse nach einer Fahrt
    let settledY = window.scrollY;
    let userScrolled = false;   // nur echte Scroll-Eingaben lösen das Einrasten aus
    let touchActive = false;
    let touchStartY = 0;
    let settleTimer = null;

    const maxScroll = () => root.scrollHeight - window.innerHeight;
    const clamp = y => Math.min(Math.max(y, 0), maxScroll());

    const isBlocked = () => reduceMotion.matches
        || document.body.style.overflow === 'hidden'                 // Galerie offen
        || document.querySelector('.nav-menu.active') !== null       // Mobilmenü offen
        || (window.visualViewport && window.visualViewport.scale > 1.01); // hineingezoomt

    // Section-Grenzen im Dokument; der Hero beginnt am Seitenanfang
    const bounds = () => sections.map((section, index) => {
        const rect = section.getBoundingClientRect();
        return {
            top: index === 0 ? 0 : Math.round(rect.top + window.scrollY),
            bottom: Math.round(rect.bottom + window.scrollY),
        };
    });

    // Rastpunkt für Position y in Richtung dir, oder null, wenn die Position frei bleiben darf
    const targetFor = (y, dir) => {
        const viewport = window.innerHeight;
        const max = maxScroll();
        if ((dir > 0 && y >= max - 1) || (dir < 0 && y <= 1)) {
            return null;
        }
        const list = bounds();
        const index = list.findIndex(b => y >= b.top - 1 && y < b.bottom - 1);
        if (index === -1) {
            return null; // im Footer
        }
        const current = list[index];
        if (Math.abs(y - current.top) <= 1 || current.bottom - y >= viewport) {
            return null; // an einer Section-Kante oder ganz innerhalb einer langen Section
        }
        if (dir > 0) {
            const next = list[index + 1];
            return Math.min(next ? next.top : max, max);
        }
        // Hoch: eine lange Section ab ihrem Ende zeigen, eine kurze ab ihrem Anfang
        return current.bottom - current.top > viewport ? current.bottom - viewport : current.top;
    };

    // Ziel für einen Schritt (Mausrad, Taste) von der aktuellen Position aus – höchstens eine Section weit
    const stepTarget = delta => {
        const y = window.scrollY;
        const dir = Math.sign(delta);
        const next = clamp(y + delta);
        const viewport = window.innerHeight;
        const list = bounds();
        // Haltepunkte: Anfang jeder Section, bei langen Sections zusätzlich ihr Ende
        const stops = list.flatMap(b => (b.bottom - b.top > viewport ? [b.top, b.bottom - viewport] : [b.top]));
        if (dir > 0) {
            const nearest = Math.min(...stops.filter(stop => stop > y + 1), maxScroll());
            if (next >= nearest) {
                return nearest;
            }
        } else {
            const nearest = Math.max(...stops.filter(stop => stop < y - 1), 0);
            if (next <= nearest) {
                return nearest;
            }
        }
        // Der Schritt bleibt vor dem nächsten Haltepunkt: frei scrollen oder (bei Zwischenlage) einrasten
        return targetFor(next, dir);
    };

    const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const stopAnimation = () => {
        if (animation !== null) {
            cancelAnimationFrame(animation);
            animation = null;
            root.style.scrollBehavior = '';
            settledY = window.scrollY;
        }
    };

    const animateTo = target => {
        stopAnimation();
        const start = window.scrollY;
        const distance = target - start;
        if (Math.abs(distance) < 2) {
            settledY = target;
            return;
        }
        const duration = Math.min(900, Math.max(280, 300 + Math.abs(distance) * 0.4));
        const startTime = performance.now();
        // CSS-„smooth“ würde jeden Einzelschritt erneut animieren
        root.style.scrollBehavior = 'auto';
        const step = now => {
            const progress = Math.min(1, (now - startTime) / duration);
            window.scrollTo(0, start + distance * easeInOutCubic(progress));
            if (progress < 1) {
                animation = requestAnimationFrame(step);
            } else {
                animation = null;
                root.style.scrollBehavior = '';
                settledY = window.scrollY;
                userScrolled = false;
            }
        };
        animation = requestAnimationFrame(step);
    };

    // Mausrad/Taste: Liegt die Position nach diesem Schritt nicht frei, direkt zur Section fahren
    const handleStep = (event, delta) => {
        const now = performance.now();
        if (animation !== null || now < lockUntil) {
            event.preventDefault();
            lockUntil = now + 140;
            return;
        }
        const target = stepTarget(delta);
        if (target === null) {
            userScrolled = true; // frei scrollen, der Browser übernimmt
            return;
        }
        event.preventDefault();
        lockUntil = now + 140;
        animateTo(target);
    };

    // Inneres Element (z. B. Textfeld, Cookie-Banner), das in diese Richtung selbst noch scrollen kann
    const scrollsInside = (element, dir) => {
        for (let node = element; node && node !== document.body; node = node.parentElement) {
            const overflowY = getComputedStyle(node).overflowY;
            if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
                const canScroll = dir > 0
                    ? node.scrollTop + node.clientHeight < node.scrollHeight - 1
                    : node.scrollTop > 0;
                if (canScroll) {
                    return true;
                }
            }
        }
        return false;
    };

    window.addEventListener('wheel', event => {
        if (event.ctrlKey || isBlocked() || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
            return;
        }
        let delta = event.deltaY;
        if (event.deltaMode === 1) {
            delta *= 40;
        } else if (event.deltaMode === 2) {
            delta *= window.innerHeight;
        }
        if (delta === 0 || scrollsInside(event.target, Math.sign(delta))) {
            return;
        }
        handleStep(event, delta);
    }, { passive: false });

    document.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isBlocked()) {
            return;
        }
        if (event.target.closest('input, textarea, select, [contenteditable="true"]')) {
            return;
        }
        const page = window.innerHeight * 0.85;
        let delta = { ArrowDown: 40, ArrowUp: -40, PageDown: page, PageUp: -page }[event.key];
        if (event.key === ' ') {
            if (event.target.closest('a, button, summary')) {
                return;
            }
            delta = event.shiftKey ? -page : page;
        }
        if (delta !== undefined) {
            handleStep(event, delta);
        }
    });

    // Touch: der Browser scrollt selbst (inkl. Ausrollen); danach in Wischrichtung einrasten
    const onSettle = () => {
        settleTimer = null;
        if (touchActive || animation !== null) {
            return;
        }
        const y = window.scrollY;
        const dir = Math.sign(y - settledY);
        const intended = userScrolled;
        userScrolled = false;
        settledY = y;
        if (!intended || dir === 0 || isBlocked()) {
            return;
        }
        const target = targetFor(y, dir);
        if (target !== null) {
            animateTo(target);
        }
    };

    const scheduleSettle = () => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(onSettle, 90);
    };

    window.addEventListener('scroll', () => {
        if (animation === null) {
            scheduleSettle();
        }
    }, { passive: true });

    window.addEventListener('touchstart', event => {
        touchActive = true;
        touchStartY = event.touches[0].clientY;
        stopAnimation(); // Finger greift: laufende Fahrt sofort anhalten
    }, { passive: true });

    window.addEventListener('touchmove', event => {
        if (Math.abs(event.touches[0].clientY - touchStartY) > 10) {
            userScrolled = true;
        }
    }, { passive: true });

    const onTouchEnd = () => {
        touchActive = false;
        scheduleSettle();
    };
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
}

// Room Counter State
// Alle buchbaren Zimmertypen: Schlüssel = Feldname für booking.php, ID-Suffix der Hidden-Inputs
const BOOKING_ROOM_TYPES = {
    einzelzimmer: { name: 'Einzelzimmer', plural: 'Einzelzimmer', inputId: 'bookingCountEinzelzimmer' },
    doppelzimmer: { name: 'Doppelzimmer', plural: 'Doppelzimmer', inputId: 'bookingCountDoppelzimmer' },
    zweibettzimmer: { name: 'Zweibettzimmer', plural: 'Zweibettzimmer', inputId: 'bookingCountZweibettzimmer' },
    familienzimmer: { name: 'Familienzimmer', plural: 'Familienzimmer', inputId: 'bookingCountFamilienzimmer' },
    apartment: { name: 'Apartment', plural: 'Apartments', inputId: 'bookingCountApartment' },
};

const bookingCounters = Object.fromEntries(Object.keys(BOOKING_ROOM_TYPES).map(room => [room, 0]));

function syncBookingHiddenFields() {
    const checkinInput = document.getElementById('bookingCheckinInput');
    if (checkinInput) {
        checkinInput.value = bookingSelectedCheckin ? serializeBookingDate(bookingSelectedCheckin) : '';
    }

    const checkoutInput = document.getElementById('bookingCheckoutInput');
    if (checkoutInput) {
        checkoutInput.value = bookingSelectedCheckout ? serializeBookingDate(bookingSelectedCheckout) : '';
    }

    for (const [room, type] of Object.entries(BOOKING_ROOM_TYPES)) {
        const input = document.getElementById(type.inputId);
        if (input) {
            input.value = String(bookingCounters[room] ?? 0);
        }
    }

    // Balkon-Wunsch nur möglich, wenn mindestens ein Apartment gewählt ist
    const balconyCheckbox = document.getElementById('bookingApartmentBalkon');
    if (balconyCheckbox) {
        const hasApartment = bookingCounters.apartment > 0;
        balconyCheckbox.disabled = !hasApartment;
        if (!hasApartment) {
            balconyCheckbox.checked = false;
        }
    }
}

const bookingRoomLimitWarned = Object.fromEntries(Object.keys(BOOKING_ROOM_TYPES).map(room => [room, false]));

const bookingPrices = {
    einzelzimmer: 62,
    doppelzimmer: 86,
    zweibettzimmer: 86,
    familienzimmer: 114,
    apartment: 115
};

// Calendar State
let bookingCurrentDate = new Date();
let bookingSelectedCheckin = null;
let bookingSelectedCheckout = null;
let bookingSelectingCheckout = false;

const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                   'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// Update Room Counter
function updateRoomCounter(room, change) {
    const maxForRoom = BOOKING_SECURITY_CONFIG.maxRooms[room] ?? Infinity;
    const currentValue = bookingCounters[room];
    let nextValue = currentValue + change;
    nextValue = Math.max(0, Math.min(maxForRoom, nextValue));

    if (nextValue === currentValue && change > 0 && currentValue >= maxForRoom && !bookingRoomLimitWarned[room]) {
        const roomName = BOOKING_ROOM_TYPES[room].plural;
        showBookingMessage(`Es stehen maximal ${maxForRoom} ${roomName} gleichzeitig zur Verfügung.`, 'error');
        bookingRoomLimitWarned[room] = true;
    }

    if (nextValue < maxForRoom) {
        bookingRoomLimitWarned[room] = false;
    }

    if (nextValue === currentValue) {
        return;
    }

    bookingCounters[room] = nextValue;
    document.getElementById(`booking-count-${room}`).textContent = bookingCounters[room];

    const card = document.querySelector(`[data-room="${room}"]`);
    if (bookingCounters[room] > 0) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }

    updateBookingSummary();
    updateBookingSubmitButton();
    syncBookingHiddenFields();
}

// Update Summary
function updateBookingSummary() {
    const summary = document.getElementById('bookingSummary');
    const content = document.getElementById('bookingSummaryContent');

    let hasSelection = false;
    let total = 0;
    let html = '';

    for (const [room, count] of Object.entries(bookingCounters)) {
        if (count > 0) {
            hasSelection = true;
            const roomTotal = count * bookingPrices[room];
            total += roomTotal;
            let roomName = BOOKING_ROOM_TYPES[room].name;
            if (room === 'apartment' && document.getElementById('bookingApartmentBalkon')?.checked) {
                roomName += ' mit Balkon';
            }
            html += `
                <div class="booking-summary-item">
                    <span>${count}x ${roomName}</span>
                    <span>${roomTotal.toFixed(2)} €</span>
                </div>
            `;
        }
    }

    if (hasSelection) {
        html += `
            <div class="booking-summary-item">
                <span><strong>Gesamt pro Nacht</strong></span>
                <span><strong>${total.toFixed(2)} €</strong></span>
            </div>
        `;
        content.innerHTML = html;
        summary.style.display = 'block';
    } else {
        summary.style.display = 'none';
    }
}

// Update Submit Button
function updateBookingSubmitButton() {
    const hasSelection = Object.values(bookingCounters).some(count => count > 0);
    const hasDates = bookingSelectedCheckin && bookingSelectedCheckout;
    const submitBtn = document.getElementById('bookingSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = !(hasSelection && hasDates);
    }
}

// Toggle Calendar
function toggleBookingCalendar() {
    const calendar = document.getElementById('bookingCalendar');
    const inputBox = document.querySelector('.date-input-box');
    calendar.classList.toggle('active');
    inputBox.classList.toggle('active');
    inputBox.setAttribute('aria-expanded', calendar.classList.contains('active'));
    if (calendar.classList.contains('active')) {
        renderBookingCalendar();
    }
}

function closeBookingCalendar() {
    const calendar = document.getElementById('bookingCalendar');
    const inputBox = document.querySelector('.date-input-box');
    const focusWasInCalendar = calendar.contains(document.activeElement);
    calendar.classList.remove('active');
    inputBox.classList.remove('active');
    inputBox.setAttribute('aria-expanded', 'false');
    if (focusWasInCalendar) {
        inputBox.focus();
    }
}

// Change Month
function changeBookingMonth(direction) {
    bookingCurrentDate.setMonth(bookingCurrentDate.getMonth() + direction);
    renderBookingCalendar();
}

// Render Calendar
function renderBookingCalendar() {
    const year = bookingCurrentDate.getFullYear();
    const month = bookingCurrentDate.getMonth();

    document.getElementById('bookingCalendarMonth').textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayWeekday = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    const daysContainer = document.getElementById('bookingCalendarDays');
    daysContainer.innerHTML = '';

    // Previous month days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
        const day = createBookingDayElement(prevLastDate - i, true, year, month - 1);
        day.classList.add('other-month');
        daysContainer.appendChild(day);
    }

    // Current month days
    for (let i = 1; i <= lastDate; i++) {
        const day = createBookingDayElement(i, false, year, month);
        daysContainer.appendChild(day);
    }

    // Next month days
    const remainingDays = 42 - daysContainer.children.length;
    for (let i = 1; i <= remainingDays; i++) {
        const day = createBookingDayElement(i, true, year, month + 1);
        day.classList.add('other-month');
        daysContainer.appendChild(day);
    }
}

// Create Day Element
function createBookingDayElement(dayNum, disabled, year, month) {
    // Echte Buttons, damit die Tage auch per Tastatur und Screenreader wählbar sind
    const day = document.createElement('button');
    day.type = 'button';
    day.className = 'calendar-day';
    day.textContent = dayNum;

    const date = new Date(year, month, dayNum);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setHours(0, 0, 0, 0);
    maxDate.setDate(maxDate.getDate() + BOOKING_SECURITY_CONFIG.maxAdvanceDays);

    day.setAttribute('aria-label', `${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}`);

    if (disabled) {
        // Tage aus Nachbarmonaten sind nur Platzhalter im Raster
        day.disabled = true;
        day.tabIndex = -1;
        day.setAttribute('aria-hidden', 'true');
    }

    if (date < today || disabled || date > maxDate) {
        day.classList.add('disabled');
        day.disabled = true;
    } else {
        day.onclick = () => selectBookingDate(date);

        if (bookingSelectedCheckin && date.getTime() === bookingSelectedCheckin.getTime()) {
            day.classList.add('start');
            day.setAttribute('aria-pressed', 'true');
        }
        if (bookingSelectedCheckout && date.getTime() === bookingSelectedCheckout.getTime()) {
            day.classList.add('end');
            day.setAttribute('aria-pressed', 'true');
        }
        if (bookingSelectedCheckin && bookingSelectedCheckout &&
            date > bookingSelectedCheckin && date < bookingSelectedCheckout) {
            day.classList.add('in-range');
        }
    }

    return day;
}

// Select Date
function selectBookingDate(date) {
    if (!bookingSelectingCheckout) {
        bookingSelectedCheckin = date;
        bookingSelectedCheckout = null;
        bookingSelectingCheckout = true;
        updateBookingDateDisplay();
    } else {
        if (date > bookingSelectedCheckin) {
            bookingSelectedCheckout = date;
            bookingSelectingCheckout = false;
            updateBookingDateDisplay();
            setTimeout(closeBookingCalendar, 300);
        } else {
            bookingSelectedCheckin = date;
            bookingSelectedCheckout = null;
        }
    }
    renderBookingCalendar();
    updateBookingSubmitButton();

    // Fokus nach dem Neuzeichnen wieder auf den gewählten Tag setzen
    const dayLabel = `${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    const dayButton = document.querySelector(`#bookingCalendarDays .calendar-day[aria-label="${dayLabel}"]:not([aria-hidden])`);
    if (dayButton) {
        dayButton.focus();
    }
}

// Update Date Display
function updateBookingDateDisplay() {
    const checkinDisplay = document.getElementById('bookingCheckinDisplay');
    const checkoutDisplay = document.getElementById('bookingCheckoutDisplay');
    const nightsInfo = document.getElementById('bookingNightsInfo');
    const nightsCount = document.getElementById('bookingNightsCount');

    if (bookingSelectedCheckin) {
        checkinDisplay.textContent = formatBookingDate(bookingSelectedCheckin);
        checkinDisplay.classList.remove('placeholder');
    }

    if (bookingSelectedCheckout) {
        checkoutDisplay.textContent = formatBookingDate(bookingSelectedCheckout);
        checkoutDisplay.classList.remove('placeholder');

        // Calculate nights
        const diffDays = calculateBookingNights(bookingSelectedCheckin, bookingSelectedCheckout);
        if (diffDays > 0) {
            nightsCount.textContent = `${diffDays} ${diffDays === 1 ? 'Nacht' : 'Nächte'}`;
            nightsInfo.style.display = 'block';
        } else {
            nightsInfo.style.display = 'none';
        }
    } else {
        nightsInfo.style.display = 'none';
    }

    syncBookingHiddenFields();
}

// Format Date
function formatBookingDate(date) {
    const day = date.getDate();
    const monthNamesShort = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const month = monthNamesShort[date.getMonth()];
    const year = date.getFullYear();
    return `${day}. ${month} ${year}`;
}

// ===================================
// Room Gallery (Lightbox)
// ===================================

// FOTO-TODO: Sobald neue Zimmerfotos (mind. 1600×1067 px) vorliegen, hier ergänzen.
const roomGalleries = {
    einzelzimmer: [
        { src: 'images/zimmer/Zimmer_EZ_small.jpg', caption: 'Einzelzimmer – ruhig und gemütlich' },
        { src: 'images/zimmer/wohnen_roessle2.jpg', caption: 'Badezimmer mit Dusche und WC' }
    ],
    doppelzimmer: [
        { src: 'images/zimmer/wohnen_roessle_5.jpg', caption: 'Doppelzimmer – komfortabel für zwei' },
        { src: 'images/zimmer/Zimmer_DZ_small.jpg', caption: 'Doppelzimmer' },
        { src: 'images/zimmer/wohnen_roessle2.jpg', caption: 'Badezimmer mit Dusche und WC' }
    ],
    familienzimmer: [
        { src: 'images/zimmer/wohnen_roessle4.jpg', caption: 'Familienzimmer – Platz für bis zu 4 Personen' },
        { src: 'images/zimmer/Zimmer_FZ_small.jpg', caption: 'Familienzimmer mit Sitzecke' },
        { src: 'images/zimmer/wohnen_roessle2.jpg', caption: 'Badezimmer mit Dusche und WC' }
    ],
    apartment: [
        { src: 'images/apartment/apartment-wohnraum.jpg', caption: 'Apartment – Wohn- und Schlafbereich mit Sitzecke' },
        { src: 'images/apartment/apartment-schlafbereich.jpg', caption: 'Apartment – Schlafbereich mit TV' },
        { src: 'images/apartment/apartment-kueche.jpg', caption: 'Apartment – eigene Küche mit Geschirr' },
        { src: 'images/apartment/apartment-kuechenzeile.jpg', caption: 'Apartment – Küchenzeile mit Spüle' },
        { src: 'images/apartment/apartment-bad.jpg', caption: 'Apartment – Bad mit Dusche und Waschmaschine' }
    ]
};

let galleryReturnFocus = null;

let currentGallery = [];
let currentImageIndex = 0;

// Touch/Swipe variables
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

function openRoomGallery(roomType) {
    currentGallery = roomGalleries[roomType] || [];
    if (currentGallery.length === 0) return;

    currentImageIndex = 0;
    galleryReturnFocus = document.activeElement;
    const modal = document.getElementById('roomGalleryModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling

    updateGalleryImage();
    renderGalleryDots();

    const closeButton = modal.querySelector('.gallery-close');
    if (closeButton) {
        closeButton.focus();
    }

    // Add keyboard navigation
    document.addEventListener('keydown', handleGalleryKeyboard);

    // Add touch/swipe navigation for mobile
    const galleryImage = document.getElementById('galleryImage');
    const imageWrapper = document.querySelector('.gallery-image-wrapper');

    galleryImage.addEventListener('touchstart', handleGalleryTouchStart, { passive: true });
    galleryImage.addEventListener('touchend', handleGalleryTouchEnd, { passive: false });
    galleryImage.addEventListener('click', handleGalleryTap);

    imageWrapper.addEventListener('touchstart', handleGalleryTouchStart, { passive: true });
    imageWrapper.addEventListener('touchend', handleGalleryTouchEnd, { passive: false });
}

function closeRoomGallery() {
    const modal = document.getElementById('roomGalleryModal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling

    // Remove keyboard navigation
    document.removeEventListener('keydown', handleGalleryKeyboard);

    // Remove touch navigation
    const galleryImage = document.getElementById('galleryImage');
    const imageWrapper = document.querySelector('.gallery-image-wrapper');

    if (galleryImage) {
        galleryImage.removeEventListener('touchstart', handleGalleryTouchStart);
        galleryImage.removeEventListener('touchend', handleGalleryTouchEnd);
        galleryImage.removeEventListener('click', handleGalleryTap);
    }

    if (imageWrapper) {
        imageWrapper.removeEventListener('touchstart', handleGalleryTouchStart);
        imageWrapper.removeEventListener('touchend', handleGalleryTouchEnd);
    }

    if (galleryReturnFocus && typeof galleryReturnFocus.focus === 'function') {
        galleryReturnFocus.focus();
    }
    galleryReturnFocus = null;
}

function nextRoomImage() {
    if (currentImageIndex < currentGallery.length - 1) {
        currentImageIndex++;
        updateGalleryImage();
    }
}

function prevRoomImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updateGalleryImage();
    }
}

function goToGalleryImage(index) {
    currentImageIndex = index;
    updateGalleryImage();
}

function getOptimizedImageSources(imageSrc) {
    if (!imageSrc || typeof imageSrc !== 'string') {
        return {};
    }

    if (!imageSrc.startsWith('images/')) {
        return {};
    }

    const extensionMatch = imageSrc.match(/\.([a-z0-9]+)$/i);
    if (!extensionMatch) {
        return {};
    }

    const extension = extensionMatch[1].toLowerCase();

    if (extension === 'svg') {
        return {};
    }

    const optimizedBasePath = imageSrc
        .replace(/^images\//, 'images/optimized/')
        .replace(/\.[^.]+$/, '');

    return {
        avif: `${optimizedBasePath}.avif`,
        webp: `${optimizedBasePath}.webp`
    };
}

function updateGalleryPictureSources(imageSrc) {
    const picture = document.getElementById('galleryImageWrapper');
    if (!picture) {
        return;
    }

    const optimizedSources = getOptimizedImageSources(imageSrc);
    const avifSource = picture.querySelector('source[type="image/avif"]');
    const webpSource = picture.querySelector('source[type="image/webp"]');

    if (avifSource) {
        if (optimizedSources.avif) {
            avifSource.srcset = optimizedSources.avif;
        } else {
            avifSource.removeAttribute('srcset');
        }
    }

    if (webpSource) {
        if (optimizedSources.webp) {
            webpSource.srcset = optimizedSources.webp;
        } else {
            webpSource.removeAttribute('srcset');
        }
    }
}

function updateGalleryImage() {
    const image = currentGallery[currentImageIndex];
    const galleryImage = document.getElementById('galleryImage');
    const galleryCaption = document.getElementById('galleryCaption');
    const galleryCounter = document.getElementById('galleryCounter');
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');

    // Update image with fade effect
    galleryImage.style.opacity = '0';
    setTimeout(() => {
        updateGalleryPictureSources(image.src);
        galleryImage.src = image.src;
        galleryImage.alt = image.caption;
        galleryCaption.textContent = image.caption;
        galleryImage.style.opacity = '1';
    }, 150);

    // Update counter
    galleryCounter.textContent = `${currentImageIndex + 1} / ${currentGallery.length}`;

    // Update navigation buttons
    prevBtn.disabled = currentImageIndex === 0;
    nextBtn.disabled = currentImageIndex === currentGallery.length - 1;

    // Update dots
    updateGalleryDots();
}

function renderGalleryDots() {
    const dotsContainer = document.getElementById('galleryDots');
    dotsContainer.innerHTML = '';

    currentGallery.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'gallery-dot';
        dot.setAttribute('aria-label', `Bild ${index + 1} von ${currentGallery.length}`);
        if (index === currentImageIndex) {
            dot.classList.add('active');
        }
        dot.onclick = () => goToGalleryImage(index);
        dotsContainer.appendChild(dot);
    });
}

function updateGalleryDots() {
    const dots = document.querySelectorAll('.gallery-dot');
    dots.forEach((dot, index) => {
        if (index === currentImageIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function handleGalleryKeyboard(e) {
    if (e.key === 'ArrowLeft') {
        prevRoomImage();
    } else if (e.key === 'ArrowRight') {
        nextRoomImage();
    } else if (e.key === 'Escape') {
        closeRoomGallery();
    } else if (e.key === 'Tab') {
        // Fokus innerhalb des Dialogs halten
        const modal = document.getElementById('roomGalleryModal');
        const focusable = Array.from(modal.querySelectorAll('button:not(:disabled)'));
        if (focusable.length === 0) {
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

// Touch/Swipe handlers
function handleGalleryTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}

function handleGalleryTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleGallerySwipe();
}

function handleGallerySwipe() {
    const swipeThreshold = 50; // Minimum distance for swipe
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Check if horizontal swipe is dominant (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > swipeThreshold) {
            // Swipe right → Previous image
            prevRoomImage();
            triggerHapticFeedback();
        } else if (deltaX < -swipeThreshold) {
            // Swipe left → Next image
            nextRoomImage();
            triggerHapticFeedback();
        }
    }
}

// Tap navigation on image sides (works on all devices)
function handleGalleryTap(e) {
    const imageRect = e.target.getBoundingClientRect();
    const clickX = e.clientX || (e.touches && e.touches[0].clientX);
    const imageWidth = imageRect.width;

    if (clickX) {
        const relativeX = clickX - imageRect.left;

        // Left 30% → Previous
        if (relativeX < imageWidth * 0.3) {
            prevRoomImage();
            triggerHapticFeedback();
        }
        // Right 30% → Next
        else if (relativeX > imageWidth * 0.7) {
            nextRoomImage();
            triggerHapticFeedback();
        }
        // Middle 40% → Do nothing (reserved for future zoom feature)
    }
}

// Haptic feedback for mobile devices
function triggerHapticFeedback() {
    if ('vibrate' in navigator) {
        navigator.vibrate(10); // Short vibration (10ms)
    }
}

// ===================================
// Booking API Integration
// ===================================

/**
 * Behandelt das Absenden des Buchungsformulars
 */
async function handleBookingSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('bookingSubmitBtn');
    const originalBtnText = submitBtn.textContent;

    syncBookingHiddenFields();
    // Formulardaten sammeln
    const formData = new FormData(e.target);
    const honeypotValue = (formData.get('company') || '').toString().trim();
    if (honeypotValue !== '') {
        showBookingMessage('Die Anfrage konnte nicht gesendet werden. Bitte kontaktieren Sie uns telefonisch.', 'error');
        return;
    }

    const bookingData = {
        vorname: (formData.get('vorname') || '').toString().trim(),
        nachname: (formData.get('nachname') || '').toString().trim(),
        email: (formData.get('email') || '').toString().trim(),
        telefon: (formData.get('telefon') || '').toString().trim(),
        checkin: bookingSelectedCheckin ? serializeBookingDate(bookingSelectedCheckin) : null,
        checkout: bookingSelectedCheckout ? serializeBookingDate(bookingSelectedCheckout) : null,
        ...Object.fromEntries(Object.keys(BOOKING_ROOM_TYPES).map(room => [room, bookingCounters[room] || 0])),
        wuensche: (formData.get('wuensche') || '').toString().trim(),
        origin: window.location.origin,
        userAgent: navigator.userAgent,
        privacyAccepted: document.getElementById('bookingPrivacy')?.checked ?? false,
        company: honeypotValue,
    };

    // Validierung
    if (!bookingData.privacyAccepted) {
        showBookingMessage('Bitte bestätigen Sie die Datenschutzerklärung, bevor Sie die Anfrage absenden.', 'error');
        return;
    }

    const validation = validateBookingForm(bookingData, bookingSelectedCheckin, bookingSelectedCheckout);
    if (!validation.valid) {
        showBookingMessage(validation.message || 'Bitte überprüfen Sie Ihre Eingaben.', 'error');
        return;
    }

    delete bookingData.privacyAccepted;

    // FormData für den Versand vorbereiten
    formData.set('vorname', bookingData.vorname);
    formData.set('nachname', bookingData.nachname);
    formData.set('email', bookingData.email);
    formData.set('telefon', bookingData.telefon);
    formData.set('wuensche', bookingData.wuensche);
    formData.set('checkin', bookingData.checkin ?? '');
    formData.set('checkout', bookingData.checkout ?? '');
    for (const room of Object.keys(BOOKING_ROOM_TYPES)) {
        formData.set(room, String(bookingData[room] ?? 0));
    }
    formData.set('origin', bookingData.origin);
    formData.set('userAgent', bookingData.userAgent);

    // Button-Status ändern
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Wird gesendet...';

    try {
        const apiResponse = await fetch(BOOKING_FORM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
            },
            body: formData,
        });

        const responseText = await apiResponse.text();
        let response;
        try {
            response = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Der Server hat eine unerwartete Antwort zurückgegeben.');
        }

        if (!apiResponse.ok || !response.success) {
            const errorMessage = typeof response?.message === 'string' && response.message.trim().length > 0
                ? response.message
                : `Die Anfrage konnte nicht verarbeitet werden (Status ${apiResponse.status}).`;
            throw new Error(errorMessage);
        }

        trackBookingRequest();

        showBookingMessage(
            '✅ Buchungsanfrage erfolgreich übermittelt!\n\n' +
            'Vielen Dank für Ihre Anfrage. Wir melden uns zeitnah per E-Mail, um die Details zu bestätigen.',
            'success'
        );

        e.target.reset();
        resetBookingForm();

    } catch (error) {
        console.error('Booking submission error:', error);
        const fallbackMessage = typeof error?.message === 'string' && error.message.trim().length > 0
            ? error.message
            : 'Es ist ein unbekannter Fehler aufgetreten.';
        showBookingMessage(
            `❌ ${fallbackMessage}\n\nBitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch unter +49 (0) 7461 2913.`,
            'error'
        );
    } finally {
        // Button zurücksetzen
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

/**
 * Validiert die Buchungsformular-Daten
 */
function validateBookingForm(data, checkinDate, checkoutDate) {
    if (!data.vorname || !data.nachname || !data.email || !data.telefon) {
        return { valid: false, message: 'Bitte füllen Sie alle Pflichtfelder aus.' };
    }

    if (!checkinDate || !checkoutDate) {
        return { valid: false, message: 'Bitte wählen Sie An- und Abreisedatum aus.' };
    }

    const trimmedFirstName = data.vorname.trim();
    const trimmedLastName = data.nachname.trim();
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/;
    if (!nameRegex.test(trimmedFirstName) || !nameRegex.test(trimmedLastName)) {
        return { valid: false, message: 'Bitte geben Sie einen gültigen Vor- und Nachnamen ein.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        return { valid: false, message: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' };
    }

    const phoneRegex = /^[0-9+()\s-]{6,}$/;
    if (!phoneRegex.test(data.telefon)) {
        return { valid: false, message: 'Bitte geben Sie eine gültige Telefonnummer an.' };
    }

    const totalRooms = Object.keys(BOOKING_ROOM_TYPES).reduce((sum, room) => sum + (data[room] || 0), 0);
    if (totalRooms === 0) {
        return { valid: false, message: 'Bitte wählen Sie mindestens ein Zimmer aus.' };
    }

    if (totalRooms > BOOKING_SECURITY_CONFIG.maxRoomsTotal) {
        return {
            valid: false,
            message: `Maximal ${BOOKING_SECURITY_CONFIG.maxRoomsTotal} Zimmer können pro Anfrage gebucht werden.`,
        };
    }

    for (const [room, max] of Object.entries(BOOKING_SECURITY_CONFIG.maxRooms)) {
        if ((data[room] || 0) > max) {
            const roomName = BOOKING_ROOM_TYPES[room].plural;
            return {
                valid: false,
                message: `Es können maximal ${max} ${roomName} gleichzeitig angefragt werden.`,
            };
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalizedCheckin = new Date(checkinDate.getTime());
    normalizedCheckin.setHours(0, 0, 0, 0);
    const normalizedCheckout = new Date(checkoutDate.getTime());
    normalizedCheckout.setHours(0, 0, 0, 0);

    if (normalizedCheckin < today) {
        return { valid: false, message: 'Der Check-in darf nicht in der Vergangenheit liegen.' };
    }

    if (normalizedCheckout <= normalizedCheckin) {
        return { valid: false, message: 'Der Check-out muss nach dem Check-in liegen.' };
    }

    const nights = calculateBookingNights(normalizedCheckin, normalizedCheckout);
    if (nights < BOOKING_SECURITY_CONFIG.minNights) {
        return {
            valid: false,
            message: `Es muss mindestens ${BOOKING_SECURITY_CONFIG.minNights} Nacht gebucht werden.`,
        };
    }

    if (nights > BOOKING_SECURITY_CONFIG.maxNights) {
        return {
            valid: false,
            message: `Es können maximal ${BOOKING_SECURITY_CONFIG.maxNights} Nächte am Stück gebucht werden.`,
        };
    }

    const maxAdvanceDate = new Date(today.getTime());
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + BOOKING_SECURITY_CONFIG.maxAdvanceDays);
    if (normalizedCheckin > maxAdvanceDate) {
        return {
            valid: false,
            message: 'Der Check-in darf höchstens ein Jahr im Voraus liegen.',
        };
    }

    if (data.wuensche && data.wuensche.length > 1000) {
        return { valid: false, message: 'Das Feld für besondere Wünsche ist zu lang.' };
    }

    return { valid: true };
}

/**
 * Zeigt eine Nachricht nach dem Buchungsversuch
 */
function showBookingMessage(message, type) {
    // Entferne alte Nachrichten
    const existingMessage = document.querySelector('.booking-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Erstelle neue Nachricht (Text per textContent, Zeilenumbrüche über CSS white-space)
    const messageDiv = document.createElement('div');
    messageDiv.className = `booking-message booking-message-${type}`;
    messageDiv.setAttribute('role', type === 'error' ? 'alert' : 'status');

    const content = document.createElement('div');
    content.className = 'booking-message-content';

    const text = document.createElement('p');
    text.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'booking-message-close';
    closeButton.textContent = 'Schließen';
    closeButton.addEventListener('click', () => messageDiv.remove());

    content.append(text, closeButton);
    messageDiv.appendChild(content);

    // Einfügen vor dem Formular
    const bookingSection = document.getElementById('buchen');
    const container = bookingSection.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);

    // Scroll zur Nachricht
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto-Remove nach 10 Sekunden (nur bei Erfolg)
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv && messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 10000);
    }
}

/**
 * Setzt das Buchungsformular zurück
 */
function resetBookingForm() {
    // Counter zurücksetzen
    for (const room of Object.keys(BOOKING_ROOM_TYPES)) {
        bookingCounters[room] = 0;
        bookingRoomLimitWarned[room] = false;
        const counter = document.getElementById(`booking-count-${room}`);
        if (counter) {
            counter.textContent = '0';
        }
    }

    // Selected-Klasse entfernen
    document.querySelectorAll('.booking-room-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Datum zurücksetzen
    bookingSelectedCheckin = null;
    bookingSelectedCheckout = null;
    bookingSelectingCheckout = false;

    document.getElementById('bookingCheckinDisplay').textContent = 'Datum wählen';
    document.getElementById('bookingCheckinDisplay').classList.add('placeholder');
    document.getElementById('bookingCheckoutDisplay').textContent = 'Datum wählen';
    document.getElementById('bookingCheckoutDisplay').classList.add('placeholder');
    document.getElementById('bookingNightsInfo').style.display = 'none';

    // Summary verstecken
    document.getElementById('bookingSummary').style.display = 'none';

    // Submit-Button deaktivieren
    document.getElementById('bookingSubmitBtn').disabled = true;

    // Company information zurücksetzen
    const addCompanyBtn = document.getElementById('addCompanyBtn');
    const companyFieldsWrapper = document.getElementById('companyFieldsWrapper');
    const companyAddressSection = document.getElementById('companyAddressSection');
    const addCompanyAddressBtn = document.getElementById('addCompanyAddressBtn');
    
    if (addCompanyBtn && companyFieldsWrapper) {
        addCompanyBtn.style.display = 'inline-block';
        companyFieldsWrapper.style.display = 'none';
        document.getElementById('bookingCompanyName').value = '';
    }
    
    if (companyAddressSection && addCompanyAddressBtn) {
        companyAddressSection.style.display = 'none';
        addCompanyAddressBtn.style.display = 'inline-block';
        document.getElementById('bookingCompanyStreet').value = '';
        document.getElementById('bookingCompanyZip').value = '';
        document.getElementById('bookingCompanyCity').value = '';
    }

    syncBookingHiddenFields();
}

function serializeBookingDate(date) {
    if (!(date instanceof Date)) {
        return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateBookingNights(checkinDate, checkoutDate) {
    if (!checkinDate || !checkoutDate) {
        return 0;
    }
    const start = Date.UTC(checkinDate.getFullYear(), checkinDate.getMonth(), checkinDate.getDate());
    const end = Date.UTC(checkoutDate.getFullYear(), checkoutDate.getMonth(), checkoutDate.getDate());
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

// ===================================
// Einwilligung (Cookie-Banner), Statistik & Karte
// ===================================

// Auswahl im Cookie-Banner. Version erhöhen, wenn ein neuer Dienst dazukommt – dann werden alle neu gefragt.
const CONSENT_STORAGE_KEY = 'hotel_roessle_consent';
const CONSENT_VERSION = 2;
const CONSENT_MAX_AGE_DAYS = 365;
// Widerspruch gegen Matomo (Opt-out auf der Datenschutzseite)
const STATS_OPTOUT_KEY = 'hotel_roessle_stats_optout';

let currentConsent = { analytics: false, maps: false };
let consentReturnFocus = null;
let googleAnalyticsLoaded = false;

// Speicherzugriffe können scheitern (privates Fenster, blockierte Website-Daten) – dann gilt die Auswahl
// nur für den aktuellen Seitenaufruf.
function readStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        // Speicher nicht verfügbar
    }
}

function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        // Speicher nicht verfügbar
    }
}

function getStoredConsent() {
    const raw = readStorage(CONSENT_STORAGE_KEY);
    if (!raw) {
        return null;
    }
    try {
        const stored = JSON.parse(raw);
        const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
        if (stored.version !== CONSENT_VERSION || typeof stored.timestamp !== 'number' || Date.now() - stored.timestamp > maxAge) {
            return null;
        }
        return { analytics: stored.analytics === true, maps: stored.maps === true };
    } catch (error) {
        return null;
    }
}

// Das Banner gibt es nur, wenn ein einwilligungspflichtiger Dienst konfiguriert ist (Google Analytics).
// Ohne GA bleibt es bei der Karte per Klick.
function initConsent() {
    if (!GA_MEASUREMENT_ID) {
        deleteAnalyticsCookies();
        return;
    }

    document.querySelectorAll('[data-consent-only]').forEach(element => {
        element.hidden = false;
    });
    document.querySelectorAll('[data-consent-open]').forEach(button => {
        button.addEventListener('click', () => openConsentBanner(true, button));
    });

    const stored = getStoredConsent();
    if (stored) {
        applyConsent(stored);
    } else {
        deleteAnalyticsCookies();
        openConsentBanner(false, null);
    }
}

function applyConsent(choice) {
    currentConsent = { analytics: choice.analytics, maps: choice.maps };

    if (choice.analytics) {
        loadGoogleAnalytics();
        enableMatomoConsent();
    } else {
        deleteAnalyticsCookies();
    }

    if (choice.maps) {
        loadHotelMap(false);
    }
}

function saveConsent(choice) {
    const revoked = (currentConsent.analytics && !choice.analytics) || (currentConsent.maps && !choice.maps);

    writeStorage(CONSENT_STORAGE_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        timestamp: Date.now(),
        analytics: choice.analytics,
        maps: choice.maps,
    }));
    closeConsentBanner();

    if (revoked) {
        // Bereits geladene Dienste lassen sich nicht sauber entladen: Cookies löschen und Seite neu laden
        deleteAnalyticsCookies();
        window.location.reload();
        return;
    }

    applyConsent(choice);
}

function buildConsentBanner() {
    const banner = document.createElement('section');
    banner.className = 'consent-banner';
    banner.id = 'consentBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'consentTitle');
    banner.setAttribute('aria-describedby', 'consentText');
    banner.hidden = true;
    banner.innerHTML = `
        <h2 class="consent-title" id="consentTitle" tabindex="-1">Cookies &amp; Datenschutz</h2>
        <p class="consent-text" id="consentText">Mit Ihrer Zustimmung nutzen wir Google Analytics und eine erweiterte Statistik mit Matomo, um zu verstehen, wie unsere Website genutzt wird, und zeigen die Karte von Google Maps direkt an. Dabei werden Cookies gesetzt, und Google erhält Daten wie Ihre IP-Adresse, auch in den USA. Ihre Zustimmung ist freiwillig und lässt sich jederzeit unter „Cookie-Einstellungen“ im Seitenfuß ändern.</p>
        <p class="consent-links"><a href="datenschutz.html#cookies">Datenschutzerklärung</a><a href="impressum.html">Impressum</a></p>
        <fieldset class="consent-options" id="consentOptions" hidden>
            <legend class="visually-hidden">Kategorien</legend>
            <label class="consent-option">
                <input type="checkbox" checked disabled>
                <span><strong>Notwendig</strong>Speichert Ihre Auswahl in Ihrem Browser. Immer aktiv.</span>
            </label>
            <label class="consent-option">
                <input type="checkbox" name="analytics">
                <span><strong>Statistik</strong>Google Analytics und Matomo: Auswertung, wie Besucher unsere Website nutzen, auch über mehrere Besuche hinweg. Setzt Cookies; Google kann Daten in die USA übermitteln.</span>
            </label>
            <label class="consent-option">
                <input type="checkbox" name="maps">
                <span><strong>Externe Medien</strong>Google Maps: Karte im Kontaktbereich automatisch laden. Google erhält dabei Ihre IP-Adresse und kann Cookies setzen.</span>
            </label>
        </fieldset>
        <div class="consent-actions">
            <button type="button" class="btn-primary" data-consent-action="reject">Alle ablehnen</button>
            <button type="button" class="btn-secondary" data-consent-action="settings" aria-controls="consentOptions" aria-expanded="false">Einstellungen</button>
            <button type="button" class="btn-secondary" data-consent-action="save" hidden>Auswahl speichern</button>
            <button type="button" class="btn-primary" data-consent-action="accept">Alle akzeptieren</button>
        </div>
    `;

    banner.addEventListener('click', event => {
        const button = event.target.closest('[data-consent-action]');
        if (!button) {
            return;
        }
        const action = button.dataset.consentAction;
        if (action === 'accept') {
            saveConsent({ analytics: true, maps: true });
        } else if (action === 'reject') {
            saveConsent({ analytics: false, maps: false });
        } else if (action === 'settings') {
            setConsentSettingsVisible(banner, true);
            banner.querySelector('input[name="analytics"]').focus();
        } else if (action === 'save') {
            saveConsent({
                analytics: banner.querySelector('input[name="analytics"]').checked,
                maps: banner.querySelector('input[name="maps"]').checked,
            });
        }
    });

    // Escape schließt nur, wenn schon eine Auswahl gespeichert ist (sonst gäbe es keine Entscheidung)
    banner.addEventListener('keydown', event => {
        if (event.key === 'Escape' && getStoredConsent()) {
            closeConsentBanner();
        }
    });

    // Früh in der Tab-Reihenfolge (direkt nach dem Skip-Link), optisch unten fixiert
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.after(banner);
    } else {
        document.body.prepend(banner);
    }
    return banner;
}

function setConsentSettingsVisible(banner, visible) {
    banner.querySelector('#consentOptions').hidden = !visible;
    banner.querySelector('[data-consent-action="save"]').hidden = !visible;
    const settingsButton = banner.querySelector('[data-consent-action="settings"]');
    settingsButton.hidden = visible;
    settingsButton.setAttribute('aria-expanded', String(visible));
}

function openConsentBanner(showSettings, returnFocusTo) {
    const banner = document.getElementById('consentBanner') || buildConsentBanner();
    banner.querySelector('input[name="analytics"]').checked = currentConsent.analytics;
    banner.querySelector('input[name="maps"]').checked = currentConsent.maps;
    setConsentSettingsVisible(banner, showSettings);
    banner.hidden = false;

    // Beim ersten Besuch keinen Fokus stehlen; aus dem Footer geöffnet springt der Fokus ins Banner
    consentReturnFocus = returnFocusTo;
    if (returnFocusTo) {
        banner.querySelector('#consentTitle').focus();
    }
}

function closeConsentBanner() {
    const banner = document.getElementById('consentBanner');
    if (banner) {
        banner.hidden = true;
    }
    if (consentReturnFocus && typeof consentReturnFocus.focus === 'function') {
        consentReturnFocus.focus();
    }
    consentReturnFocus = null;
}

function loadGoogleAnalytics() {
    if (googleAnalyticsLoaded || !GA_MEASUREMENT_ID) {
        return;
    }
    googleAnalyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
        window.dataLayer.push(arguments);
    };
    // Consent Mode: nur Statistik erlaubt, alle Werbefunktionen bleiben aus
    window.gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);
}

// Löscht die Statistik-Cookies von GA (_ga, _ga_<ID>) und Matomo (_pk_*, mtm_*) auf dieser Domain
// und allen übergeordneten Domains
function deleteAnalyticsCookies() {
    const cookieNames = document.cookie
        .split(';')
        .map(cookie => cookie.split('=')[0].trim())
        .filter(name => name === '_ga' || name.startsWith('_ga_') || name === '_gid'
            || name.startsWith('_pk_') || name.startsWith('mtm_'));
    if (cookieNames.length === 0) {
        return;
    }

    const hostParts = window.location.hostname.split('.');
    const domainAttributes = [''];
    for (let i = 0; i < hostParts.length - 1; i++) {
        domainAttributes.push(`; domain=.${hostParts.slice(i).join('.')}`);
    }

    cookieNames.forEach(name => {
        domainAttributes.forEach(domainAttribute => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainAttribute}`;
        });
    });
}

function loadHotelMap(moveFocus) {
    const mapContainer = document.getElementById('hotelMap');
    if (!mapContainer || mapContainer.classList.contains('is-loaded')) {
        return;
    }
    const mapFrame = document.createElement('iframe');
    mapFrame.src = mapContainer.dataset.mapSrc;
    mapFrame.title = 'Karte: Hotel Rössle, Honbergstrasse 8, 78532 Tuttlingen';
    mapFrame.loading = 'lazy';
    mapFrame.allowFullscreen = true;
    mapContainer.replaceChildren(mapFrame);
    mapContainer.classList.add('is-loaded');
    if (moveFocus) {
        mapFrame.focus();
    }
}

// Do Not Track / Global Privacy Control: Matomo erfasst dann nichts
function hasBrowserPrivacySignal() {
    return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
}

function isStatsOptedOut() {
    return readStorage(STATS_OPTOUT_KEY) === '1';
}

// Einwilligung „Statistik“ zählt nur, solange es das Banner gibt (GA konfiguriert)
function hasStatsConsent() {
    return Boolean(GA_MEASUREMENT_ID) && getStoredConsent()?.analytics === true;
}

// Matomo in zwei Stufen:
// - ohne Einwilligung: keine Cookies und kein Auslesen von Browser-Merkmalen (z. B. Bildschirmauflösung),
//   damit nichts auf dem Gerät gespeichert oder ausgelesen wird (§ 25 TDDDG) – diese Stufe nicht aufweichen
// - mit Einwilligung „Statistik“: Cookies (wiederkehrende Besucher) und Browser-Merkmale
function initMatomo() {
    if (!MATOMO_URL || isStatsOptedOut() || hasBrowserPrivacySignal()) {
        return;
    }
    const paq = window._paq = window._paq || [];
    paq.push(['requireCookieConsent']);
    if (hasStatsConsent()) {
        paq.push(['setCookieConsentGiven']);
    } else {
        paq.push(['disableBrowserFeatureDetection']);
    }
    paq.push(['setTrackerUrl', `${MATOMO_URL}matomo.php`]);
    paq.push(['setSiteId', MATOMO_SITE_ID]);
    paq.push(['trackPageView']);
    paq.push(['enableLinkTracking']);

    const script = document.createElement('script');
    script.async = true;
    script.src = `${MATOMO_URL}matomo.js`;
    document.head.appendChild(script);
}

// Nach Zustimmung im Banner: Matomo darf ab sofort Cookies setzen und Browser-Merkmale erfassen.
// Die Zustimmung selbst speichern wir in hotel_roessle_consent, nicht in einem Matomo-Cookie.
function enableMatomoConsent() {
    if (window._paq) {
        window._paq.push(['setCookieConsentGiven']);
        window._paq.push(['enableBrowserFeatureDetection']);
    }
}

// Abgeschickte Buchungsanfrage zählen – ohne Formularinhalte
function trackBookingRequest() {
    if (window._paq) {
        window._paq.push(['trackEvent', 'Buchung', 'Anfrage gesendet']);
    }
    if (googleAnalyticsLoaded) {
        window.gtag('event', 'generate_lead');
    }
}

// Widerspruch gegen Matomo auf der Datenschutzseite
function initStatsOptout() {
    const box = document.getElementById('statsOptout');
    if (!box || !MATOMO_URL) {
        return;
    }
    const status = document.getElementById('statsOptoutStatus');
    const button = document.getElementById('statsOptoutBtn');
    box.hidden = false;

    if (hasBrowserPrivacySignal()) {
        status.textContent = 'Ihr Browser sendet ein „Do Not Track“- bzw. „Global Privacy Control“-Signal. Matomo erfasst Ihre Besuche deshalb nicht.';
        button.hidden = true;
        return;
    }

    const render = () => {
        const optedOut = isStatsOptedOut();
        status.textContent = optedOut
            ? 'Sie haben widersprochen: Ihre Besuche werden in diesem Browser nicht erfasst.'
            : 'Ihre Besuche werden derzeit in der Besucherstatistik erfasst.';
        button.textContent = optedOut ? 'Statistik wieder zulassen' : 'Statistik in diesem Browser deaktivieren';
    };
    render();

    button.addEventListener('click', () => {
        if (isStatsOptedOut()) {
            removeStorage(STATS_OPTOUT_KEY);
        } else {
            writeStorage(STATS_OPTOUT_KEY, '1');
            // Bereits geladenen Tracker für den Rest dieses Seitenaufrufs anhalten
            if (window._paq) {
                window._paq.push(['requireConsent']);
            }
        }
        render();
    });
}

initMatomo();
