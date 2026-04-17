// ============================================================
// SLIIT Student Transport — Dashboard JavaScript
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// Get current user from localStorage
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Get driver info from localStorage
function getDriverInfo() {
    const driver = localStorage.getItem('driver');
    return driver ? JSON.parse(driver) : null;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();

    // Check if user is logged in
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Set user name in sidebar
    const driverNameEl = document.getElementById('driverName');
    const riderNameEl = document.getElementById('riderName');

    if (driverNameEl) driverNameEl.textContent = user.name || 'Driver';
    if (riderNameEl) riderNameEl.textContent = user.name || 'Rider';

    // Initialize sidebar navigation
    initSidebarNav();

    // Initialize availability toggle
    initAvailabilityToggle();

    // Load dashboard data
    loadDashboardData();

    // Initialize forms
    initForms();
});

// Sidebar Navigation
function initSidebarNav() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.dataset.tab;
            switchTab(tab);
        });
    });
}

// Switch tabs
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
    loadTabData(tabName);
}

// Load tab-specific data
function loadTabData(tabName) {
    switch(tabName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'rides':
            loadPendingRides();
            break;
        case 'history':
            loadRideHistory();
            break;
        case 'earnings':
            loadEarningsData();
            break;
        case 'bookings':
            loadMyBookings();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// Availability Toggle
function initAvailabilityToggle() {
    const toggle = document.getElementById('availabilityToggle');
    const status = document.getElementById('availabilityStatus');

    if (!toggle) return;

    const driver = getDriverInfo();
    if (driver) {
        toggle.checked = driver.isAvailable || false;
        updateAvailabilityStatus(toggle.checked);
    }

    toggle.addEventListener('change', async function() {
        const isAvailable = this.checked;
        updateAvailabilityStatus(isAvailable);

        try {
            const driver = getDriverInfo();
            if (driver) {
                await fetch(`${API_BASE}/drivers/${driver._id}/availability`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isAvailable })
                });

                // Update localStorage
                driver.isAvailable = isAvailable;
                localStorage.setItem('driver', JSON.stringify(driver));
            }
        } catch (error) {
            console.error('Error updating availability:', error);
        }
    });
}

