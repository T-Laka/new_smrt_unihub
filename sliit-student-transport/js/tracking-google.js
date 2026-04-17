// ============================================================
// SLIIT Student Transport — Google Maps Ride Tracking
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// Google Maps objects
let map;
let driverMarker;
let pickupMarker;
let dropMarker;
let routePath;
let directionsService;
let directionsRenderer;

// Current ride data
let currentRide = null;

// SLIIT coordinates (default center - Malabe Campus)
const SLIIT_COORDS = { lat: 6.9147, lng: 79.9729 };

// Initialize Google Map
function initMap() {
    // Create map instance
    map = new google.maps.Map(document.getElementById('map'), {
        center: SLIIT_COORDS,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
            {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "transit",
                "elementType": "labels",
                "stylers": [{ "visibility": "off" }]
            }
        ]
    });

    // Initialize directions service
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#4f46e5',
            strokeWeight: 5,
            strokeOpacity: 0.8
        }
    });

    // Load ride data
    loadRideData();

    // Start real-time updates
    setInterval(updateDriverLocation, 3000);
}

// Custom marker icons
function createDriverMarker(position) {
    return new google.maps.Marker({
        position: position,
        map: map,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="23" fill="#4f46e5" stroke="white" stroke-width="3"/>
                    <text x="25" y="32" text-anchor="middle" font-size="20">🚗</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(50, 50),
            anchor: new google.maps.Point(25, 25)
        },
        title: 'Driver Location',
        animation: google.maps.Animation.DROP
    });
}

function createPickupMarker(position) {
    return new google.maps.Marker({
        position: position,
        map: map,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="3"/>
                    <text x="20" y="27" text-anchor="middle" font-size="16">📍</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        },
        title: 'Pickup Location'
    });
}

function createDropMarker(position) {
    return new google.maps.Marker({
        position: position,
        map: map,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="3"/>
                    <text x="20" y="27" text-anchor="middle" font-size="16">🎯</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        },
        title: 'Drop-off Location'
    });
}

