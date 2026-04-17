export const heroStats = [
  { value: '1,200+', label: 'Student Riders' },
  { value: '340+', label: 'Active Drivers' },
  { value: '98%', label: 'Safe Trips' },
  { value: '4.8 ★', label: 'Average Rating' }
];

export const featuredDrivers = [
  { name: 'Kasun Perera', vehicle: 'Sedan · Honda City', distance: '0.3 km', color: '#4f46e5', emoji: '👨‍🎓' },
  { name: 'Nimali Fernando', vehicle: 'Hatchback · Suzuki Swift', distance: '0.6 km', color: '#0ea5e9', emoji: '👩‍🎓' },
  { name: 'Dineth Rajapaksa', vehicle: 'Motorbike · Yamaha FZ', distance: '1.1 km', color: '#10b981', emoji: '👨‍🎓' },
  { name: 'Sahan Wickrama', vehicle: 'Van · Toyota KDH', distance: '1.5 km', color: '#f59e0b', emoji: '👩‍🎓' }
];

export const featureCards = [
  { title: 'Verified Students', description: 'All drivers are verified SLIIT students. Ride with people you know and trust.', icon: '🔒' },
  { title: 'Budget Friendly', description: 'Split costs with classmates and cut daily commute spending.', icon: '💸' },
  { title: 'Instant Matching', description: 'Find a ride in seconds with nearby verified drivers.', icon: '⚡' },
  { title: 'Eco-Friendly', description: 'Share rides and reduce the number of cars on the road.', icon: '🌿' }
];

export const rideMatches = [
  { driver: 'Kasun Perera', route: 'Kaduwela → SLIIT Malabe', time: '08:15 AM', price: 'Rs. 450', seats: 2, type: 'Sedan' },
  { driver: 'Nimali Fernando', route: 'Malabe Junction → SLIIT', time: '08:30 AM', price: 'Rs. 350', seats: 3, type: 'Hatchback' },
  { driver: 'Dineth Rajapaksa', route: 'Battaramulla → SLIIT', time: '09:00 AM', price: 'Rs. 300', seats: 1, type: 'Bike' },
  { driver: 'Sahan Wickrama', route: 'Athurugiriya → SLIIT', time: '08:45 AM', price: 'Rs. 500', seats: 4, type: 'Van' }
];

export const riderMetrics = [
  { value: '24', label: 'Total Trips', tone: 'blue' },
  { value: 'Rs. 12,450', label: 'Total Spent', tone: 'green' },
  { value: '184 km', label: 'Distance Traveled', tone: 'violet' },
  { value: '3', label: 'Active Bookings', tone: 'amber' }
];

export const riderBookings = [
  { title: 'Morning ride to campus', driver: 'Kasun Perera', status: 'On the way', time: '08:10 AM' },
  { title: 'Afternoon return ride', driver: 'Nimali Fernando', status: 'Confirmed', time: '04:30 PM' }
];

export const driverMetrics = [
  { value: '18', label: 'Completed Trips', tone: 'blue' },
  { value: 'Rs. 24,800', label: 'Total Earnings', tone: 'green' },
  { value: '4.9', label: 'Driver Rating', tone: 'violet' },
  { value: '6', label: 'Pending Requests', tone: 'amber' }
];

export const chatThreads = [
  { id: 'ride-101', name: 'Kasun Perera', preview: 'I will arrive near the library in 5 minutes.', unread: true },
  { id: 'ride-102', name: 'Nimali Fernando', preview: 'Please confirm the pickup point.', unread: false },
  { id: 'ride-103', name: 'Driver Support', preview: 'Your driver has marked the ride as complete.', unread: false }
];

export const adminSummary = [
  { value: '1,274', label: 'Registered Users' },
  { value: '341', label: 'Active Drivers' },
  { value: '2,981', label: 'Total Rides' },
  { value: '12', label: 'Flagged Issues' }
];

export const adminUsers = [
  { name: 'Kasun Perera', role: 'Driver', email: 'kasun@my.sliit.lk', status: 'Verified' },
  { name: 'Nimali Fernando', role: 'Rider', email: 'nimali@my.sliit.lk', status: 'Verified' },
  { name: 'Sahan Wickrama', role: 'Driver', email: 'sahan@my.sliit.lk', status: 'Pending' }
];

export const adminRides = [
  { rider: 'Ahan Wijesinghe', driver: 'Kasun Perera', status: 'Completed', fare: 'Rs. 450' },
  { rider: 'Dinuli Silva', driver: 'Nimali Fernando', status: 'Active', fare: 'Rs. 350' },
  { rider: 'Pasindu Jayasiri', driver: 'Sahan Wickrama', status: 'Cancelled', fare: 'Rs. 500' }
];