// ============================================================
// SLIIT Student Transport — Driver Dashboard
// Full featured driver dashboard with real-time updates
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// State
let currentUser = null;
let currentDriver = null;
let currentRide = null;
let socket = null;
let soundEnabled = true;

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    currentUser = JSON.parse(localStorage.getItem('user'));
    currentDriver = JSON.parse(localStorage.getItem('driver'));

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // If user is not a driver, redirect
    if (currentUser.role !== 'driver') {
        window.location.href = 'rider-dashboard.html';
        return;
    }

    // Load driver info if not in localStorage
    if (!currentDriver && currentUser._id) {
        loadDriverInfo(currentUser._id);
    } else if (currentDriver) {
        initializeDashboard();
    }
});

// Load driver info from API
async function loadDriverInfo(userId) {
    try {
        const response = await fetch(`${API_BASE}/drivers/user/${userId}`);
        if (response.ok) {
            currentDriver = await response.json();
            localStorage.setItem('driver', JSON.stringify(currentDriver));
            initializeDashboard();
        } else {
            // Driver profile not found
            showToast('error', 'Error', 'Driver profile not found. Please register as a driver.');
            setTimeout(() => {
                window.location.href = 'become-driver.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading driver info:', error);
        showToast('error', 'Connection Error', 'Could not load driver information.');
    }
}

// Initialize dashboard
function initializeDashboard() {
    // Check approval status
    if (!currentDriver.isApproved) {
        document.getElementById('dashboardContent').style.display = 'none';
        document.getElementById('approvalPending').style.display = 'block';
        return;
    }

    // Setup UI
    setupUserInfo();
    setupSidebarNav();
    setupAvailabilityToggle();
    setupForms();
    setupFilters();

    // Load data
    loadDashboardData();
    checkActiveRide();

    // Setup Socket.IO
    initializeSocket();

    // Sound toggle
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('change', function() {
            soundEnabled = this.checked;
        });
    }
}

// ============================================================
// User Info
// ============================================================

function setupUserInfo() {
    // Set driver name
    document.getElementById('driverName').textContent = currentUser.name || 'Driver';

    // Set rating
    const rating = currentDriver.rating || 0;
    document.getElementById('sidebarRating').textContent = rating.toFixed(1);
    document.getElementById('rating').textContent = rating.toFixed(1);

    // Set status
    const statusEl = document.getElementById('driverStatus');
    if (currentDriver.isApproved) {
        statusEl.textContent = 'Verified Driver';
        statusEl.style.color = '#10b981';
    } else {
        statusEl.textContent = 'Pending Approval';
        statusEl.style.color = '#f59e0b';
    }
}

// ============================================================
// Navigation
// ============================================================

function setupSidebarNav() {
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

function loadTabData(tabName) {
    switch(tabName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'current-ride':
            updateCurrentRideUI();
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
        case 'settings':
            loadSettingsData();
            break;
    }
}

// ============================================================
// Availability Toggle
// ============================================================

function setupAvailabilityToggle() {
    const toggle = document.getElementById('availabilityToggle');
    if (!toggle) return;

    toggle.checked = currentDriver.isAvailable || false;
    updateAvailabilityStatus(toggle.checked);

    toggle.addEventListener('change', async function() {
        const isAvailable = this.checked;
        updateAvailabilityStatus(isAvailable);

        try {
            const response = await fetch(`${API_BASE}/drivers/${currentDriver._id}/availability`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAvailable })
            });

            if (response.ok) {
                currentDriver.isAvailable = isAvailable;
                localStorage.setItem('driver', JSON.stringify(currentDriver));

                if (isAvailable) {
                    showToast('success', 'Online', 'You are now accepting ride requests');
                    loadPendingRides();
                } else {
                    showToast('info', 'Offline', 'You are no longer accepting ride requests');
                }
            }
        } catch (error) {
            console.error('Error updating availability:', error);
            toggle.checked = !isAvailable;
            updateAvailabilityStatus(!isAvailable);
            showToast('error', 'Error', 'Could not update availability');
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

// ============================================================
// Dashboard Data
// ============================================================

async function loadDashboardData() {
    loadOverviewData();
}

async function loadOverviewData() {
    if (!currentDriver) return;

    try {
        // Get driver stats
        const statsResponse = await fetch(`${API_BASE}/drivers/${currentDriver._id}/stats`);
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('totalRides').textContent = stats.totalRides || 0;
            document.getElementById('totalEarnings').textContent = `Rs. ${stats.totalEarnings || 0}`;
            document.getElementById('rating').textContent = (stats.rating || 0).toFixed(1);
        }

        // Get driver's rides
        const ridesResponse = await fetch(`${API_BASE}/rides/driver/${currentDriver._id}`);
        if (ridesResponse.ok) {
            const rides = await ridesResponse.json();

            // Calculate today's stats
            const today = new Date().toDateString();
            const todayRides = rides.filter(r =>
                r.status === 'completed' &&
                new Date(r.completedAt || r.updatedAt).toDateString() === today
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

function displayRecentRides(rides) {
    const container = document.getElementById('recentRides');
    if (!container) return;

    if (!rides || rides.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>🚗</span>
                <p>No recent rides</p>
            </div>
        `;
        return;
    }

    container.innerHTML = rides.map(ride => `
        <div class="ride-list-item">
            <div class="ride-list-info">
                <div class="ride-list-icon">🚗</div>
                <div class="ride-list-details">
                    <h4>${truncateAddress(ride.dropLocation?.address || 'Unknown')}</h4>
                    <p>${formatDate(ride.scheduledDate)} at ${ride.scheduledTime || 'N/A'}</p>
                </div>
            </div>
            <span class="history-status ${ride.status}">${capitalizeFirst(ride.status)}</span>
        </div>
    `).join('');
}

// ============================================================
// Ride Requests
// ============================================================

async function loadPendingRides() {
    const container = document.getElementById('pendingRidesList');
    if (!container) return;

    // Show loading
    container.innerHTML = `<div class="empty-state"><span>⏳</span><p>Loading ride requests...</p></div>`;

    try {
        const response = await fetch(`${API_BASE}/rides/pending`);
        const rides = await response.json();

        // Update badge
        const badge = document.getElementById('requestsBadge');
        if (badge) {
            if (rides.length > 0) {
                badge.textContent = rides.length;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }

        if (!Array.isArray(rides) || rides.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📭</span>
                    <p>No pending ride requests</p>
                    <small>New requests will appear here when you're online</small>
                </div>
            `;
            return;
        }

        // Sort rides
        const sortBy = document.getElementById('sortRides')?.value || 'newest';
        const sortedRides = sortRides(rides, sortBy);

        container.innerHTML = sortedRides.map(ride => `
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
                        ${ride.scheduledTime || 'Flexible'}
                    </div>
                    <div class="meta-item">
                        <span>👥</span>
                        ${ride.passengers || 1} passenger${(ride.passengers || 1) > 1 ? 's' : ''}
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

function sortRides(rides, sortBy) {
    switch(sortBy) {
        case 'fare':
            return rides.sort((a, b) => calculateFare(b) - calculateFare(a));
        case 'distance':
            // Would need location data for proper sorting
            return rides;
        case 'newest':
        default:
            return rides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
}

function calculateFare(ride) {
    const baseFare = 150;
    const perPassenger = 50;
    const passengers = ride.passengers || 1;
    return baseFare + (passengers * perPassenger);
}

// ============================================================
// Accept Ride
// ============================================================

async function acceptRide(rideId) {
    if (currentRide) {
        showToast('warning', 'Active Ride', 'Please complete your current ride first');
        return;
    }

    const btn = document.querySelector(`[data-ride-id="${rideId}"] .btn-accept`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Accepting...';
    }

    try {
        const response = await fetch(`${API_BASE}/rides/${rideId}/accept`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driverId: currentDriver._id,
                fare: calculateFare({ passengers: 1 })
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentRide = data;
            localStorage.setItem('currentRide', JSON.stringify(currentRide));

            showToast('success', 'Ride Accepted!', 'Head to the pickup location');
            playNotificationSound();

            // Show current ride nav and banner
            showActiveRideUI();

            // Switch to current ride tab
            switchTab('current-ride');

            // Refresh pending rides
            loadPendingRides();
        } else {
            showToast('error', 'Error', data.message || 'Could not accept ride');
            if (btn) {
                btn.disabled = false;
                btn.textContent = '✓ Accept Ride';
            }
        }
    } catch (error) {
        console.error('Error accepting ride:', error);
        showToast('error', 'Connection Error', 'Please try again');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '✓ Accept Ride';
        }
    }
}

function declineRide(rideId) {
    const card = document.querySelector(`[data-ride-id="${rideId}"]`);
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(100px)';
        setTimeout(() => card.remove(), 300);
    }
}

// ============================================================
// Current Ride Management
// ============================================================

function checkActiveRide() {
    // Check localStorage for active ride
    const savedRide = localStorage.getItem('currentRide');
    if (savedRide) {
        currentRide = JSON.parse(savedRide);
        if (currentRide && ['accepted', 'ongoing'].includes(currentRide.status)) {
            showActiveRideUI();
            return;
        }
    }

    // Also check from API
    loadActiveRide();
}

async function loadActiveRide() {
    try {
        const response = await fetch(`${API_BASE}/rides/driver/${currentDriver._id}`);
        const rides = await response.json();

        const activeRide = rides.find(r => ['accepted', 'ongoing'].includes(r.status));
        if (activeRide) {
            currentRide = activeRide;
            localStorage.setItem('currentRide', JSON.stringify(currentRide));
            showActiveRideUI();
        }
    } catch (error) {
        console.error('Error checking active ride:', error);
    }
}

function showActiveRideUI() {
    // Show current ride nav
    const currentRideNav = document.getElementById('currentRideNav');
    if (currentRideNav) {
        currentRideNav.style.display = 'flex';
    }

    // Show active ride badge
    const badge = document.getElementById('activeRideBadge');
    if (badge) {
        badge.style.display = 'flex';
    }

    // Show banner
    const banner = document.getElementById('activeRideBanner');
    if (banner && currentRide) {
        banner.classList.add('show');
        document.getElementById('activeRideDestination').textContent =
            `Heading to ${truncateAddress(currentRide.dropLocation?.address || 'destination')}`;
    }

    updateCurrentRideUI();
}

function hideActiveRideUI() {
    document.getElementById('currentRideNav').style.display = 'none';
    document.getElementById('activeRideBadge').style.display = 'none';
    document.getElementById('activeRideBanner').classList.remove('show');
    document.getElementById('currentRideCard').style.display = 'none';
    document.getElementById('noActiveRide').style.display = 'block';
}

function updateCurrentRideUI() {
    const noRideEl = document.getElementById('noActiveRide');
    const rideCard = document.getElementById('currentRideCard');

    if (!currentRide) {
        noRideEl.style.display = 'block';
        rideCard.style.display = 'none';
        return;
    }

    noRideEl.style.display = 'none';
    rideCard.style.display = 'block';

    // Update status header
    const statusHeader = document.getElementById('rideStatusHeader');
    const statusTitle = document.getElementById('rideStatusTitle');
    const statusSubtitle = document.getElementById('rideStatusSubtitle');

    statusHeader.className = 'ride-status-header ' + currentRide.status;

    if (currentRide.status === 'accepted') {
        statusTitle.textContent = 'Ride Accepted';
        statusSubtitle.textContent = 'Head to pickup location';
    } else if (currentRide.status === 'ongoing') {
        statusTitle.textContent = 'Ride in Progress';
        statusSubtitle.textContent = 'Heading to drop-off location';
    }

    // Update passenger info
    document.getElementById('passengerName').textContent = currentRide.rider?.name || 'Student';
    document.getElementById('passengerInfo').textContent =
        `${currentRide.rider?.studentId || 'SLIIT'} • ${currentRide.passengers || 1} passenger`;

    // Update locations
    document.getElementById('pickupAddress').textContent =
        currentRide.pickupLocation?.address || 'Pickup location';
    document.getElementById('dropoffAddress').textContent =
        currentRide.dropLocation?.address || 'Drop-off location';

    // Update fare
    document.getElementById('currentFare').textContent =
        `Rs. ${currentRide.fare || calculateFare(currentRide)}`;

    // Update action buttons
    updateRideActionButtons();
}

function updateRideActionButtons() {
    const actionsContainer = document.getElementById('rideActions');
    if (!actionsContainer || !currentRide) return;

    let buttonsHTML = '';

    if (currentRide.status === 'accepted') {
        buttonsHTML = `
            <button class="btn btn-chat" onclick="openChat()">
                💬 Chat with Rider
            </button>
            <button class="btn btn-cancel" onclick="openCancelModal()">
                ✕ Cancel
            </button>
            <button class="btn btn-start btn-primary" onclick="startRide()">
                🚗 Start Ride - Picked Up Passenger
            </button>
        `;
    } else if (currentRide.status === 'ongoing') {
        buttonsHTML = `
            <button class="btn btn-chat" onclick="openChat()">
                💬 Chat
            </button>
            <button class="btn btn-cancel" onclick="openCancelModal()">
                ✕ Cancel
            </button>
            <button class="btn btn-complete btn-primary" onclick="completeRide()">
                ✓ Complete Ride - Reached Destination
            </button>
        `;
    }

    actionsContainer.innerHTML = buttonsHTML;
}

// ============================================================
// Ride Actions
// ============================================================

async function startRide() {
    if (!currentRide) return;

    try {
        const response = await fetch(`${API_BASE}/rides/${currentRide._id}/start`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            currentRide.status = 'ongoing';
            localStorage.setItem('currentRide', JSON.stringify(currentRide));

            showToast('success', 'Ride Started!', 'Heading to drop-off location');
            updateCurrentRideUI();
            showActiveRideUI();
        } else {
            const error = await response.json();
            showToast('error', 'Error', error.message || 'Could not start ride');
        }
    } catch (error) {
        console.error('Error starting ride:', error);
        showToast('error', 'Connection Error', 'Please try again');
    }
}

async function completeRide() {
    if (!currentRide) return;

    try {
        const response = await fetch(`${API_BASE}/rides/${currentRide._id}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const fare = currentRide.fare || calculateFare(currentRide);

            showToast('success', 'Ride Completed!', `You earned Rs. ${fare}`);
            playNotificationSound();

            // Clear current ride
            currentRide = null;
            localStorage.removeItem('currentRide');

            // Hide active ride UI
            hideActiveRideUI();

            // Refresh data
            loadOverviewData();
            loadRideHistory();
            loadEarningsData();

            // Switch to overview
            switchTab('overview');
        } else {
            const error = await response.json();
            showToast('error', 'Error', error.message || 'Could not complete ride');
        }
    } catch (error) {
        console.error('Error completing ride:', error);
        showToast('error', 'Connection Error', 'Please try again');
    }
}

function openCancelModal() {
    document.getElementById('cancelModal').classList.add('active');
}

function closeCancelModal() {
    document.getElementById('cancelModal').classList.remove('active');
    document.getElementById('cancelReason').value = '';
    document.getElementById('cancelNotes').value = '';
}

async function confirmCancelRide() {
    const reason = document.getElementById('cancelReason').value;
    const notes = document.getElementById('cancelNotes').value;

    if (!reason) {
        showToast('warning', 'Select Reason', 'Please select a cancellation reason');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/rides/${currentRide._id}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reason: reason,
                cancelledBy: 'driver',
                notes: notes
            })
        });

        if (response.ok) {
            closeCancelModal();
            showToast('info', 'Ride Cancelled', 'The ride has been cancelled');

            // Clear current ride
            currentRide = null;
            localStorage.removeItem('currentRide');

            // Hide active ride UI
            hideActiveRideUI();

            // Refresh data
            loadPendingRides();
            loadRideHistory();

            // Switch to rides tab
            switchTab('rides');
        } else {
            const error = await response.json();
            showToast('error', 'Error', error.message || 'Could not cancel ride');
        }
    } catch (error) {
        console.error('Error cancelling ride:', error);
        showToast('error', 'Connection Error', 'Please try again');
    }
}

// ============================================================
// Navigation
// ============================================================

function navigateToPickup() {
    if (!currentRide?.pickupLocation) return;

    const { lat, lng } = currentRide.pickupLocation;
    if (lat && lng) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
        const address = encodeURIComponent(currentRide.pickupLocation.address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
}

function navigateToDropoff() {
    if (!currentRide?.dropLocation) return;

    const { lat, lng } = currentRide.dropLocation;
    if (lat && lng) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
        const address = encodeURIComponent(currentRide.dropLocation.address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
}

function callPassenger() {
    if (!currentRide?.rider?.phone) {
        showToast('info', 'No Phone', 'Passenger phone number not available');
        return;
    }
    window.location.href = `tel:${currentRide.rider.phone}`;
}

function openChat() {
    if (!currentRide) return;
    window.location.href = `chat.html?rideId=${currentRide._id}`;
}

// ============================================================
// Ride History
// ============================================================

async function loadRideHistory() {
    const container = document.getElementById('rideHistoryList');
    if (!container) return;

    container.innerHTML = `<div class="empty-state"><span>⏳</span><p>Loading history...</p></div>`;

    try {
        const response = await fetch(`${API_BASE}/rides/driver/${currentDriver._id}`);
        let rides = await response.json();

        // Filter by status
        const statusFilter = document.getElementById('filterStatus')?.value || 'all';
        if (statusFilter !== 'all') {
            rides = rides.filter(r => r.status === statusFilter);
        }

        // Filter by period
        const periodFilter = document.getElementById('filterPeriod')?.value || 'all';
        rides = filterByPeriod(rides, periodFilter);

        // Only show completed/cancelled rides in history
        rides = rides.filter(r => ['completed', 'cancelled'].includes(r.status));

        if (rides.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📜</span>
                    <p>No ride history found</p>
                    <small>Try changing your filters</small>
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
                        <h4>${truncateAddress(ride.pickupLocation?.address || 'Unknown')} → ${truncateAddress(ride.dropLocation?.address || 'Unknown')}</h4>
                        <p>${formatDate(ride.completedAt || ride.updatedAt)} • ${ride.rider?.name || 'Student'}</p>
                    </div>
                </div>
                <div class="history-right">
                    <div class="history-amount">${ride.status === 'completed' ? `Rs. ${ride.fare || 0}` : '-'}</div>
                    <span class="history-status ${ride.status}">${capitalizeFirst(ride.status)}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading ride history:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span>⚠️</span>
                <p>Error loading history</p>
            </div>
        `;
    }
}

function filterByPeriod(rides, period) {
    const now = new Date();

    switch(period) {
        case 'today':
            return rides.filter(r => {
                const date = new Date(r.completedAt || r.updatedAt);
                return date.toDateString() === now.toDateString();
            });
        case 'week':
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            return rides.filter(r => new Date(r.completedAt || r.updatedAt) >= weekAgo);
        case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return rides.filter(r => new Date(r.completedAt || r.updatedAt) >= monthStart);
        default:
            return rides;
    }
}

// ============================================================
// Earnings
// ============================================================

async function loadEarningsData() {
    try {
        const response = await fetch(`${API_BASE}/rides/driver/${currentDriver._id}`);
        const rides = await response.json();

        const completedRides = rides.filter(r => r.status === 'completed');

        // Total earnings
        const totalEarnings = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
        document.getElementById('totalEarnings').textContent = `Rs. ${totalEarnings}`;
        document.getElementById('baseFaresTotal').textContent = `Rs. ${totalEarnings}`;

        // This week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weeklyRides = completedRides.filter(r =>
            new Date(r.completedAt || r.updatedAt) >= weekStart
        );
        const weeklyEarnings = weeklyRides.reduce((sum, r) => sum + (r.fare || 0), 0);
        document.getElementById('weeklyEarnings').textContent = `Rs. ${weeklyEarnings}`;

        // This month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthlyRides = completedRides.filter(r =>
            new Date(r.completedAt || r.updatedAt) >= monthStart
        );
        const monthlyEarnings = monthlyRides.reduce((sum, r) => sum + (r.fare || 0), 0);
        document.getElementById('monthlyEarnings').textContent = `Rs. ${monthlyEarnings}`;

        // Performance stats
        const totalRideRequests = rides.length;
        const acceptedRides = rides.filter(r => r.status !== 'pending').length;
        const acceptanceRate = totalRideRequests > 0 ?
            Math.round((acceptedRides / totalRideRequests) * 100) : 100;
        document.getElementById('acceptanceRate').textContent = `${acceptanceRate}%`;

        const completionRate = acceptedRides > 0 ?
            Math.round((completedRides.length / acceptedRides) * 100) : 100;
        document.getElementById('completionRate').textContent = `${completionRate}%`;

        document.getElementById('avgRating').textContent =
            `⭐ ${(currentDriver.rating || 0).toFixed(1)}`;

        // Display transactions
        displayTransactions(completedRides.slice(0, 10));
    } catch (error) {
        console.error('Error loading earnings:', error);
    }
}

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
                    <h4>Ride to ${truncateAddress(ride.dropLocation?.address || 'Unknown')}</h4>
                    <p>${formatDateTime(ride.completedAt || ride.updatedAt)}</p>
                </div>
            </div>
            <span class="transaction-amount">+Rs. ${ride.fare || 0}</span>
        </div>
    `).join('');
}

// ============================================================
// Settings
// ============================================================

function loadSettingsData() {
    if (currentUser) {
        document.getElementById('settingsName').value = currentUser.name || '';
        document.getElementById('settingsPhone').value = currentUser.phone || '';
        document.getElementById('settingsEmail').value = currentUser.email || '';
        document.getElementById('settingsStudentId').value = currentUser.studentId || '';
    }

    if (currentDriver) {
        document.getElementById('settingsVehicleType').value = currentDriver.vehicleType || 'Sedan';
        document.getElementById('settingsVehicleNumber').value = currentDriver.vehicleNumber || '';
        document.getElementById('settingsVehicleModel').value = currentDriver.vehicleModel || '';
        document.getElementById('settingsLicenseNumber').value = currentDriver.licenseNumber || '';
        document.getElementById('settingsCapacity').value = currentDriver.capacity || 4;
    }
}

function setupForms() {
    // Profile Form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const data = {
                name: document.getElementById('settingsName').value,
                phone: document.getElementById('settingsPhone').value
            };

            try {
                const response = await fetch(`${API_BASE}/users/${currentUser._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    currentUser = updatedUser;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    showToast('success', 'Success', 'Profile updated successfully!');
                    setupUserInfo();
                } else {
                    const error = await response.json();
                    showToast('error', 'Error', error.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showToast('error', 'Connection Error', 'Please try again');
            }
        });
    }

    // Vehicle Form
    const vehicleForm = document.getElementById('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const data = {
                vehicleType: document.getElementById('settingsVehicleType').value,
                vehicleNumber: document.getElementById('settingsVehicleNumber').value,
                vehicleModel: document.getElementById('settingsVehicleModel').value,
                licenseNumber: document.getElementById('settingsLicenseNumber').value,
                capacity: parseInt(document.getElementById('settingsCapacity').value)
            };

            try {
                const response = await fetch(`${API_BASE}/drivers/${currentDriver._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const updatedDriver = await response.json();
                    currentDriver = updatedDriver;
                    localStorage.setItem('driver', JSON.stringify(currentDriver));
                    showToast('success', 'Success', 'Vehicle info updated!');
                } else {
                    const error = await response.json();
                    showToast('error', 'Error', error.message || 'Failed to update vehicle');
                }
            } catch (error) {
                console.error('Error updating vehicle:', error);
                showToast('error', 'Connection Error', 'Please try again');
            }
        });
    }
}

function setupFilters() {
    // Sort rides
    const sortRides = document.getElementById('sortRides');
    if (sortRides) {
        sortRides.addEventListener('change', loadPendingRides);
    }

    // Filter status
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', loadRideHistory);
    }

    // Filter period
    const filterPeriod = document.getElementById('filterPeriod');
    if (filterPeriod) {
        filterPeriod.addEventListener('change', loadRideHistory);
    }
}

