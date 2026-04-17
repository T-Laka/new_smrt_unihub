// ============================================================
// SLIIT Student Transport — Rider Dashboard JavaScript
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// Current rating ride
let currentRatingRideId = null;
let selectedRating = 0;

// Initialize rider dashboard specific features
document.addEventListener('DOMContentLoaded', function() {
    initRiderDashboard();
    initBookingForm();
    initRatingModal();
    loadRiderOverview();
});

// Initialize Rider Dashboard
function initRiderDashboard() {
    // Set minimum date for booking to today
    const dateInput = document.getElementById('rideDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }

    // Set default time to next hour
    const timeInput = document.getElementById('rideTime');
    if (timeInput) {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        now.setMinutes(0);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }

    // Load nearby drivers
    loadNearbyDrivers();

    // Load settings
    loadRiderSettings();
}

// Initialize Booking Form
function initBookingForm() {
    const form = document.getElementById('bookRideForm');
    if (!form) return;

    // Update fare estimate on input change
    const passengersSelect = document.getElementById('passengers');
    if (passengersSelect) {
        passengersSelect.addEventListener('change', updateFareEstimate);
    }

    updateFareEstimate();
}

// Update Fare Estimate
function updateFareEstimate() {
    const passengers = parseInt(document.getElementById('passengers')?.value || 1);
    const baseFare = 150;
    const perPassenger = 50;
    const estimate = baseFare + (passengers * perPassenger);

    const fareEl = document.getElementById('estimatedFare');
    if (fareEl) {
        fareEl.textContent = `Rs. ${estimate}`;
    }
}

// Load Rider Overview
async function loadRiderOverview() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const response = await fetch(`${API_BASE}/rides/rider/${user._id}`);
        const rides = await response.json();

        // Calculate stats
        const completedRides = rides.filter(r => r.status === 'completed');
        const activeRides = rides.filter(r => ['pending', 'accepted', 'ongoing'].includes(r.status));

        const totalTrips = completedRides.length;
        const totalSpent = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
        const kmTraveled = completedRides.reduce((sum, r) => sum + (r.distance || 0), 0);

        // Update UI
        const totalTripsEl = document.getElementById('totalTrips');
        const totalSpentEl = document.getElementById('totalSpent');
        const kmTraveledEl = document.getElementById('kmTraveled');
        const activeBookingsEl = document.getElementById('activeBookings');

        if (totalTripsEl) totalTripsEl.textContent = totalTrips;
        if (totalSpentEl) totalSpentEl.textContent = `Rs. ${totalSpent}`;
        if (kmTraveledEl) kmTraveledEl.textContent = `${kmTraveled} km`;
        if (activeBookingsEl) activeBookingsEl.textContent = activeRides.length;

        // Display active bookings
        displayActiveBookings(activeRides);

    } catch (error) {
        console.error('Error loading rider overview:', error);
    }
}

// Display Active Bookings
function displayActiveBookings(bookings) {
    const container = document.getElementById('activeBookingsList');
    if (!container) return;

    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>🚗</span>
                <p>No active bookings</p>
                <small>Book a ride to get started</small>
            </div>
        `;
        return;
    }

    container.innerHTML = bookings.slice(0, 3).map(booking => `
        <div class="ride-list-item">
            <div class="ride-list-info">
                <div class="ride-list-icon ${getStatusColor(booking.status)}">
                    ${getStatusIcon(booking.status)}
                </div>
                <div class="ride-list-details">
                    <h4>${booking.dropLocation?.address || 'Destination'}</h4>
                    <p>${formatDate(booking.scheduledDate)} at ${booking.scheduledTime}</p>
                </div>
            </div>
            <span class="history-status ${booking.status}">${booking.status}</span>
        </div>
    `).join('');
}

// Get status icon
function getStatusIcon(status) {
    const icons = {
        pending: '⏳',
        accepted: '✓',
        ongoing: '🚗',
        completed: '✓',
        cancelled: '✕'
    };
    return icons[status] || '📋';
}

// Get status color class
function getStatusColor(status) {
    const colors = {
        pending: 'pending',
        accepted: 'accepted',
        ongoing: 'ongoing',
        completed: 'completed',
        cancelled: 'cancelled'
    };
    return colors[status] || '';
}

// Load Nearby Drivers
async function loadNearbyDrivers() {
    const container = document.getElementById('nearbyDriversList');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE}/drivers?available=true`);
        const drivers = await response.json();

        if (drivers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>🚗</span>
                    <p>No nearby drivers</p>
                    <small>Drivers will appear as they come online</small>
                </div>
            `;
            return;
        }

        container.innerHTML = drivers.slice(0, 5).map(driver => `
            <div class="nearby-driver-card">
                <div class="driver-avatar">👨‍🎓</div>
                <div class="driver-info">
                    <h4>${driver.user?.name || 'Driver'}</h4>
                    <p>${driver.vehicleType} - ${driver.vehicleNumber}</p>
                    <div class="driver-rating">
                        <span>⭐ ${(driver.rating || 0).toFixed(1)}</span>
                        <span class="rides-count">${driver.totalRides || 0} rides</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading nearby drivers:', error);
    }
}