function updateAvailabilityStatus(isOnline) {
    const status = document.getElementById('availabilityStatus');
    if (status) {
        status.textContent = isOnline ? "You're online" : "You're offline";
        status.classList.toggle('online', isOnline);
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    loadOverviewData();
}

// Load Overview Data
async function loadOverviewData() {
    const user = getCurrentUser();
    const driver = getDriverInfo();

    if (!user) return;

    // Update stats
    if (driver) {
        document.getElementById('rating').textContent = (driver.rating || 0).toFixed(1);
        document.getElementById('totalRides').textContent = driver.totalRides || 0;
        document.getElementById('totalEarnings').textContent = `Rs. ${driver.totalEarnings || 0}`;
    }

    // Load recent rides
    try {
        const driverId = driver?._id;
        if (driverId) {
            const response = await fetch(`${API_BASE}/rides/driver/${driverId}`);
            const rides = await response.json();

            // Calculate today's stats
            const today = new Date().toDateString();
            const todayRides = rides.filter(r =>
                new Date(r.completedAt).toDateString() === today && r.status === 'completed'
            );

            document.getElementById('todayRides').textContent = todayRides.length;
            const todayEarnings = todayRides.reduce((sum, r) => sum + (r.fare || 0), 0);
            document.getElementById('todayEarnings').textContent = `Rs. ${todayEarnings}`;

            // Display recent rides
            displayRecentRides(rides.slice(0, 5));
        }
    } catch (error) {
        console.error('Error loading overview data:', error);
    }
}

// Display Recent Rides
function displayRecentRides(rides) {
    const container = document.getElementById('recentRides');
    if (!container) return;

    if (rides.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>🚗</span>
                <p>No recent ride requests</p>
            </div>
        `;
        return;
    }

    container.innerHTML = rides.map(ride => `
        <div class="ride-list-item">
            <div class="ride-list-info">
                <div class="ride-list-icon">🚗</div>
                <div class="ride-list-details">
                    <h4>${ride.pickupLocation?.address || 'Unknown'} → ${ride.dropLocation?.address || 'Unknown'}</h4>
                    <p>${formatDate(ride.scheduledDate)} at ${ride.scheduledTime}</p>
                </div>
            </div>
            <span class="history-status ${ride.status}">${ride.status}</span>
        </div>
    `).join('');
}

// Load Pending Rides
async function loadPendingRides() {
    const container = document.getElementById('pendingRidesList');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE}/rides/pending`);
        const rides = await response.json();

        if (rides.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📭</span>
                    <p>No pending ride requests</p>
                    <small>New requests will appear here</small>
                </div>
            `;
            return;
        }

        container.innerHTML = rides.map(ride => `
            <div class="ride-request-card" data-ride-id="${ride._id}">
                <div class="ride-card-header">
                    <div class="rider-info">
                        <div class="rider-avatar">👤</div>
                        <div class="rider-details">
                            <h4>${ride.rider?.name || 'Student'}</h4>
                            <p>${ride.rider?.studentId || 'SLIIT Student'}</p>
                        </div>
                    </div>
                    <div class="ride-fare">
                        <span class="fare-amount">Rs. ${calculateFare(ride)}</span>
                    </div>
                </div>

                <div class="ride-locations">
                    <div class="location-item">
                        <span>📍</span>
                        <p>${ride.pickupLocation?.address || 'Pickup location'}</p>
                    </div>
                    <div class="location-item">
                        <span>🎯</span>
                        <p>${ride.dropLocation?.address || 'Drop location'}</p>
                    </div>
                </div>

                <div class="ride-meta">
                    <div class="meta-item">
                        <span>📅</span>
                        ${formatDate(ride.scheduledDate)}
                    </div>
                    <div class="meta-item">
                        <span>⏰</span>
                        ${ride.scheduledTime}
                    </div>
                    <div class="meta-item">
                        <span>👥</span>
                        ${ride.passengers} passengers
                    </div>
                </div>

                <div class="ride-actions">
                    <button class="btn btn-accept" onclick="acceptRide('${ride._id}')">
                        ✓ Accept Ride
                    </button>
                    <button class="btn btn-decline" onclick="declineRide('${ride._id}')">
                        ✕ Decline
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading pending rides:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span>⚠️</span>
                <p>Error loading rides</p>
                <small>Please try again later</small>
            </div>
        `;
    }
}

// Calculate fare (basic calculation)
function calculateFare(ride) {
    // Base fare + per passenger
    const baseFare = 150;
    const perPassenger = 50;
    return baseFare + (ride.passengers * perPassenger);
}

// Accept Ride
async function acceptRide(rideId) {
    const driver = getDriverInfo();
    if (!driver) {
        alert('Driver information not found. Please log in again.');
        return;
    }

    try {
        const fare = calculateFare({ passengers: 1 }); // Will be recalculated on server

        const response = await fetch(`${API_BASE}/rides/${rideId}/accept`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverId: driver._id, fare })
        });

        if (response.ok) {
            alert('Ride accepted successfully!');
            loadPendingRides();
            loadOverviewData();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to accept ride');
        }
    } catch (error) {
        console.error('Error accepting ride:', error);
        alert('Error accepting ride. Please try again.');
    }
}

// Decline Ride (just refresh the list for now)
function declineRide(rideId) {
    // Hide the card
    const card = document.querySelector(`[data-ride-id="${rideId}"]`);
    if (card) {
        card.style.display = 'none';
    }
}

// Load Ride History
async function loadRideHistory() {
    const container = document.getElementById('rideHistoryList');
    if (!container) return;

    const user = getCurrentUser();
    const driver = getDriverInfo();

    try {
        let rides = [];

        if (driver) {
            const response = await fetch(`${API_BASE}/rides/driver/${driver._id}`);
            rides = await response.json();
        } else if (user) {
            const response = await fetch(`${API_BASE}/rides/rider/${user._id}`);
            rides = await response.json();
        }

        // Filter by status if needed
        const filterStatus = document.getElementById('filterStatus')?.value;
        if (filterStatus && filterStatus !== 'all') {
            rides = rides.filter(r => r.status === filterStatus);
        }

        if (rides.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📜</span>
                    <p>No ride history yet</p>
                    <small>Your completed rides will appear here</small>
                </div>
            `;
            return;
        }

        container.innerHTML = rides.map(ride => `
            <div class="history-card">
                <div class="history-main">
                    <div class="history-icon ${ride.status}">
                        ${ride.status === 'completed' ? '✓' : '✕'}
                    </div>
                    <div class="history-details">
                        <h4>${ride.pickupLocation?.address || 'Unknown'} → ${ride.dropLocation?.address || 'Unknown'}</h4>
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

// Load Earnings Data
async function loadEarningsData() {
    const driver = getDriverInfo();
    if (!driver) return;

    try {
        const response = await fetch(`${API_BASE}/rides/driver/${driver._id}`);
        const rides = await response.json();

        const completedRides = rides.filter(r => r.status === 'completed');

        // Calculate totals
        const totalEarnings = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);

        // This week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weeklyRides = completedRides.filter(r => new Date(r.completedAt) >= weekStart);
        const weeklyEarnings = weeklyRides.reduce((sum, r) => sum + (r.fare || 0), 0);

        // This month
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthlyRides = completedRides.filter(r => new Date(r.completedAt) >= monthStart);
        const monthlyEarnings = monthlyRides.reduce((sum, r) => sum + (r.fare || 0), 0);

        document.getElementById('totalEarnings').textContent = `Rs. ${totalEarnings}`;
        document.getElementById('weeklyEarnings').textContent = `Rs. ${weeklyEarnings}`;
        document.getElementById('monthlyEarnings').textContent = `Rs. ${monthlyEarnings}`;

        // Display transactions
        displayTransactions(completedRides.slice(0, 10));
    } catch (error) {
        console.error('Error loading earnings data:', error);
    }
}

// Display Transactions
function displayTransactions(rides) {
    const container = document.getElementById('transactionList');
    if (!container) return;

    if (rides.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>💵</span>
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = rides.map(ride => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-icon">🚗</div>
                <div class="transaction-details">
                    <h4>Ride to ${ride.dropLocation?.address || 'Unknown'}</h4>
                    <p>${formatDate(ride.completedAt || ride.updatedAt)}</p>
                </div>
            </div>
            <span class="transaction-amount">+Rs. ${ride.fare || 0}</span>
        </div>
    `).join('');
}

// Load My Bookings (for riders)
async function loadMyBookings() {
    const container = document.getElementById('myBookingsList');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) return;

    try {
        const response = await fetch(`${API_BASE}/rides/rider/${user._id}`);
        const rides = await response.json();

        if (rides.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>🚗</span>
                    <p>No bookings yet</p>
                    <small>Book a ride to get started</small>
                </div>
            `;
            return;
        }

        container.innerHTML = rides.map(ride => `
            <div class="booking-card" data-ride-id="${ride._id}">
                <div class="booking-header">
                    <span class="booking-status ${ride.status}">${ride.status}</span>
                    <span class="booking-date">${formatDate(ride.scheduledDate)}</span>
                </div>

                <div class="ride-locations">
                    <div class="location-item">
                        <span>📍</span>
                        <p>${ride.pickupLocation?.address || 'Pickup'}</p>
                    </div>
                    <div class="location-item">
                        <span>🎯</span>
                        <p>${ride.dropLocation?.address || 'Destination'}</p>
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
                    <div class="booking-fare">Rs. ${ride.fare || calculateFare(ride)}</div>
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
    }
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
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to cancel booking');
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
    }
}