// ============================================================
// Socket.IO Real-time Updates
// ============================================================

function initializeSocket() {
    try {
        socket = io(API_BASE.replace('/api', ''));

        socket.on('connect', () => {
            console.log('Socket connected');
            // Join driver room
            socket.emit('join-driver', currentDriver._id);
        });

        // New ride request
        socket.on('new-ride-request', (ride) => {
            showToast('info', 'New Ride Request!', `${ride.rider?.name || 'Student'} needs a ride`);
            playNotificationSound();
            loadPendingRides();
            updateRequestsBadge();
        });

        // Ride cancelled by rider
        socket.on('ride-cancelled', (data) => {
            if (currentRide && currentRide._id === data.rideId) {
                showToast('warning', 'Ride Cancelled', 'The rider has cancelled this ride');
                currentRide = null;
                localStorage.removeItem('currentRide');
                hideActiveRideUI();
                switchTab('rides');
            }
        });

        // New chat message
        socket.on('new-message', (data) => {
            showToast('info', 'New Message', data.message);
            playNotificationSound();
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    } catch (error) {
        console.error('Socket connection error:', error);
    }
}

function updateRequestsBadge() {
    // Will be updated when loadPendingRides is called
}

// ============================================================
// Toast Notifications
// ============================================================

function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
        <span class="toast-close" onclick="this.parentElement.remove()">×</span>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function playNotificationSound() {
    if (!soundEnabled) return;

    try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
        // Simple beep - in production, use a proper audio file
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.2);
    } catch (e) {
        // Audio not supported
    }
}

// ============================================================
// Utility Functions
// ============================================================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateAddress(address, maxLength = 35) {
    if (!address) return 'Unknown';
    return address.length > maxLength ? address.substring(0, maxLength) + '...' : address;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function refreshRides() {
    loadPendingRides();
    showToast('info', 'Refreshed', 'Ride requests updated');
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('driver');
    localStorage.removeItem('currentRide');
    window.location.href = 'login.html';
}

function confirmDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        // In production, call API to delete account
        showToast('info', 'Coming Soon', 'Account deletion will be available soon');
    }
}

// Make functions globally available
window.switchTab = switchTab;
window.acceptRide = acceptRide;
window.declineRide = declineRide;
window.startRide = startRide;
window.completeRide = completeRide;
window.openCancelModal = openCancelModal;
window.closeCancelModal = closeCancelModal;
window.confirmCancelRide = confirmCancelRide;
window.navigateToPickup = navigateToPickup;
window.navigateToDropoff = navigateToDropoff;
window.callPassenger = callPassenger;
window.openChat = openChat;
window.refreshRides = refreshRides;
window.logout = logout;
window.confirmDeleteAccount = confirmDeleteAccount;
