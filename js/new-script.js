// ===================================
// Modern Hotel Website JavaScript
// ===================================

const BOOKING_FORM_ENDPOINT = 'booking.php';

const BOOKING_SECURITY_CONFIG = {
    maxRooms: {
        einzelzimmer: 5,
        doppelzimmer: 10,
        familienzimmer: 3,
    },
    maxRoomsTotal: 18,
    minNights: 1,
    maxNights: 30,
    maxAdvanceDays: 365,
};

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

    // Google Maps erst nach Klick laden (vorher werden keine Daten an Google übertragen)
    const loadMapBtn = document.getElementById('loadMapBtn');
    if (loadMapBtn) {
        loadMapBtn.addEventListener('click', function() {
            const mapContainer = document.getElementById('hotelMap');
            const mapFrame = document.createElement('iframe');
            mapFrame.src = mapContainer.dataset.mapSrc;
            mapFrame.title = 'Karte: Hotel Rössle, Honbergstrasse 8, 78532 Tuttlingen';
            mapFrame.allowFullscreen = true;
            mapContainer.replaceChildren(mapFrame);
            mapContainer.classList.add('is-loaded');
            mapFrame.focus();
        });
    }

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

    // Form Submission Handling
    const bookingForm = document.getElementById('mainBookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
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

// Room Counter State
const bookingCounters = {
    einzelzimmer: 0,
    doppelzimmer: 0,
    familienzimmer: 0
};

function syncBookingHiddenFields() {
    const checkinInput = document.getElementById('bookingCheckinInput');
    if (checkinInput) {
        checkinInput.value = bookingSelectedCheckin ? serializeBookingDate(bookingSelectedCheckin) : '';
    }

    const checkoutInput = document.getElementById('bookingCheckoutInput');
    if (checkoutInput) {
        checkoutInput.value = bookingSelectedCheckout ? serializeBookingDate(bookingSelectedCheckout) : '';
    }

    const einzelzimmerInput = document.getElementById('bookingCountEinzelzimmer');
    if (einzelzimmerInput) {
        einzelzimmerInput.value = String(bookingCounters.einzelzimmer ?? 0);
    }

    const doppelzimmerInput = document.getElementById('bookingCountDoppelzimmer');
    if (doppelzimmerInput) {
        doppelzimmerInput.value = String(bookingCounters.doppelzimmer ?? 0);
    }

    const familienzimmerInput = document.getElementById('bookingCountFamilienzimmer');
    if (familienzimmerInput) {
        familienzimmerInput.value = String(bookingCounters.familienzimmer ?? 0);
    }
}

const bookingRoomLimitWarned = {
    einzelzimmer: false,
    doppelzimmer: false,
    familienzimmer: false,
};

const bookingPrices = {
    einzelzimmer: 62,
    doppelzimmer: 86,
    familienzimmer: 114
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
        const roomName = room === 'einzelzimmer' ? 'Einzelzimmer'
            : room === 'doppelzimmer' ? 'Doppelzimmer'
            : 'Familienzimmer';
        showBookingMessage(`Für ${roomName} stehen maximal ${maxForRoom} Zimmer gleichzeitig zur Verfügung.`, 'error');
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
        einzelzimmer: bookingCounters.einzelzimmer || 0,
        doppelzimmer: bookingCounters.doppelzimmer || 0,
        familienzimmer: bookingCounters.familienzimmer || 0,
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
    formData.set('einzelzimmer', String(bookingData.einzelzimmer ?? 0));
    formData.set('doppelzimmer', String(bookingData.doppelzimmer ?? 0));
    formData.set('familienzimmer', String(bookingData.familienzimmer ?? 0));
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

    const totalRooms = (data.einzelzimmer || 0) + (data.doppelzimmer || 0) + (data.familienzimmer || 0);
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
            const roomName = room === 'einzelzimmer' ? 'Einzelzimmer'
                : room === 'doppelzimmer' ? 'Doppelzimmer'
                : 'Familienzimmer';
            return {
                valid: false,
                message: `Für ${roomName} können maximal ${max} Zimmer gleichzeitig angefragt werden.`,
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
    bookingCounters.einzelzimmer = 0;
    bookingCounters.doppelzimmer = 0;
    bookingCounters.familienzimmer = 0;

    Object.keys(bookingRoomLimitWarned).forEach(room => {
        bookingRoomLimitWarned[room] = false;
    });

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
