// Leaflet map for Track Ride page with geolocation + simulated driver
const DEFAULT_CENTER = [6.9147, 79.9721]; // SLIIT Malabe
const DEFAULT_ZOOM = 14;

let map;
let userMarker;
let driverMarker;
let driverInterval;
let driverPathIndex = 0;
let accuracyCircle;
let firstUserFix = true;

const CAMPUS = [6.9147, 79.9721];

const demoDriverPath = [
	[6.9165, 79.9688],
	[6.9172, 79.9705],
	[6.9184, 79.9726],
	[6.9179, 79.9744],
	[6.9168, 79.9731]
];

function initLeafletMap() {
	const mapEl = document.getElementById('map');
	if (!mapEl) return;

	map = L.map(mapEl).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; OpenStreetMap contributors'
	}).addTo(map);

	L.marker(CAMPUS, { title: 'SLIIT Malabe Campus' }).addTo(map);

	if (navigator.geolocation) {
		navigator.geolocation.watchPosition(onPosition, onGeoError, {
			enableHighAccuracy: true,
			maximumAge: 5000,
			timeout: 10000
		});
	} else {
		setStatus('Geolocation is not supported by this browser.');
	}

	startDemoDriver();
}

function onPosition(pos) {
	const lat = pos.coords.latitude;
	const lng = pos.coords.longitude;

	if (!userMarker) {
		userMarker = L.circleMarker([lat, lng], {
			radius: 9,
			fillColor: '#10b981',
			color: '#ffffff',
			weight: 2,
			fillOpacity: 0.9
		}).addTo(map).bindPopup('You');
	} else {
		userMarker.setLatLng([lat, lng]);
	}

	if (!accuracyCircle) {
		accuracyCircle = L.circle([lat, lng], {
			radius: pos.coords.accuracy,
			color: '#10b981',
			weight: 1,
			fillOpacity: 0.08
		}).addTo(map);
	} else {
		accuracyCircle.setLatLng([lat, lng]).setRadius(pos.coords.accuracy);
	}

	if (firstUserFix) {
		map.setView([lat, lng], 15);
		firstUserFix = false;
	}

	updateEta();
}

function onGeoError(err) {
	console.error('Geolocation error:', err);
	setStatus('Unable to access your location. Showing default view.');
}

function startDemoDriver() {
	driverMarker = L.circleMarker(demoDriverPath[0], {
		radius: 9,
		fillColor: '#4f46e5',
		color: '#ffffff',
		weight: 2,
		fillOpacity: 0.9
	}).addTo(map).bindPopup('Driver');
	driverInterval = setInterval(() => {
		driverPathIndex = (driverPathIndex + 1) % demoDriverPath.length;
		const next = demoDriverPath[driverPathIndex];
		driverMarker.setLatLng(next);
		updateEta();
	}, 3000);
}

function updateEta() {
	if (!userMarker || !driverMarker) return;

	const u = userMarker.getLatLng();
	const d = driverMarker.getLatLng();
	const distanceKm = haversine(u.lat, u.lng, d.lat, d.lng);
	const etaMinutes = Math.round((distanceKm / 30) * 60); // assume 30 km/h

	const etaEl = document.getElementById('etaTime');
	const distEl = document.getElementById('etaDistance');
	const remainingEl = document.getElementById('distanceRemaining');
	const statusText = document.getElementById('statusText');

	if (etaEl) etaEl.textContent = `${etaMinutes} min`;
	if (distEl) distEl.textContent = `${distanceKm.toFixed(1)} km away`;
	if (remainingEl) remainingEl.textContent = `${distanceKm.toFixed(1)} km`;
	if (statusText && distanceKm < 0.1) {
		statusText.textContent = 'Driver arrived at pickup';
	}
}

function haversine(lat1, lon1, lat2, lon2) {
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

function setStatus(message) {
	const statusText = document.getElementById('statusText');
	if (statusText) statusText.textContent = message;
}

document.addEventListener('DOMContentLoaded', initLeafletMap);
