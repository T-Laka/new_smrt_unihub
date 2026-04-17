// ============================================================
// SLIIT Student Transport — Enhanced Dashboard JavaScript
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// Loading states and error handling
let isLoading = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// Show loading indicator
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

// Show error message
function showError(elementId, message, showRetry = true) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="error-state">
                <span>⚠️</span>
                <p>${message}</p>
                ${showRetry ? `<button class="retry-btn" onclick="location.reload()">🔄 Try Again</button>` : ''}
            </div>
        `;
    }
}

// Show success notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✅' : '⚠️'}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Enhanced user authentication check
function getCurrentUser() {
    try {
        const user = localStorage.getItem('user');
        if (!user) return null;

        const userData = JSON.parse(user);

        // Validate user data structure
        if (!userData._id || !userData.name || !userData.email || !userData.role) {
            console.error('Invalid user data structure:', userData);
            localStorage.removeItem('user');
            return null;
        }

        return userData;
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user'); // Clear corrupted data
        return null;
    }
}

// Enhanced driver info check
function getDriverInfo() {
    try {
        const driver = localStorage.getItem('driver');
        return driver ? JSON.parse(driver) : null;
    } catch (error) {
        console.error('Error parsing driver data:', error);
        localStorage.removeItem('driver');
        return null;
    }
}

// Enhanced API request function with retry logic
async function apiRequest(url, options = {}) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`API Request attempt ${attempt}: ${url}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Resource not found');
                } else if (response.status === 401) {
                    throw new Error('Unauthorized - please log in again');
                } else if (response.status >= 500) {
                    throw new Error('Server error - please try again later');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Request failed with status ${response.status}`);
                }
            }

            return await response.json();
        } catch (error) {
            lastError = error;
            console.error(`API request attempt ${attempt} failed:`, error);

            if (attempt < maxRetries &&
                (error.name === 'AbortError' || error.message.includes('fetch'))) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                continue;
            }
            break;
        }
    }

    throw lastError;
}

// Initialize dashboard with error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Dashboard initializing...');

        const user = getCurrentUser();

        // Check if user is logged in
        if (!user) {
            console.log('No user found, redirecting to login');
            showNotification('Please log in to access your dashboard', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        console.log('User authenticated:', user);

        // Set user name in sidebar
        const driverNameEl = document.getElementById('driverName');
        const riderNameEl = document.getElementById('riderName');

        if (driverNameEl) driverNameEl.textContent = user.name || 'Driver';
        if (riderNameEl) riderNameEl.textContent = user.name || 'Rider';

        // Initialize components
        initSidebarNav();
        initAvailabilityToggle();
        initForms();

        // Load dashboard data with fallbacks
        loadDashboardDataSafely();

        console.log('Dashboard initialized successfully');

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError('main-content', 'Failed to initialize dashboard. Please refresh the page.');
    }
});

// Safe dashboard data loading with fallbacks
async function loadDashboardDataSafely() {
    try {
        // Show loading states
        showLoading('activeBookingsList');
        showLoading('nearbyDriversList');

        // Try to load data, fall back to mock data if API fails
        const promises = [
            loadOverviewDataSafely(),
            loadNearbyDriversSafely(),
            loadUserSpecificData()
        ];

        await Promise.allSettled(promises);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Some data may not be up to date due to connection issues', 'warning');
        loadFallbackData();
    }
}

// Load overview data with error handling
async function loadOverviewDataSafely() {
    try {
        const user = getCurrentUser();
        const driver = getDriverInfo();

        if (driver) {
            // Update driver stats
            document.getElementById('rating').textContent = (driver.rating || 0).toFixed(1);
            document.getElementById('totalRides').textContent = driver.totalRides || 0;
            document.getElementById('totalEarnings').textContent = `Rs. ${driver.totalEarnings || 0}`;
        }

        // Try to load recent rides from API
        if (driver) {
            const rides = await apiRequest(`${API_BASE}/rides/driver/${driver._id}`);
            displayRecentRides(rides.slice(0, 5));
        }

    } catch (error) {
        console.error('Error loading overview data:', error);
        // Show fallback data
        displayFallbackOverview();
    }
}

// Load nearby drivers with fallback
async function loadNearbyDriversSafely() {
    const container = document.getElementById('nearbyDriversList');
    if (!container) return;

    try {
        const drivers = await apiRequest(`${API_BASE}/drivers?available=true`);

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
        container.innerHTML = `
            <div class="error-state">
                <span>⚠️</span>
                <p>Unable to load nearby drivers</p>
                <small>Please check your connection</small>
            </div>
        `;
    }
}

// Load user-specific data based on role
async function loadUserSpecificData() {
    const user = getCurrentUser();
    if (!user) return;

    if (user.role === 'rider') {
        await loadRiderDataSafely();
    } else if (user.role === 'driver') {
        await loadDriverDataSafely();
    }
}

// Load rider data safely
async function loadRiderDataSafely() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const rides = await apiRequest(`${API_BASE}/rides/rider/${user._id}`);

        // Calculate stats
        const completedRides = rides.filter(r => r.status === 'completed');
        const activeRides = rides.filter(r => ['pending', 'accepted', 'ongoing'].includes(r.status));

        const totalTrips = completedRides.length;
        const totalSpent = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
        const kmTraveled = completedRides.reduce((sum, r) => sum + (r.distance || 0), 0);

        // Update UI safely
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
        console.error('Error loading rider data:', error);
        displayFallbackRiderData();
    }
}

// Display fallback data when API is unavailable
function loadFallbackData() {
    console.log('Loading fallback data...');

    // Show sample active booking
    const activeBookingsContainer = document.getElementById('activeBookingsList');
    if (activeBookingsContainer) {
        activeBookingsContainer.innerHTML = `
            <div class="fallback-notice">
                <span>⚠️</span>
                <p>Unable to connect to server</p>
                <small>Showing cached data</small>
            </div>
        `;
    }

    // Show sample stats
    const totalTripsEl = document.getElementById('totalTrips');
    const totalSpentEl = document.getElementById('totalSpent');
    const kmTraveledEl = document.getElementById('kmTraveled');

    if (totalTripsEl) totalTripsEl.textContent = '--';
    if (totalSpentEl) totalSpentEl.textContent = 'Rs. --';
    if (kmTraveledEl) kmTraveledEl.textContent = '-- km';
}

function displayFallbackRiderData() {
    const elements = {
        'totalTrips': '0',
        'totalSpent': 'Rs. 0',
        'kmTraveled': '0 km',
        'activeBookings': '0'
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

// Rest of the original functions with error handling...
// [Continue with enhanced versions of other functions]

// Sidebar Navigation
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

// Switch tabs with error handling
function switchTab(tabName) {
    try {
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
        } else {
            console.error(`Tab not found: tab-${tabName}`);
            showNotification(`Unable to load ${tabName} section`, 'error');
            return;
        }

        // Load tab-specific data
        loadTabData(tabName);

    } catch (error) {
        console.error('Error switching tab:', error);
        showNotification('Error loading section', 'error');
    }
}

// Load tab-specific data with error handling
async function loadTabData(tabName) {
    try {
        switch(tabName) {
            case 'overview':
                await loadOverviewDataSafely();
                break;
            case 'rides':
                await loadPendingRidesSafely();
                break;
            case 'history':
                await loadRideHistorySafely();
                break;
            case 'earnings':
                await loadEarningsDataSafely();
                break;
            case 'bookings':
                await loadMyBookingsSafely();
                break;
            case 'settings':
                loadSettingsData();
                break;
        }
    } catch (error) {
        console.error(`Error loading ${tabName} data:`, error);
        showNotification(`Error loading ${tabName} data`, 'error');
    }
}

// Enhanced availability toggle
function initAvailabilityToggle() {
    const toggle = document.getElementById('availabilityToggle');
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
                await apiRequest(`${API_BASE}/drivers/${driver._id}/availability`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isAvailable })
                });

                // Update localStorage
                driver.isAvailable = isAvailable;
                localStorage.setItem('driver', JSON.stringify(driver));

                showNotification(
                    `You are now ${isAvailable ? 'online' : 'offline'}`,
                    'success'
                );
            }
        } catch (error) {
            console.error('Error updating availability:', error);
            // Revert toggle on error
            this.checked = !isAvailable;
            updateAvailabilityStatus(!isAvailable);
            showNotification('Failed to update availability', 'error');
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

// Enhanced form initialization
function initForms() {
    // Initialize all forms with error handling
    initProfileForm();
    initVehicleForm();
    initBookRideForm();
}

// Enhanced logout function
function logout() {
    try {
        localStorage.removeItem('user');
        localStorage.removeItem('driver');
        localStorage.removeItem('currentRide');
        localStorage.removeItem('rememberedEmail');

        showNotification('Logged out successfully', 'success');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);

    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if there's an error
        window.location.href = 'login.html';
    }
}

// Safe wrapper functions for tab loading
async function loadMyBookingsSafely() {
    try {
        if (typeof loadMyBookings === 'function') {
            await loadMyBookings();
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

async function loadRideHistorySafely() {
    try {
        if (typeof loadRideHistory === 'function') {
            await loadRideHistory();
        }
    } catch (error) {
        console.error('Error loading ride history:', error);
    }
}

async function loadPendingRidesSafely() {
    try {
        // For driver dashboard - not applicable to rider
        console.log('Pending rides not applicable for rider dashboard');
    } catch (error) {
        console.error('Error loading pending rides:', error);
    }
}

async function loadEarningsDataSafely() {
    try {
        // For driver dashboard - not applicable to rider
        console.log('Earnings not applicable for rider dashboard');
    } catch (error) {
        console.error('Error loading earnings:', error);
    }
}

function loadSettingsData() {
    try {
        if (typeof loadRiderSettings === 'function') {
            loadRiderSettings();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function initProfileForm() {
    // Profile form is handled in rider-dashboard.js
}

function initVehicleForm() {
    // Vehicle form is for drivers only
}

function initBookRideForm() {
    // Book ride form is handled in rider-dashboard.js
}

function displayActiveBookings(bookings) {
    const container = document.getElementById('activeBookingsList');
    if (!container) return;

    if (!bookings || bookings.length === 0) {
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
                <div class="ride-list-icon ${booking.status}">
                    ${booking.status === 'pending' ? '⏳' : booking.status === 'accepted' ? '✓' : '🚗'}
                </div>
                <div class="ride-list-details">
                    <h4>${booking.dropLocation?.address || booking.dropLocation || 'Destination'}</h4>
                    <p>${formatDateSafe(booking.scheduledDate)} at ${booking.scheduledTime}</p>
                </div>
            </div>
            <span class="history-status ${booking.status}">${booking.status}</span>
        </div>
    `).join('');
}

function formatDateSafe(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'N/A';
    }
}

function displayFallbackOverview() {
    // Show default values
    const elements = {
        'totalTrips': '0',
        'totalSpent': 'Rs. 0',
        'kmTraveled': '0 km',
        'activeBookings': '0'
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

async function loadDriverDataSafely() {
    // Not applicable for rider dashboard
}

// Make functions globally available
window.getCurrentUser = getCurrentUser;
window.getDriverInfo = getDriverInfo;
window.switchTab = switchTab;
window.logout = logout;
window.showNotification = showNotification;
window.apiRequest = apiRequest;
window.displayActiveBookings = displayActiveBookings;

console.log('Enhanced dashboard script loaded');