// Load Rider Settings
function loadRiderSettings() {
    const user = getCurrentUser();
    if (!user) return;

    const nameEl = document.getElementById('settingsName');
    const studentIdEl = document.getElementById('settingsStudentId');
    const phoneEl = document.getElementById('settingsPhone');
    const emailEl = document.getElementById('settingsEmail');

    if (nameEl) nameEl.value = user.name || '';
    if (studentIdEl) studentIdEl.value = user.studentId || '';
    if (phoneEl) phoneEl.value = user.phone || '';
    if (emailEl) emailEl.value = user.email || '';
}

// Rating Modal Functions
function initRatingModal() {
    const stars = document.querySelectorAll('.rating-stars .star');

    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStarsUI();
        });

        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });

        star.addEventListener('mouseout', function() {
            highlightStars(selectedRating);
        });
    });
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.rating-stars .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.style.filter = 'none';
        } else {
            star.classList.remove('active');
            star.style.filter = 'grayscale(100%)';
        }
    });
}

function updateStarsUI() {
    highlightStars(selectedRating);
}

function openRatingModal(rideId) {
    currentRatingRideId = rideId;
    selectedRating = 0;
    updateStarsUI();
    document.getElementById('reviewText').value = '';
    document.getElementById('ratingModal').classList.add('active');
}

function closeRatingModal() {
    document.getElementById('ratingModal').classList.remove('active');
    currentRatingRideId = null;
    selectedRating = 0;
}

async function submitRating() {
    if (!currentRatingRideId || selectedRating === 0) {
        alert('Please select a rating');
        return;
    }

    try {
        const review = document.getElementById('reviewText').value;

        const response = await fetch(`${API_BASE}/rides/${currentRatingRideId}/rate`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                raterType: 'rider',
                rating: selectedRating,
                review: review
            })
        });

        if (response.ok) {
            alert('Thank you for your feedback!');
            closeRatingModal();
            loadMyBookings();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to submit rating');
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        alert('Error submitting rating');
    }
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get current user from localStorage
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('driver');
    localStorage.removeItem('currentRide');
    localStorage.removeItem('rememberedEmail');
    window.location.href = 'login.html';
}

