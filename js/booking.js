// ===================================
// Booking Form JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', function() {

    // Get form elements
    const bookingForm = document.getElementById('bookingForm');
    const roomTypeSelect = document.getElementById('roomType');
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    const priceCalculation = document.getElementById('priceCalculation');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    checkInInput.setAttribute('min', today);
    checkOutInput.setAttribute('min', today);

    // Pre-select room type from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const zimmerParam = urlParams.get('zimmer');
    if (zimmerParam && roomTypeSelect) {
        roomTypeSelect.value = zimmerParam;
    }

    // ===================================
    // Price Calculation
    // ===================================

    function calculatePrice() {
        const roomType = roomTypeSelect.value;
        const checkIn = checkInInput.value;
        const checkOut = checkOutInput.value;

        if (!roomType || !checkIn || !checkOut) {
            priceCalculation.style.display = 'none';
            return;
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        // Validate dates
        if (checkOutDate <= checkInDate) {
            alert('Das Abreisedatum muss nach dem Anreisedatum liegen.');
            checkOutInput.value = '';
            priceCalculation.style.display = 'none';
            return;
        }

        // Calculate number of nights
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Get price per night
        const selectedOption = roomTypeSelect.options[roomTypeSelect.selectedIndex];
        const pricePerNight = parseFloat(selectedOption.dataset.price);

        if (isNaN(pricePerNight)) {
            priceCalculation.style.display = 'none';
            return;
        }

        // Calculate total
        const totalPrice = numberOfNights * pricePerNight;

        // Display calculation
        document.getElementById('numberOfNights').textContent = numberOfNights + ' Nacht' + (numberOfNights > 1 ? 'e' : '');
        document.getElementById('pricePerNight').textContent = pricePerNight.toFixed(2) + ' €';
        document.getElementById('totalPrice').textContent = totalPrice.toFixed(2) + ' €';

        priceCalculation.style.display = 'block';
    }

    // Event listeners for price calculation
    if (roomTypeSelect) roomTypeSelect.addEventListener('change', calculatePrice);
    if (checkInInput) checkInInput.addEventListener('change', function() {
        // Update checkout minimum date
        const checkIn = new Date(this.value);
        checkIn.setDate(checkIn.getDate() + 1);
        const minCheckOut = checkIn.toISOString().split('T')[0];
        checkOutInput.setAttribute('min', minCheckOut);
        calculatePrice();
    });
    if (checkOutInput) checkOutInput.addEventListener('change', calculatePrice);

    // ===================================
    // Form Validation
    // ===================================

    const numberOfGuestsSelect = document.getElementById('numberOfGuests');

    if (roomTypeSelect && numberOfGuestsSelect) {
        roomTypeSelect.addEventListener('change', function() {
            const roomType = this.value;
            const guestsValue = numberOfGuestsSelect.value;

            // Validate guest count based on room type
            if (roomType === 'einzelzimmer' && parseInt(guestsValue) > 1) {
                alert('Einzelzimmer sind nur für 1 Person geeignet.');
                numberOfGuestsSelect.value = '1';
            }
            if (roomType === 'doppelzimmer' && parseInt(guestsValue) > 2) {
                alert('Doppelzimmer sind für maximal 2 Personen geeignet.');
                numberOfGuestsSelect.value = '2';
            }
            if (roomType === 'familienzimmer' && parseInt(guestsValue) > 4) {
                alert('Familienzimmer sind für maximal 4 Personen geeignet.');
                numberOfGuestsSelect.value = '4';
            }
        });
    }

    // ===================================
    // Form Submission
    // ===================================

    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Collect form data
            const formData = new FormData(this);
            const bookingData = {
                // Room details
                roomType: formData.get('roomType'),
                numberOfGuests: formData.get('numberOfGuests'),
                checkIn: formData.get('checkIn'),
                checkOut: formData.get('checkOut'),

                // Personal information
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                street: formData.get('street'),
                city: formData.get('city'),
                postalCode: formData.get('postalCode'),
                country: formData.get('country'),

                // Special requests
                specialRequests: formData.get('specialRequests'),
                arrivalTime: formData.get('arrivalTime'),

                // Metadata
                timestamp: new Date().toISOString(),
                source: 'website'
            };

            // Get price calculation
            const nights = document.getElementById('numberOfNights')?.textContent || 'N/A';
            const pricePerNight = document.getElementById('pricePerNight')?.textContent || 'N/A';
            const totalPrice = document.getElementById('totalPrice')?.textContent || 'N/A';

            bookingData.priceCalculation = {
                numberOfNights: nights,
                pricePerNight: pricePerNight,
                totalPrice: totalPrice
            };

            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Wird gesendet...';

            // Format booking data for email
            const emailBody = formatBookingDataForEmail(bookingData);

            // Simulate form submission (replace with actual backend call)
            // In production, this should send to your backend/API
            setTimeout(() => {
                const messageDiv = document.getElementById('bookingMessage');
                messageDiv.style.display = 'block';
                messageDiv.style.backgroundColor = '#d4edda';
                messageDiv.style.color = '#155724';
                messageDiv.style.border = '2px solid #c3e6cb';
                messageDiv.style.padding = 'var(--spacing-md)';
                messageDiv.style.borderRadius = 'var(--border-radius)';
                messageDiv.innerHTML = `
                    <h3 style="margin-bottom: var(--spacing-sm); color: #155724;">✓ Buchungsanfrage erfolgreich gesendet!</h3>
                    <p style="margin-bottom: var(--spacing-xs);">Vielen Dank für Ihre Buchungsanfrage, ${bookingData.firstName} ${bookingData.lastName}!</p>
                    <p style="margin-bottom: var(--spacing-xs);">Wir haben Ihre Anfrage erhalten und werden die Verfügbarkeit prüfen.</p>
                    <p style="margin-bottom: 0;"><strong>Sie erhalten innerhalb von 24 Stunden eine Rückmeldung per E-Mail an: ${bookingData.email}</strong></p>
                `;

                // Scroll to message
                messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Reset form
                bookingForm.reset();
                priceCalculation.style.display = 'none';
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;

                // Log for development (in production, send to backend)
                console.log('=== BUCHUNGSANFRAGE ===');
                console.log('Booking data:', bookingData);
                console.log('\n=== EMAIL FORMAT ===');
                console.log(emailBody);
                console.log('\n=== INFO ===');
                console.log('Email should be sent to: info@hotelroessle.eu');
                console.log('For Google Sheets integration, send this data to your backend API');

                // Alert for development
                alert('📧 Buchungsanfrage würde jetzt per E-Mail versendet.\n\n' +
                      'Für die finale Version:\n' +
                      '1. Backend-API einrichten\n' +
                      '2. Email-Service konfigurieren\n' +
                      '3. Optional: Google Sheets API anbinden\n\n' +
                      'Siehe Console für Details.');

            }, 1500);
        });
    }

    // ===================================
    // Format Booking Data for Email
    // ===================================

    function formatBookingDataForEmail(data) {
        const roomTypeNames = {
            'einzelzimmer': 'Einzelzimmer (56,00 € pro Nacht)',
            'doppelzimmer': 'Doppelzimmer (80,00 € pro Nacht)',
            'familienzimmer': 'Familienzimmer (109,00 € pro Nacht)'
        };

        return `
NEUE BUCHUNGSANFRAGE - Hotel Rössle
=====================================

ZIMMERDETAILS:
--------------
Zimmertyp: ${roomTypeNames[data.roomType] || data.roomType}
Anzahl Gäste: ${data.numberOfGuests}
Anreise (Check-In): ${formatDate(data.checkIn)}
Abreise (Check-Out): ${formatDate(data.checkOut)}
Voraussichtliche Ankunftszeit: ${data.arrivalTime || 'Nicht angegeben'}

PREISBERECHNUNG:
----------------
Anzahl Nächte: ${data.priceCalculation.numberOfNights}
Preis pro Nacht: ${data.priceCalculation.pricePerNight}
Gesamtpreis: ${data.priceCalculation.totalPrice}
(Preise ohne Frühstück)

GÄSTEINFORMATIONEN:
-------------------
Name: ${data.firstName} ${data.lastName}
E-Mail: ${data.email}
Telefon: ${data.phone}
Adresse: ${data.street || 'Nicht angegeben'}
         ${data.postalCode || ''} ${data.city || ''}
         ${data.country || ''}

BESONDERE WÜNSCHE:
------------------
${data.specialRequests || 'Keine besonderen Wünsche'}

BUCHUNGSDETAILS:
----------------
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
Quelle: ${data.source}

=====================================
Bitte prüfen Sie die Verfügbarkeit und senden Sie eine Bestätigung an: ${data.email}
        `.trim();
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // ===================================
    // Guest Count Validation Helper
    // ===================================

    function validateGuestCount() {
        const roomType = roomTypeSelect?.value;
        const guestCount = parseInt(numberOfGuestsSelect?.value);

        if (!roomType || !guestCount) return true;

        const limits = {
            'einzelzimmer': 1,
            'doppelzimmer': 2,
            'familienzimmer': 4
        };

        if (limits[roomType] && guestCount > limits[roomType]) {
            return false;
        }

        return true;
    }

    // ===================================
    // Auto-save to localStorage (optional)
    // ===================================

    function saveFormData() {
        if (!bookingForm) return;

        const formData = new FormData(bookingForm);
        const data = {};
        formData.forEach((value, key) => {
            if (value) data[key] = value;
        });

        localStorage.setItem('hotelBookingDraft', JSON.stringify(data));
    }

    function loadFormData() {
        const savedData = localStorage.getItem('hotelBookingDraft');
        if (!savedData) return;

        try {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const input = bookingForm.querySelector(`[name="${key}"]`);
                if (input) input.value = data[key];
            });
            calculatePrice();
        } catch (e) {
            console.error('Error loading saved form data:', e);
        }
    }

    // Auto-save form data on input
    if (bookingForm) {
        bookingForm.addEventListener('input', function() {
            saveFormData();
        });

        // Load saved data on page load
        loadFormData();
    }
});

// ===================================
// Export for potential backend integration
// ===================================

window.HotelBooking = {
    // This can be extended for API calls
    sendBooking: function(data) {
        // Placeholder for backend integration
        console.log('Sending booking to backend:', data);

        // Example fetch call (uncomment when backend is ready):
        /*
        return fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
            throw error;
        });
        */
    }
};