// Load Settings Data
function loadSettingsData() {
    const user = getCurrentUser();
    const driver = getDriverInfo();

    if (user) {
        document.getElementById('settingsName').value = user.name || '';
        document.getElementById('settingsPhone').value = user.phone || '';
        document.getElementById('settingsEmail').value = user.email || '';
    }

    if (driver) {
        document.getElementById('settingsVehicleType').value = driver.vehicleType || 'Sedan';
        document.getElementById('settingsVehicleNumber').value = driver.vehicleNumber || '';
        document.getElementById('settingsVehicleModel').value = driver.vehicleModel || '';
        document.getElementById('settingsCapacity').value = driver.capacity || 4;
    }
}

// Initialize Forms
function initForms() {
    // Profile Form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const user = getCurrentUser();
            if (!user) return;

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
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Error updating profile');
            }
        });
    }

    // Vehicle Form
    const vehicleForm = document.getElementById('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const driver = getDriverInfo();
            if (!driver) return;

            const data = {
                vehicleType: document.getElementById('settingsVehicleType').value,
                vehicleNumber: document.getElementById('settingsVehicleNumber').value,
                vehicleModel: document.getElementById('settingsVehicleModel').value,
                capacity: parseInt(document.getElementById('settingsCapacity').value)
            };

            try {
                const response = await fetch(`${API_BASE}/drivers/${driver._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const updatedDriver = await response.json();
                    localStorage.setItem('driver', JSON.stringify(updatedDriver));
                    alert('Vehicle info updated successfully!');
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to update vehicle info');
                }
            } catch (error) {
                console.error('Error updating vehicle:', error);
                alert('Error updating vehicle info');
            }
        });
    }

    // Book Ride Form
    const bookRideForm = document.getElementById('bookRideForm');
    if (bookRideForm) {
        bookRideForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const user = getCurrentUser();
            if (!user) {
                alert('Please log in to book a ride');
                window.location.href = 'login.html';
                return;
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
                    loadMyBookings();
                    switchTab('bookings');
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to book ride');
                }
            } catch (error) {
                console.error('Error booking ride:', error);
                alert('Error booking ride');
            }
        });
    }
}

// Refresh rides
function refreshRides() {
    loadPendingRides();
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Filter status change handler
document.addEventListener('DOMContentLoaded', function() {
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', loadRideHistory);
    }
});
