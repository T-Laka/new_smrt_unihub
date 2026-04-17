document.addEventListener('DOMContentLoaded', () => {
	const mapEl = document.getElementById('home-map');
	if (!mapEl || !window.L) return;

	const campus = [6.9147, 79.9721];
	const drivers = [
		{ id: 'D1', name: 'Kasun · Sedan', coords: [6.9172, 79.971], color: '#4f46e5' },
		{ id: 'D2', name: 'Nimali · Hatchback', coords: [6.9129, 79.9751], color: '#0ea5e9' },
		{ id: 'D3', name: 'Dineth · Bike', coords: [6.915, 79.9682], color: '#10b981' },
		{ id: 'D4', name: 'Sahan · Van', coords: [6.9184, 79.9792], color: '#f59e0b' }
	];

	const map = L.map('home-map', { zoomControl: false }).setView(campus, 15);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '© OpenStreetMap contributors'
	}).addTo(map);

	L.control.zoom({ position: 'bottomright' }).addTo(map);

	L.marker(campus, { title: 'SLIIT Malabe Campus' })
		.addTo(map)
		.bindPopup('SLIIT Malabe Campus');

	const driverMarkers = drivers.map(driver => {
		const marker = L.circleMarker(driver.coords, {
			radius: 9,
			fillColor: driver.color,
			color: '#ffffff',
			weight: 2,
			opacity: 1,
			fillOpacity: 0.9
		})
			.addTo(map)
			.bindPopup(`${driver.name}<br><small>Active now</small>`);

		return { ...driver, marker };
	});

	// Static preview only: no live geolocation or driver jitter
	if (driverMarkers.length) {
		const bounds = driverMarkers.map(d => d.marker.getLatLng());
		bounds.push(L.latLng(campus[0], campus[1]));
		map.fitBounds(bounds, { padding: [30, 30] });
	}
});
