// ===================================
// Modern Hotel Website JavaScript
// ===================================

// ===================================
// Google Apps Script API Configuration
// ===================================

// Google Apps Script Web-App URL (Deployment)
const BOOKING_API_URL = 'https://script.google.com/macros/s/AKfycbxom9RbW4YPMje8c-oFHULIkCRi95WNZIHNvpYUQF1R46YEhRBEWS7CExdEAc0SoMsxng/exec';

// Falls Sie testen möchten ohne Backend (nur Frontend-Validierung):
const USE_MOCK_API = false; // Auf true setzen zum Testen ohne Backend (für lokale Tests)

document.addEventListener('DOMContentLoaded', function() {

    // Smooth Scroll for Navigation Links
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"], .btn-primary[href^="#"], .btn-secondary[href^="#"], .footer-links a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#home') {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    const offset = 80; // Account for fixed navbar
                    const targetPosition = targetSection.offsetTop - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
            // Close mobile menu if open
            if (mobileMenu.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.nav-menu');

    function toggleMobileMenu() {
        mobileMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.padding = '0.5rem 0';
            navbar.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.padding = '1rem 0';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
        }
    });

    // Active Navigation Link on Scroll
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', function() {
        const scrollPos = window.scrollY + 150;

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

    // Form Submission Handling
    const bookingForm = document.getElementById('mainBookingForm');
    const contactForm = document.querySelector('.contact-form');

    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Vielen Dank für Ihre Nachricht! Wir werden uns schnellstmöglich bei Ihnen melden.');
            contactForm.reset();
        });
    }

    // Animate Elements on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.room-card, .leisure-card, .feature-card, .event-hall');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

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
});

// Room Counter State
const bookingCounters = {
    einzelzimmer: 0,
    doppelzimmer: 0,
    familienzimmer: 0
};

const bookingPrices = {
    einzelzimmer: 56,
    doppelzimmer: 80,
    familienzimmer: 109
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
    bookingCounters[room] = Math.max(0, bookingCounters[room] + change);
    document.getElementById(`booking-count-${room}`).textContent = bookingCounters[room];

    const card = document.querySelector(`[data-room="${room}"]`);
    if (bookingCounters[room] > 0) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }

    updateBookingSummary();
    updateBookingSubmitButton();
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
            const roomName = room === 'einzelzimmer' ? 'Einzelzimmer' :
                           room === 'doppelzimmer' ? 'Doppelzimmer' : 'Familienzimmer';
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
    if (calendar.classList.contains('active')) {
        renderBookingCalendar();
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
    const day = document.createElement('div');
    day.className = 'calendar-day';
    day.textContent = dayNum;

    const date = new Date(year, month, dayNum);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today || disabled) {
        day.classList.add('disabled');
    } else {
        day.onclick = () => selectBookingDate(date);

        if (bookingSelectedCheckin && date.getTime() === bookingSelectedCheckin.getTime()) {
            day.classList.add('start');
        }
        if (bookingSelectedCheckout && date.getTime() === bookingSelectedCheckout.getTime()) {
            day.classList.add('end');
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
            setTimeout(() => {
                document.getElementById('bookingCalendar').classList.remove('active');
                document.querySelector('.date-input-box').classList.remove('active');
            }, 300);
        } else {
            bookingSelectedCheckin = date;
            bookingSelectedCheckout = null;
        }
    }
    renderBookingCalendar();
    updateBookingSubmitButton();
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
        const diffTime = bookingSelectedCheckout - bookingSelectedCheckin;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        nightsCount.textContent = `${diffDays} ${diffDays === 1 ? 'Nacht' : 'Nächte'}`;
        nightsInfo.style.display = 'block';
    } else {
        nightsInfo.style.display = 'none';
    }
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

