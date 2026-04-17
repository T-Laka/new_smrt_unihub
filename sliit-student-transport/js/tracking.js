// ============================================================
// SLIIT Student Transport — Ride Tracking JavaScript
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// Map instance
let map;
let driverMarker;
let pickupMarker;
let dropMarker;
let routeLine;

// Current ride data
let currentRide = null;

// SLIIT coordinates (default center)
const SLIIT_COORDS = [6.9147, 79.9729];

// Custom icons
const driverIcon = L.divIcon({
    className: 'driver-marker-icon',
    html: '<div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; box-shadow: 0 4px 12px rgba(79,70,229,0.4); border: 3px solid white;">🚗</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const pickupIcon = L.divIcon({
    className: 'pickup-marker-icon',
    html: '<div style="background: #10b981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; box-shadow: 0 4px 12px rgba(16,185,129,0.4); border: 3px solid white;">📍</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const dropIcon = L.divIcon({
    className: 'drop-marker-icon',
    html: '<div style="background: #ef4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; box-shadow: 0 4px 12px rgba(239,68,68,0.4); border: 3px solid white;">🎯</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadRideData();

    // Simulate real-time updates
    setInterval(updateDriverLocation, 3000);
});

// Initialize Map
function initMap() {
    map = L.map('map').setView(SLIIT_COORDS, 14);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Load Ride Data
async function loadRideData() {
    // Get ride ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const rideId = urlParams.get('id');

    if (!rideId) {
        // Demo mode - show sample data
        loadDemoData();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/rides/${rideId}`);
        if (!response.ok) throw new Error('Ride not found');

        currentRide = await response.json();
        displayRideData(currentRide);
        setupMap(currentRide);
    } catch (error) {
        console.error('Error loading ride:', error);
        loadDemoData();
    }
}

// Load Demo Data
function loadDemoData() {
    currentRide = {
        _id: 'demo123',
        status: 'ongoing',
        pickupLocation: {
            address: 'Malabe, Sri Lanka',
            lat: 6.9147,
            lng: 79.9729
        },
        dropLocation: {
            address: 'SLIIT Campus, Malabe',
            lat: 6.9147,
            lng: 79.9729
        },
        scheduledDate: new Date(),
        scheduledTime: '08:00 AM',
        passengers: 2,
        fare: 350,
        driver: {
            user: { name: 'Kamal Perera' },
            vehicleType: 'Toyota Prius',
            vehicleNumber: 'CAB-1234',
            rating: 4.8,
            currentLocation: {
                lat: 6.9180,
                lng: 79.9650
            }
        }
    };

    displayRideData(currentRide);
    setupMap(currentRide);
}

// Display Ride Data
function displayRideData(ride) {
    // Update addresses
    document.getElementById('pickupAddress').textContent = ride.pickupLocation?.address || 'Pickup Location';
    document.getElementById('dropAddress').textContent = ride.dropLocation?.address || 'Drop Location';

    // Update driver info
    if (ride.driver) {
        document.getElementById('driverName').textContent = ride.driver.user?.name || 'Driver';
        document.getElementById('vehicleInfo').textContent = `${ride.driver.vehicleType || 'Vehicle'} • ${ride.driver.vehicleNumber || 'Number'}`;
        document.getElementById('driverRating').textContent = (ride.driver.rating || 0).toFixed(1);
    }

    // Update fare
    document.getElementById('rideFare').textContent = `Rs. ${ride.fare || 0}`;

    // Update status
    updateRideStatus(ride.status);
}

// Update Ride Status
function updateRideStatus(status) {
    const badge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    const cancelBtn = document.getElementById('cancelBtn');

    const statuses = {
        pending: { text: 'Waiting for driver', class: 'pending' },
        accepted: { text: 'Driver assigned', class: 'accepted' },
        ongoing: { text: 'Driver is on the way', class: 'ongoing' },
        completed: { text: 'Ride completed', class: 'completed' },
        cancelled: { text: 'Ride cancelled', class: 'cancelled' }
    };

    const statusInfo = statuses[status] || statuses.pending;

    badge.className = `ride-status-badge ${statusInfo.class}`;
    statusText.textContent = statusInfo.text;

    // Hide cancel button if ride is completed or cancelled
    if (['completed', 'cancelled'].includes(status)) {
        cancelBtn.style.display = 'none';
    }
}

// Setup Map with Markers and Route
function setupMap(ride) {
    // Clear existing markers
    if (driverMarker) map.removeLayer(driverMarker);
    if (pickupMarker) map.removeLayer(pickupMarker);
    if (dropMarker) map.removeLayer(dropMarker);
    if (routeLine) map.removeLayer(routeLine);

    // Default coordinates around Malabe
    const pickupCoords = [
        ride.pickupLocation?.lat || 6.9147,
        ride.pickupLocation?.lng || 79.9729
    ];

    const dropCoords = [
        ride.dropLocation?.lat || 6.9200,
        ride.dropLocation?.lng || 79.9800
    ];

    const driverCoords = [
        ride.driver?.currentLocation?.lat || 6.9100,
        ride.driver?.currentLocation?.lng || 79.9650
    ];

    // Add pickup marker
    pickupMarker = L.marker(pickupCoords, { icon: pickupIcon })
        .addTo(map)
        .bindPopup('<strong>Pickup</strong><br>' + (ride.pickupLocation?.address || 'Pickup Location'));

    // Add drop marker
    dropMarker = L.marker(dropCoords, { icon: dropIcon })
        .addTo(map)
        .bindPopup('<strong>Drop-off</strong><br>' + (ride.dropLocation?.address || 'Drop Location'));

    // Add driver marker
    if (ride.driver) {
        driverMarker = L.marker(driverCoords, { icon: driverIcon })
            .addTo(map)
            .bindPopup('<strong>Your Driver</strong><br>' + (ride.driver.user?.name || 'Driver'));
    }

    // Draw route line
    routeLine = L.polyline([driverCoords, pickupCoords, dropCoords], {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
    }).addTo(map);

    // Fit map to show all markers
    const bounds = L.latLngBounds([driverCoords, pickupCoords, dropCoords]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Calculate and display ETA
    calculateETA(driverCoords, pickupCoords);
}

// Calculate ETA
function calculateETA(from, to) {
    // Calculate distance using Haversine formula
    const distance = calculateDistance(from[0], from[1], to[0], to[1]);

    // Assume average speed of 30 km/h in traffic
    const avgSpeed = 30;
    const timeInHours = distance / avgSpeed;
    const timeInMinutes = Math.round(timeInHours * 60);

    // Update UI
    document.getElementById('etaTime').textContent = `${timeInMinutes} min`;
    document.getElementById('etaDistance').textContent = `${distance.toFixed(1)} km away`;
    document.getElementById('distanceRemaining').textContent = `${distance.toFixed(1)} km`;
}

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

// Simulate driver location update
function updateDriverLocation() {
    if (!currentRide || !driverMarker) return;

    // Simulate movement towards pickup
    const currentPos = driverMarker.getLatLng();
    const targetPos = pickupMarker ? pickupMarker.getLatLng() : currentPos;

    // Move driver slightly towards target
    const newLat = currentPos.lat + (targetPos.lat - currentPos.lat) * 0.1;
    const newLng = currentPos.lng + (targetPos.lng - currentPos.lng) * 0.1;

    // Update marker position with animation
    driverMarker.setLatLng([newLat, newLng]);

    // Update route line
    if (routeLine && dropMarker) {
        routeLine.setLatLngs([
            [newLat, newLng],
            pickupMarker.getLatLng(),
            dropMarker.getLatLng()
        ]);
    }

    // Update ETA
    calculateETA([newLat, newLng], [targetPos.lat, targetPos.lng]);

    // Check if driver arrived at pickup
    const distanceToPickup = calculateDistance(newLat, newLng, targetPos.lat, targetPos.lng);
    if (distanceToPickup < 0.1) {
        document.getElementById('statusText').textContent = 'Driver arrived at pickup';
    }
}

// Call Driver
function callDriver() {
    if (currentRide?.driver?.user?.phone) {
        window.location.href = `tel:${currentRide.driver.user.phone}`;
    } else {
        alert('Driver phone number not available');
    }
}

// Open Chat
function openChat() {
    if (currentRide?._id) {
        window.location.href = `chat.html?rideId=${currentRide._id}`;
    } else {
        alert('Chat feature coming soon!');
    }
}

// Cancel Ride
async function cancelRide() {
    if (!confirm('Are you sure you want to cancel this ride?')) return;

    if (!currentRide?._id || currentRide._id === 'demo123') {
        alert('This is a demo ride. Cancel action simulated.');
        window.location.href = 'rider-dashboard.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/rides/${currentRide._id}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Cancelled by rider' })
        });

        if (response.ok) {
            alert('Ride cancelled successfully');
            window.location.href = 'rider-dashboard.html';
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to cancel ride');
        }
    } catch (error) {
        console.error('Error cancelling ride:', error);
        alert('Error cancelling ride');
    }
}