// Load Ride Data
async function loadRideData() {
    const urlParams = new URLSearchParams(window.location.search);
    const rideId = urlParams.get('id');

    if (!rideId) {
        loadDemoData();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/rides/${rideId}`);
        if (!response.ok) throw new Error('Ride not found');

        currentRide = await response.json();
        displayRideData(currentRide);
        setupMapWithRoute(currentRide);
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
            address: 'Malabe Junction, Sri Lanka',
            lat: 6.9147,
            lng: 79.9729
        },
        dropLocation: {
            address: 'SLIIT Campus, Malabe',
            lat: 6.9271,
            lng: 79.9739
        },
        scheduledDate: new Date(),
        scheduledTime: '08:00 AM',
        passengers: 2,
        fare: 350,
        driver: {
            user: { name: 'Kamal Perera', phone: '0771234567' },
            vehicleType: 'Toyota Prius',
            vehicleNumber: 'CAB-1234',
            rating: 4.8,
            currentLocation: {
                lat: 6.9080,
                lng: 79.9650
            }
        }
    };

    displayRideData(currentRide);
    setupMapWithRoute(currentRide);
}

// Display Ride Data
function displayRideData(ride) {
    document.getElementById('pickupAddress').textContent = ride.pickupLocation?.address || 'Pickup Location';
    document.getElementById('dropAddress').textContent = ride.dropLocation?.address || 'Drop Location';

    if (ride.driver) {
        document.getElementById('driverName').textContent = ride.driver.user?.name || 'Driver';
        document.getElementById('vehicleInfo').textContent = `${ride.driver.vehicleType || 'Vehicle'} • ${ride.driver.vehicleNumber || 'Number'}`;
        document.getElementById('driverRating').textContent = (ride.driver.rating || 0).toFixed(1);
    }

    document.getElementById('rideFare').textContent = `Rs. ${ride.fare || 0}`;
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

    if (['completed', 'cancelled'].includes(status)) {
        cancelBtn.style.display = 'none';
    }
}

// Setup Map with Route
function setupMapWithRoute(ride) {
    // Clear existing markers
    if (driverMarker) driverMarker.setMap(null);
    if (pickupMarker) pickupMarker.setMap(null);
    if (dropMarker) dropMarker.setMap(null);

    // Coordinates
    const pickupPos = {
        lat: ride.pickupLocation?.lat || 6.9147,
        lng: ride.pickupLocation?.lng || 79.9729
    };

    const dropPos = {
        lat: ride.dropLocation?.lat || 6.9271,
        lng: ride.dropLocation?.lng || 79.9739
    };

    const driverPos = {
        lat: ride.driver?.currentLocation?.lat || 6.9080,
        lng: ride.driver?.currentLocation?.lng || 79.9650
    };

    // Create markers
    pickupMarker = createPickupMarker(pickupPos);
    dropMarker = createDropMarker(dropPos);
    driverMarker = createDriverMarker(driverPos);

    // Add info windows
    const pickupInfo = new google.maps.InfoWindow({
        content: `<div style="padding:8px;font-family:Poppins,sans-serif;">
            <strong>Pickup</strong><br>${ride.pickupLocation?.address || 'Pickup Location'}
        </div>`
    });
    pickupMarker.addListener('click', () => pickupInfo.open(map, pickupMarker));

    const dropInfo = new google.maps.InfoWindow({
        content: `<div style="padding:8px;font-family:Poppins,sans-serif;">
            <strong>Drop-off</strong><br>${ride.dropLocation?.address || 'Drop Location'}
        </div>`
    });
    dropMarker.addListener('click', () => dropInfo.open(map, dropMarker));

    const driverInfo = new google.maps.InfoWindow({
        content: `<div style="padding:8px;font-family:Poppins,sans-serif;">
            <strong>Your Driver</strong><br>${ride.driver?.user?.name || 'Driver'}<br>
            ${ride.driver?.vehicleType} - ${ride.driver?.vehicleNumber}
        </div>`
    });
    driverMarker.addListener('click', () => driverInfo.open(map, driverMarker));

    // Calculate route
    calculateAndDisplayRoute(driverPos, pickupPos, dropPos);

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(driverPos);
    bounds.extend(pickupPos);
    bounds.extend(dropPos);
    map.fitBounds(bounds, { padding: 50 });
}

// Calculate and Display Route
function calculateAndDisplayRoute(origin, waypoint, destination) {
    const request = {
        origin: origin,
        destination: destination,
        waypoints: [{ location: waypoint, stopover: true }],
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);

            // Get ETA and distance
            const leg1 = result.routes[0].legs[0]; // Driver to pickup
            const leg2 = result.routes[0].legs[1]; // Pickup to drop

            const etaMinutes = Math.round(leg1.duration.value / 60);
            const totalDistance = ((leg1.distance.value + leg2.distance.value) / 1000).toFixed(1);

            document.getElementById('etaTime').textContent = `${etaMinutes} min`;
            document.getElementById('etaDistance').textContent = `${(leg1.distance.value / 1000).toFixed(1)} km away`;
            document.getElementById('distanceRemaining').textContent = `${totalDistance} km`;
        } else {
            console.error('Directions request failed:', status);
            // Fallback to simple distance calculation
            calculateSimpleETA(origin, waypoint);
        }
    });
}

// Simple ETA calculation (fallback)
function calculateSimpleETA(from, to) {
    const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const avgSpeed = 30; // km/h
    const timeInMinutes = Math.round((distance / avgSpeed) * 60);

    document.getElementById('etaTime').textContent = `${timeInMinutes} min`;
    document.getElementById('etaDistance').textContent = `${distance.toFixed(1)} km away`;
    document.getElementById('distanceRemaining').textContent = `${distance.toFixed(1)} km`;
}

// Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

// Update driver location (simulation)
function updateDriverLocation() {
    if (!currentRide || !driverMarker || !pickupMarker) return;

    const currentPos = driverMarker.getPosition();
    const targetPos = pickupMarker.getPosition();

    // Simulate movement towards pickup
    const newLat = currentPos.lat() + (targetPos.lat() - currentPos.lat()) * 0.1;
    const newLng = currentPos.lng() + (targetPos.lng() - currentPos.lng()) * 0.1;

    // Animate marker movement
    animateMarker(driverMarker, currentPos, { lat: newLat, lng: newLng });

    // Update route
    const driverPos = { lat: newLat, lng: newLng };
    const pickupPos = { lat: targetPos.lat(), lng: targetPos.lng() };
    const dropPos = { lat: dropMarker.getPosition().lat(), lng: dropMarker.getPosition().lng() };

    calculateAndDisplayRoute(driverPos, pickupPos, dropPos);

    // Check if driver arrived
    const distanceToPickup = calculateDistance(newLat, newLng, targetPos.lat(), targetPos.lng());
    if (distanceToPickup < 0.05) {
        document.getElementById('statusText').textContent = 'Driver arrived at pickup!';
    }
}

// Animate marker smoothly
function animateMarker(marker, from, to) {
    const frames = 30;
    let frame = 0;

    const animate = () => {
        frame++;
        const progress = frame / frames;
        const lat = from.lat() + (to.lat - from.lat()) * progress;
        const lng = from.lng() + (to.lng - from.lng()) * progress;

        marker.setPosition({ lat, lng });

        if (frame < frames) {
            requestAnimationFrame(animate);
        }
    };

    animate();
}

// Call Driver
function callDriver() {
    if (currentRide?.driver?.user?.phone) {
        window.location.href = `tel:${currentRide.driver.user.phone}`;
    } else {
        alert('Driver phone: 0771234567 (Demo)');
    }
}

// Open Chat
function openChat() {
    if (currentRide?._id && currentRide._id !== 'demo123') {
        window.location.href = `chat.html?rideId=${currentRide._id}`;
    } else {
        window.location.href = 'chat.html';
    }
}

// Cancel Ride
async function cancelRide() {
    if (!confirm('Are you sure you want to cancel this ride?')) return;

    if (!currentRide?._id || currentRide._id === 'demo123') {
        alert('Demo ride cancelled');
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

// Make functions globally accessible
window.initMap = initMap;
window.callDriver = callDriver;
window.openChat = openChat;
window.cancelRide = cancelRide;