// Load My Bookings
async function loadMyBookings() {
    const container = document.getElementById('myBookingsList');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) return;

    try {
        const response = await fetch(`${API_BASE}/rides/rider/${user._id}`);
        const rides = await response.json();

        // Filter by status if needed
        const filterStatus = document.getElementById('bookingFilterStatus')?.value;
        let filteredRides = rides;
        if (filterStatus && filterStatus !== 'all') {
            filteredRides = rides.filter(r => r.status === filterStatus);
        }

        if (filteredRides.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>🚗</span>
                    <p>No bookings yet</p>
                    <small>Book a ride to get started</small>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredRides.map(ride => `
            <div class="booking-card" data-ride-id="${ride._id}">
                <div class="booking-header">
                    <span class="booking-status ${ride.status}">${ride.status}</span>
                    <span class="booking-date">${formatDate(ride.scheduledDate)}</span>
                </div>

                <div class="ride-locations">
                    <div class="location-item">
                        <span>📍</span>
                        <p>${ride.pickupLocation?.address || ride.pickupLocation || 'Pickup'}</p>
                    </div>
                    <div class="location-item">
                        <span>🎯</span>
                        <p>${ride.dropLocation?.address || ride.dropLocation || 'Destination'}</p>
                    </div>
                </div>

                ${ride.driver ? `
                    <div class="driver-assigned">
                        <div class="driver-info">
                            <span class="driver-avatar">👨‍🎓</span>
                            <div>
                                <h4>${ride.driver.user?.name || 'Driver'}</h4>
                                <p>${ride.driver.vehicleType} - ${ride.driver.vehicleNumber}</p>
                            </div>
                        </div>
                        <div class="driver-rating">⭐ ${ride.driver.rating?.toFixed(1) || '0.0'}</div>
                    </div>
                ` : ''}

                <div class="booking-footer">
                    <div class="booking-fare">Rs. ${ride.fare || 200}</div>
                    ${ride.status === 'pending' ? `
                        <button class="btn btn-sm btn-decline" onclick="cancelBooking('${ride._id}')">
                            Cancel
                        </button>
                    ` : ''}
                    ${ride.status === 'completed' && !ride.driverRating ? `
                        <button class="btn btn-sm btn-primary" onclick="openRatingModal('${ride._id}')">
                            Rate Driver
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span>⚠️</span>
                <p>Error loading bookings</p>
                <small>Please try again</small>
            </div>
        `;
    }
}

// Load Ride History
async function loadRideHistory() {
    const container = document.getElementById('rideHistoryList');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) return;

    try {
        const response = await fetch(`${API_BASE}/rides/rider/${user._id}`);
        const rides = await response.json();

        // Filter completed and cancelled rides
        let historyRides = rides.filter(r => ['completed', 'cancelled'].includes(r.status));

        // Apply filters
        const filterStatus = document.getElementById('filterStatus')?.value;
        if (filterStatus && filterStatus !== 'all') {
            historyRides = historyRides.filter(r => r.status === filterStatus);
        }

        const filterDate = document.getElementById('filterDate')?.value;
        if (filterDate) {
            historyRides = historyRides.filter(r =>
                new Date(r.scheduledDate).toDateString() === new Date(filterDate).toDateString()
            );
        }

        if (historyRides.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📜</span>
                    <p>No ride history yet</p>
                    <small>Your completed rides will appear here</small>
                </div>
            `;
            return;
        }

        container.innerHTML = historyRides.map(ride => `
            <div class="history-card">
                <div class="history-main">
                    <div class="history-icon ${ride.status}">
                        ${ride.status === 'completed' ? '✓' : '✕'}
                    </div>
                    <div class="history-details">
                        <h4>${ride.pickupLocation?.address || ride.pickupLocation || 'Unknown'} → ${ride.dropLocation?.address || ride.dropLocation || 'Unknown'}</h4>
                        <p>${formatDate(ride.scheduledDate)} at ${ride.scheduledTime}</p>
                    </div>
                </div>
                <div class="history-right">
                    <div class="history-amount">Rs. ${ride.fare || 0}</div>
                    <span class="history-status ${ride.status}">${ride.status}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading ride history:', error);
    }
}

// Load Favorite Drivers
async function loadFavoriteDrivers() {
    const container = document.getElementById('favoriteDriversList');
    if (!container) return;

    // For now, load from localStorage or show empty state
    const favorites = JSON.parse(localStorage.getItem('favoriteDrivers') || '[]');

    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>⭐</span>
                <p>No favorite drivers</p>
                <small>Star a driver after a ride to add them here</small>
            </div>
        `;
        return;
    }

    container.innerHTML = favorites.map(driver => `
        <div class="favorite-driver-card">
            <div class="driver-avatar">👨‍🎓</div>
            <div class="driver-info">
                <h4>${driver.name || 'Driver'}</h4>
                <p>${driver.vehicleType} - ${driver.vehicleNumber}</p>
                <div class="driver-rating">
                    <span>⭐ ${(driver.rating || 0).toFixed(1)}</span>
                </div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="bookWithDriver('${driver._id}')">
                Book Now
            </button>
        </div>
    `).join('');
}

// Cancel Booking
async function cancelBooking(rideId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
        const response = await fetch(`${API_BASE}/rides/${rideId}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Cancelled by rider' })
        });

        if (response.ok) {
            alert('Booking cancelled successfully');
            loadMyBookings();
            loadRiderOverview();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to cancel booking');
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Error cancelling booking');
    }
}

// Book with specific driver
function bookWithDriver(driverId) {
    // Switch to book tab and pre-select driver
    switchTab('book');
    // Store preferred driver
    localStorage.setItem('preferredDriver', driverId);
}

// Switch Tab function
function switchTab(tabName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Load tab-specific data
    switch(tabName) {
        case 'overview':
            loadRiderOverview();
            break;
        case 'book':
            loadNearbyDrivers();
            break;
        case 'bookings':
            loadMyBookings();
            break;
        case 'history':
            loadRideHistory();
            break;
        case 'favorites':
            loadFavoriteDrivers();
            break;
        case 'settings':
            loadRiderSettings();
            break;
    }
}

// Initialize sidebar navigation
function initSidebarNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.dataset.tab;
            if (tab) {
                switchTab(tab);
            }
        });
    });
}

// Initialize Book Ride Form submission
function initBookRideFormSubmission() {
    const form = document.getElementById('bookRideForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const user = getCurrentUser();
        if (!user) {
            alert('Please log in to book a ride');
            window.location.href = 'login.html';
            return;
        }

        const submitBtn = document.getElementById('bookRideBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Booking...';
        }

        const data = {
            riderId: user._id,
            pickupLocation: document.getElementById('pickupLocation').value,
            dropLocation: document.getElementById('dropLocation').value,
            scheduledDate: document.getElementById('rideDate').value,
            scheduledTime: document.getElementById('rideTime').value,
            passengers: parseInt(document.getElementById('passengers').value)
        };

        try {
            const response = await fetch(`${API_BASE}/rides`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Ride booked successfully! A driver will accept your request soon.');
                // Reset form
                form.reset();
                initRiderDashboard(); // Reset date/time defaults
                // Switch to bookings tab
                switchTab('bookings');
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to book ride');
            }
        } catch (error) {
            console.error('Error booking ride:', error);
            alert('Error booking ride. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 Book Ride Now';
            }
        }
    });
}

// Initialize profile form submission
function initProfileFormSubmission() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const user = getCurrentUser();
        if (!user) return;

        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = '⏳ Saving...';
        }

        const data = {
            name: document.getElementById('settingsName').value,
            phone: document.getElementById('settingsPhone').value
        };

        try {
            const response = await fetch(`${API_BASE}/users/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                localStorage.setItem('user', JSON.stringify(updatedUser));
                alert('Profile updated successfully!');
                // Update name in sidebar
                const riderNameEl = document.getElementById('riderName');
                if (riderNameEl) riderNameEl.textContent = updatedUser.name;
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 Save Changes';
            }
        }
    });
}

