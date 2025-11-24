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
    clientEmailLimitPerDay: 3,
};

const BOOKING_RATE_LIMIT_STORAGE_KEY = 'hotel_roessle_booking_rate_limits';

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

    initOptionalFieldToggles();

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
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
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

    syncBookingHiddenFields();
});

function initOptionalFieldToggles() {
    const toggles = document.querySelectorAll('[data-optional-toggle]');
    if (!toggles.length) {
        return;
    }

    toggles.forEach(button => {
        const targetSelector = button.getAttribute('data-target');
        if (!targetSelector) {
            return;
        }

        const target = document.querySelector(targetSelector);
        if (!target) {
            return;
        }

        const icon = button.querySelector('.toggle-icon');
        const label = button.querySelector('.toggle-label');
        const showText = button.getAttribute('data-label-show') || 'Details anzeigen';
        const hideText = button.getAttribute('data-label-hide') || 'Details ausblenden';

        const setExpanded = expanded => {
            button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            button.classList.toggle('is-active', expanded);
            target.classList.toggle('is-visible', expanded);
            if (expanded) {
                target.removeAttribute('hidden');
            } else {
                target.setAttribute('hidden', '');
            }
            if (icon) {
                icon.textContent = expanded ? '–' : '＋';
            }
            if (label) {
                label.textContent = expanded ? hideText : showText;
            }
        };

        setExpanded(button.getAttribute('aria-expanded') === 'true');

        button.addEventListener('click', () => {
            const expanded = button.getAttribute('aria-expanded') === 'true';
            setExpanded(!expanded);
        });
    });
}

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
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setHours(0, 0, 0, 0);
    maxDate.setDate(maxDate.getDate() + BOOKING_SECURITY_CONFIG.maxAdvanceDays);

    if (date < today || disabled || date > maxDate) {
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

    syncBookingHiddenFields();
    // Formulardaten sammeln
    const formData = new FormData(e.target);
    const honeypotValue = (formData.get('website') || '').toString().trim();
    if (honeypotValue !== '') {
        showBookingMessage('Die Anfrage konnte nicht gesendet werden. Bitte kontaktieren Sie uns telefonisch.', 'error');
        return;
    }

    const bookingData = {
        vorname: (formData.get('vorname') || '').toString().trim(),
        nachname: (formData.get('nachname') || '').toString().trim(),
        company: (formData.get('company') || '').toString().trim(),
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

    const rateLimitCheck = enforceClientRateLimit(bookingData.email);
    if (!rateLimitCheck.allowed) {
        showBookingMessage(rateLimitCheck.message, 'error');
        return;
    }

    delete bookingData.privacyAccepted;

    // FormData für den Versand vorbereiten
    formData.set('vorname', bookingData.vorname);
    formData.set('nachname', bookingData.nachname);
    formData.set('company', bookingData.company);
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

    if (data.company && data.company.length > 160) {
        return { valid: false, message: 'Der Firmenname ist zu lang.' };
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

    document.getElementById('bookingCheckinDisplay').textContent = 'Datum';
    document.getElementById('bookingCheckinDisplay').classList.add('placeholder');
    document.getElementById('bookingCheckoutDisplay').textContent = 'Datum';
    document.getElementById('bookingCheckoutDisplay').classList.add('placeholder');
    document.getElementById('bookingNightsInfo').style.display = 'none';

    // Summary verstecken
    document.getElementById('bookingSummary').style.display = 'none';

    // Submit-Button deaktivieren
    document.getElementById('bookingSubmitBtn').disabled = true;

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

function getBookingRateLimitStore() {
    try {
        const raw = localStorage.getItem(BOOKING_RATE_LIMIT_STORAGE_KEY);
        if (!raw) {
            return {};
        }
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (error) {
        console.warn('Rate-Limit-Speicher nicht verfügbar', error);
        return {};
    }
}

function saveBookingRateLimitStore(store) {
    try {
        localStorage.setItem(BOOKING_RATE_LIMIT_STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
        console.warn('Rate-Limit-Speicher konnte nicht aktualisiert werden', error);
    }
}

function enforceClientRateLimit(email) {
    if (!email) {
        return { allowed: true };
    }

    const store = getBookingRateLimitStore();
    const normalizedEmail = email.toLowerCase();
    const now = Date.now();
    const windowStart = now - 24 * 60 * 60 * 1000;

    const timestampsRaw = Array.isArray(store[normalizedEmail]) ? store[normalizedEmail] : [];
    const timestamps = timestampsRaw
        .map(ts => Number(ts))
        .filter(ts => Number.isFinite(ts) && ts >= windowStart);

    store[normalizedEmail] = timestamps;

    if (timestamps.length >= BOOKING_SECURITY_CONFIG.clientEmailLimitPerDay) {
        saveBookingRateLimitStore(store);
        return {
            allowed: false,
            message: 'Sie haben bereits mehrere Buchungsanfragen gesendet. Bitte warten Sie auf unsere Antwort.',
        };
    }

    timestamps.push(now);
    store[normalizedEmail] = timestamps;
    saveBookingRateLimitStore(store);

    return { allowed: true };
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