const roomGalleries = {
    einzelzimmer: [
        { src: 'images/home_roessle4.jpg', caption: 'Einzelzimmer - Gemütliches Frühstück' },
        { src: 'images/zimmer/wohnen_roessle2.jpg', caption: 'Badezimmer mit Dusche' }
    ],
    doppelzimmer: [
        { src: 'images/zimmer/wohnen_roessle_5.jpg', caption: 'Doppelzimmer - Komfortabel und modern' },
        { src: 'images/zimmer/wohnen_roessle2.jpg', caption: 'Badezimmer mit Dusche' }
    ],
    familienzimmer: [
        { src: 'images/zimmer/wohnen_roessle1.jpg', caption: 'Familienzimmer - Geräumig für bis zu 4 Personen' },
        { src: 'images/zimmer/wohnen_roessle4.jpg', caption: 'Familienzimmer - Gemütliche Atmosphäre' },
        { src: 'images/zimmer/wohnen_roessle2.jpg', caption: 'Badezimmer mit Dusche' }
    ]
};

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
    const modal = document.getElementById('roomGalleryModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling

    updateGalleryImage();
    renderGalleryDots();

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
        const dot = document.createElement('div');
        dot.className = 'gallery-dot';
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

// Add mobile menu styles dynamically
const style = document.createElement('style');
style.textContent = `
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            top: 70px;
            left: -100%;
            width: 100%;
            height: calc(100vh - 70px);
            background: rgba(255, 255, 255, 0.98);
            flex-direction: column;
            padding: 2rem;
            transition: left 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .nav-menu.active {
            left: 0;
            display: flex !important;
        }

        .mobile-menu-btn.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }

        .mobile-menu-btn.active span:nth-child(2) {
            opacity: 0;
        }

        .mobile-menu-btn.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
        }

        .nav-menu li {
            margin: 1rem 0;
        }

        .nav-menu a {
            font-size: 1.2rem;
        }
    }
`;
document.head.appendChild(style);

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

    // Formulardaten sammeln
    const formData = new FormData(e.target);
    const bookingData = {
        vorname: formData.get('vorname') || document.querySelector('input[type="text"]').value,
        nachname: formData.get('nachname') || document.querySelectorAll('input[type="text"]')[1].value,
        email: formData.get('email') || document.querySelector('input[type="email"]').value,
        telefon: formData.get('telefon') || document.querySelector('input[type="tel"]').value,
        checkin: bookingSelectedCheckin ? bookingSelectedCheckin.toISOString() : null,
        checkout: bookingSelectedCheckout ? bookingSelectedCheckout.toISOString() : null,
        einzelzimmer: bookingCounters.einzelzimmer || 0,
        doppelzimmer: bookingCounters.doppelzimmer || 0,
        familienzimmer: bookingCounters.familienzimmer || 0,
        wuensche: formData.get('wuensche') || document.querySelector('textarea').value || '',
        origin: window.location.origin // Anti-Spam: Herkunft der Anfrage
    };

    // Validierung
    if (!validateBookingForm(bookingData)) {
        showBookingMessage('Bitte füllen Sie alle Pflichtfelder aus und wählen Sie mindestens ein Zimmer.', 'error');
        return;
    }

    // Button-Status ändern
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Wird gesendet...';

    try {
        let response;

        if (USE_MOCK_API || BOOKING_API_URL === 'IHRE_GOOGLE_APPS_SCRIPT_URL_HIER') {
            // Mock-Modus für Testing ohne Backend
            console.log('Mock-Modus: Buchungsdaten würden gesendet:', bookingData);
            response = { success: true, bookingId: 'MOCK-' + Date.now() };
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simuliere Netzwerk-Verzögerung
        } else {
            // Echte API-Anfrage
            const apiResponse = await fetch(BOOKING_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData),
                mode: 'cors'
            });

            if (!apiResponse.ok) {
                throw new Error(`HTTP Error ${apiResponse.status}`);
            }

            response = await apiResponse.json();
        }

        if (response.success) {
            showBookingMessage(
                '✅ Buchungsanfrage erfolgreich übermittelt!\n\n' +
                'Vielen Dank für Ihre Anfrage. Wir prüfen die Verfügbarkeit und melden uns innerhalb von 24 Stunden bei Ihnen.\n\n' +
                'Sie erhalten in Kürze eine Bestätigungs-E-Mail.',
                'success'
            );

            // Formular zurücksetzen
            e.target.reset();
            resetBookingForm();

        } else {
            throw new Error(response.error || 'Unbekannter Fehler');
        }

    } catch (error) {
        console.error('Booking submission error:', error);
        showBookingMessage(
            '❌ Es ist ein Fehler aufgetreten.\n\n' +
            'Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch unter +49 (0) 7461 2913.',
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
function validateBookingForm(data) {
    if (!data.vorname || !data.nachname || !data.email || !data.telefon) {
        return false;
    }
    if (!data.checkin || !data.checkout) {
        return false;
    }
    const totalRooms = (data.einzelzimmer || 0) + (data.doppelzimmer || 0) + (data.familienzimmer || 0);
    if (totalRooms === 0) {
        return false;
    }
    // Email-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        return false;
    }
    return true;
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

    // Erstelle neue Nachricht
    const messageDiv = document.createElement('div');
    messageDiv.className = `booking-message booking-message-${type}`;
    messageDiv.innerHTML = `
        <div class="booking-message-content">
            <p>${message.replace(/\n/g, '<br>')}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="booking-message-close">Schließen</button>
        </div>
    `;

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
    bookingCounters.einzelzimmer = 0;
    bookingCounters.doppelzimmer = 0;
    bookingCounters.familienzimmer = 0;

    // UI aktualisieren
    document.getElementById('booking-count-einzelzimmer').textContent = '0';
    document.getElementById('booking-count-doppelzimmer').textContent = '0';
    document.getElementById('booking-count-familienzimmer').textContent = '0';

    // Selected-Klasse entfernen
    document.querySelectorAll('.booking-room-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Datum zurücksetzen
    bookingSelectedCheckin = null;
    bookingSelectedCheckout = null;
    bookingSelectingCheckout = false;

    document.getElementById('bookingCheckinDisplay').textContent = 'Datum';
    document.getElementById('bookingCheckinDisplay').classList.add('placeholder');
    document.getElementById('bookingCheckoutDisplay').textContent = 'Datum';
    document.getElementById('bookingCheckoutDisplay').classList.add('placeholder');
    document.getElementById('bookingNightsInfo').style.display = 'none';

    // Summary verstecken
    document.getElementById('bookingSummary').style.display = 'none';

    // Submit-Button deaktivieren
    document.getElementById('bookingSubmitBtn').disabled = true;
}

// CSS für Booking Messages
const bookingMessageStyle = document.createElement('style');
bookingMessageStyle.textContent = `
    .booking-message {
        margin: 2rem 0;
        padding: 1.5rem;
        border-radius: 8px;
        animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .booking-message-success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
    }

    .booking-message-error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
    }

    .booking-message-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }

    .booking-message-content p {
        margin: 0;
        flex: 1;
        line-height: 1.6;
    }

    .booking-message-close {
        background: rgba(0, 0, 0, 0.1);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        white-space: nowrap;
        transition: background 0.2s;
    }

    .booking-message-close:hover {
        background: rgba(0, 0, 0, 0.2);
    }

    .booking-message-success .booking-message-close {
        color: #155724;
    }

    .booking-message-error .booking-message-close {
        color: #721c24;
    }
`;
document.head.appendChild(bookingMessageStyle);