// Add filter event listeners
function initFilters() {
    const bookingFilterStatus = document.getElementById('bookingFilterStatus');
    if (bookingFilterStatus) {
        bookingFilterStatus.addEventListener('change', loadMyBookings);
    }

    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', loadRideHistory);
    }

    const filterDate = document.getElementById('filterDate');
    if (filterDate) {
        filterDate.addEventListener('change', loadRideHistory);
    }
}

// Override DOMContentLoaded to include all initializations
document.removeEventListener('DOMContentLoaded', initRiderDashboard);
document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Set rider name
    const riderNameEl = document.getElementById('riderName');
    if (riderNameEl) riderNameEl.textContent = user.name || 'Rider';

    initRiderDashboard();
    initBookingForm();
    initRatingModal();
    initSidebarNav();
    initBookRideFormSubmission();
    initProfileFormSubmission();
    initFilters();
    loadRiderOverview();
});

// Make functions globally available
window.logout = logout;
window.openRatingModal = openRatingModal;
window.closeRatingModal = closeRatingModal;
window.submitRating = submitRating;
window.switchTab = switchTab;
window.loadMyBookings = loadMyBookings;
window.loadRideHistory = loadRideHistory;
window.loadFavoriteDrivers = loadFavoriteDrivers;
window.loadNearbyDrivers = loadNearbyDrivers;
window.cancelBooking = cancelBooking;
window.bookWithDriver = bookWithDriver;
