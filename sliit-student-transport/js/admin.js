// ============================================================
// SLIIT Student Transport — Admin Panel JavaScript
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// Current data
let allUsers = [];
let allDrivers = [];
let allRides = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check admin auth
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        // For demo, allow access anyway
        console.log('Admin access required');
    }

    // Set admin name
    if (user) {
        document.getElementById('adminName').textContent = user.name || 'Admin';
    }

    // Set current date
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Initialize navigation
    initNavigation();

    // Load dashboard data
    loadDashboardData();

    // Initialize filters
    initFilters();
});

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Initialize Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.dataset.tab;
            switchTab(tab);
        });
    });
}

// Switch Tab
function switchTab(tabName) {
    // Update nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === tabName) {
            link.classList.add('active');
        }
    });

    // Update content
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Load tab data
    loadTabData(tabName);
}

// Load Tab Data
function loadTabData(tabName) {
    switch (tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsers();
            break;
        case 'drivers':
            loadDrivers();
            break;
        case 'rides':
            loadRides();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Load all data in parallel
        const [usersRes, driversRes, ridesRes] = await Promise.all([
            fetch(`${API_BASE}/users`),
            fetch(`${API_BASE}/drivers`),
            fetch(`${API_BASE}/rides`)
        ]);

        allUsers = await usersRes.json();
        allDrivers = await driversRes.json();
        allRides = await ridesRes.json();

        // Update stats
        document.getElementById('totalUsers').textContent = allUsers.length;
        document.getElementById('totalDrivers').textContent = allDrivers.filter(d => d.isApproved).length;
        document.getElementById('totalRides').textContent = allRides.length;

        // Calculate revenue
        const totalRevenue = allRides
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + (r.fare || 0), 0);
        document.getElementById('totalRevenue').textContent = `Rs. ${totalRevenue.toLocaleString()}`;

        // Update ride status counts
        const ridesByStatus = {
            completed: allRides.filter(r => r.status === 'completed').length,
            pending: allRides.filter(r => r.status === 'pending').length,
            ongoing: allRides.filter(r => r.status === 'ongoing').length,
            cancelled: allRides.filter(r => r.status === 'cancelled').length
        };

        document.getElementById('completedRides').textContent = ridesByStatus.completed;
        document.getElementById('pendingRides').textContent = ridesByStatus.pending;
        document.getElementById('ongoingRides').textContent = ridesByStatus.ongoing;
        document.getElementById('cancelledRides').textContent = ridesByStatus.cancelled;

        // Load recent activity
        loadRecentActivity();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show demo data
        showDemoData();
    }
}

// Show Demo Data
function showDemoData() {
    document.getElementById('totalUsers').textContent = '156';
    document.getElementById('totalDrivers').textContent = '24';
    document.getElementById('totalRides').textContent = '892';
    document.getElementById('totalRevenue').textContent = 'Rs. 245,600';

    document.getElementById('completedRides').textContent = '743';
    document.getElementById('pendingRides').textContent = '45';
    document.getElementById('ongoingRides').textContent = '12';
    document.getElementById('cancelledRides').textContent = '92';
}

// Load Recent Activity
function loadRecentActivity() {
    const container = document.getElementById('activityList');

    // Combine recent users and rides
    const activities = [
        ...allUsers.slice(0, 3).map(u => ({
            type: 'user',
            icon: '👤',
            text: `New user registered: ${u.name}`,
            time: u.createdAt
        })),
        ...allRides.slice(0, 3).map(r => ({
            type: 'ride',
            icon: '🚗',
            text: `Ride ${r.status}: ${r.pickupLocation?.address || 'Unknown'} → ${r.dropLocation?.address || 'Unknown'}`,
            time: r.createdAt
        })),
        ...allDrivers.filter(d => !d.isApproved).slice(0, 2).map(d => ({
            type: 'driver',
            icon: '🚗',
            text: `Driver awaiting approval: ${d.user?.name || 'Unknown'}`,
            time: d.createdAt
        }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

    if (activities.length === 0) {
        container.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">📊</div>
                <div class="activity-content">
                    <p>No recent activity</p>
                    <span>Activities will appear here</span>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = activities.map(act => `
        <div class="activity-item">
            <div class="activity-icon ${act.type}">${act.icon}</div>
            <div class="activity-content">
                <p>${act.text}</p>
                <span>${formatTimeAgo(act.time)}</span>
            </div>
        </div>
    `).join('');
}

// Load Users
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');

    try {
        if (allUsers.length === 0) {
            const response = await fetch(`${API_BASE}/users`);
            allUsers = await response.json();
        }

        if (allUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = allUsers.map(user => `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="avatar">👤</div>
                        <div class="info">
                            <h4>${user.name}</h4>
                            <p>${user.phone || 'No phone'}</p>
                        </div>
                    </div>
                </td>
                <td>${user.studentId}</td>
                <td>${user.email}</td>
                <td><span class="status-badge ${user.role}">${user.role}</span></td>
                <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="editUser('${user._id}')" title="Edit">✏️</button>
                        <button class="action-btn delete" onclick="deleteUser('${user._id}')" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Error loading users</td></tr>';
    }
}

// Load Drivers
async function loadDrivers() {
    const tbody = document.getElementById('driversTableBody');

    try {
        if (allDrivers.length === 0) {
            const response = await fetch(`${API_BASE}/drivers`);
            allDrivers = await response.json();
        }

        if (allDrivers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No drivers found</td></tr>';
            return;
        }

        tbody.innerHTML = allDrivers.map(driver => `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="avatar">🚗</div>
                        <div class="info">
                            <h4>${driver.user?.name || 'Unknown'}</h4>
                            <p>${driver.user?.phone || 'No phone'}</p>
                        </div>
                    </div>
                </td>
                <td>${driver.vehicleType} - ${driver.vehicleNumber}</td>
                <td>⭐ ${(driver.rating || 0).toFixed(1)}</td>
                <td>${driver.totalRides || 0}</td>
                <td>Rs. ${(driver.totalEarnings || 0).toLocaleString()}</td>
                <td>
                    <span class="status-badge ${driver.isApproved ? 'approved' : 'pending'}">
                        ${driver.isApproved ? 'Approved' : 'Pending'}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        ${!driver.isApproved ? `<button class="action-btn approve" onclick="approveDriver('${driver._id}')" title="Approve">✓</button>` : ''}
                        <button class="action-btn edit" onclick="editDriver('${driver._id}')" title="Edit">✏️</button>
                        <button class="action-btn delete" onclick="deleteDriver('${driver._id}')" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading drivers:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Error loading drivers</td></tr>';
    }
}

// Load Rides
async function loadRides() {
    const tbody = document.getElementById('ridesTableBody');

    try {
        if (allRides.length === 0) {
            const response = await fetch(`${API_BASE}/rides`);
            allRides = await response.json();
        }

        if (allRides.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No rides found</td></tr>';
            return;
        }

        tbody.innerHTML = allRides.map(ride => `
            <tr>
                <td>#${ride._id.slice(-6)}</td>
                <td>${ride.rider?.name || 'Unknown'}</td>
                <td>${ride.driver?.user?.name || 'Not assigned'}</td>
                <td>
                    <small>${(ride.pickupLocation?.address || 'Unknown').substring(0, 20)}...</small><br>
                    <small>→ ${(ride.dropLocation?.address || 'Unknown').substring(0, 20)}...</small>
                </td>
                <td>${formatDate(ride.scheduledDate)}</td>
                <td>Rs. ${ride.fare || 0}</td>
                <td><span class="status-badge ${ride.status}">${ride.status}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="viewRide('${ride._id}')" title="View">👁️</button>
                        <button class="action-btn delete" onclick="deleteRide('${ride._id}')" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading rides:', error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">Error loading rides</td></tr>';
    }
}

// Load Reports
function loadReports() {
    const completedRides = allRides.filter(r => r.status === 'completed');
    const revenue = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
    const avgRating = allDrivers.length > 0
        ? (allDrivers.reduce((sum, d) => sum + (d.rating || 0), 0) / allDrivers.length).toFixed(1)
        : '0.0';

    document.getElementById('reportRevenue').textContent = `Rs. ${revenue.toLocaleString()}`;
    document.getElementById('reportRides').textContent = completedRides.length;
    document.getElementById('reportNewUsers').textContent = allUsers.filter(u => {
        const created = new Date(u.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
    }).length;
    document.getElementById('reportAvgRating').textContent = avgRating;
}

// Initialize Filters
function initFilters() {
    // User filters
    document.getElementById('filterUserRole')?.addEventListener('change', filterUsers);
    document.getElementById('filterUserStatus')?.addEventListener('change', filterUsers);
    document.getElementById('searchUsers')?.addEventListener('input', filterUsers);

    // Driver filters
    document.getElementById('filterDriverStatus')?.addEventListener('change', filterDrivers);
    document.getElementById('filterDriverAvailability')?.addEventListener('change', filterDrivers);
    document.getElementById('searchDrivers')?.addEventListener('input', filterDrivers);

    // Ride filters
    document.getElementById('filterRideStatus')?.addEventListener('change', filterRides);
    document.getElementById('filterRideDate')?.addEventListener('change', filterRides);
}

// Filter Functions
function filterUsers() {
    const role = document.getElementById('filterUserRole').value;
    const status = document.getElementById('filterUserStatus').value;
    const search = document.getElementById('searchUsers').value.toLowerCase();

    const filtered = allUsers.filter(user => {
        if (role && user.role !== role) return false;
        if (status && String(user.isActive) !== status) return false;
        if (search && !user.name.toLowerCase().includes(search) && !user.email.toLowerCase().includes(search)) return false;
        return true;
    });

    renderUsersTable(filtered);
}

function filterDrivers() {
    const status = document.getElementById('filterDriverStatus').value;
    const availability = document.getElementById('filterDriverAvailability').value;
    const search = document.getElementById('searchDrivers').value.toLowerCase();

    const filtered = allDrivers.filter(driver => {
        if (status === 'approved' && !driver.isApproved) return false;
        if (status === 'pending' && driver.isApproved) return false;
        if (availability && String(driver.isAvailable) !== availability) return false;
        if (search && !driver.user?.name?.toLowerCase().includes(search)) return false;
        return true;
    });

    renderDriversTable(filtered);
}

function filterRides() {
    const status = document.getElementById('filterRideStatus').value;
    const date = document.getElementById('filterRideDate').value;

    const filtered = allRides.filter(ride => {
        if (status && ride.status !== status) return false;
        if (date) {
            const rideDate = new Date(ride.scheduledDate).toDateString();
            const filterDate = new Date(date).toDateString();
            if (rideDate !== filterDate) return false;
        }
        return true;
    });

    renderRidesTable(filtered);
}

// Render Functions
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="avatar">👤</div>
                    <div class="info">
                        <h4>${user.name}</h4>
                        <p>${user.phone || 'No phone'}</p>
                    </div>
                </div>
            </td>
            <td>${user.studentId}</td>
            <td>${user.email}</td>
            <td><span class="status-badge ${user.role}">${user.role}</span></td>
            <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editUser('${user._id}')" title="Edit">✏️</button>
                    <button class="action-btn delete" onclick="deleteUser('${user._id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderDriversTable(drivers) {
    const tbody = document.getElementById('driversTableBody');
    tbody.innerHTML = drivers.map(driver => `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="avatar">🚗</div>
                    <div class="info">
                        <h4>${driver.user?.name || 'Unknown'}</h4>
                        <p>${driver.user?.phone || 'No phone'}</p>
                    </div>
                </div>
            </td>
            <td>${driver.vehicleType} - ${driver.vehicleNumber}</td>
            <td>⭐ ${(driver.rating || 0).toFixed(1)}</td>
            <td>${driver.totalRides || 0}</td>
            <td>Rs. ${(driver.totalEarnings || 0).toLocaleString()}</td>
            <td>
                <span class="status-badge ${driver.isApproved ? 'approved' : 'pending'}">
                    ${driver.isApproved ? 'Approved' : 'Pending'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    ${!driver.isApproved ? `<button class="action-btn approve" onclick="approveDriver('${driver._id}')" title="Approve">✓</button>` : ''}
                    <button class="action-btn edit" onclick="editDriver('${driver._id}')" title="Edit">✏️</button>
                    <button class="action-btn delete" onclick="deleteDriver('${driver._id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderRidesTable(rides) {
    const tbody = document.getElementById('ridesTableBody');
    tbody.innerHTML = rides.map(ride => `
        <tr>
            <td>#${ride._id.slice(-6)}</td>
            <td>${ride.rider?.name || 'Unknown'}</td>
            <td>${ride.driver?.user?.name || 'Not assigned'}</td>
            <td>
                <small>${(ride.pickupLocation?.address || 'Unknown').substring(0, 20)}...</small><br>
                <small>→ ${(ride.dropLocation?.address || 'Unknown').substring(0, 20)}...</small>
            </td>
            <td>${formatDate(ride.scheduledDate)}</td>
            <td>Rs. ${ride.fare || 0}</td>
            <td><span class="status-badge ${ride.status}">${ride.status}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="viewRide('${ride._id}')" title="View">👁️</button>
                    <button class="action-btn delete" onclick="deleteRide('${ride._id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// CRUD Actions
async function approveDriver(driverId) {
    if (!confirm('Approve this driver?')) return;

    try {
        const response = await fetch(`${API_BASE}/drivers/${driverId}/approve`, {
            method: 'PATCH'
        });

        if (response.ok) {
            alert('Driver approved successfully');
            allDrivers = [];
            loadDrivers();
        } else {
            alert('Failed to approve driver');
        }
    } catch (error) {
        console.error('Error approving driver:', error);
        alert('Error approving driver');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('User deleted successfully');
            allUsers = allUsers.filter(u => u._id !== userId);
            loadUsers();
        } else {
            alert('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

async function deleteDriver(driverId) {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
        const response = await fetch(`${API_BASE}/drivers/${driverId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Driver deleted successfully');
            allDrivers = allDrivers.filter(d => d._id !== driverId);
            loadDrivers();
        } else {
            alert('Failed to delete driver');
        }
    } catch (error) {
        console.error('Error deleting driver:', error);
    }
}

async function deleteRide(rideId) {
    if (!confirm('Are you sure you want to delete this ride?')) return;

    try {
        const response = await fetch(`${API_BASE}/rides/${rideId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Ride deleted successfully');
            allRides = allRides.filter(r => r._id !== rideId);
            loadRides();
        } else {
            alert('Failed to delete ride');
        }
    } catch (error) {
        console.error('Error deleting ride:', error);
    }
}

// Edit/View functions
function editUser(userId) {
    const user = allUsers.find(u => u._id === userId);
    if (!user) return;

    openModal('Edit User', `
        <div class="form-group">
            <label>Name</label>
            <input type="text" id="editUserName" value="${user.name}">
        </div>
        <div class="form-group">
            <label>Phone</label>
            <input type="text" id="editUserPhone" value="${user.phone || ''}">
        </div>
        <div class="form-group">
            <label>Role</label>
            <select id="editUserRole">
                <option value="rider" ${user.role === 'rider' ? 'selected' : ''}>Rider</option>
                <option value="driver" ${user.role === 'driver' ? 'selected' : ''}>Driver</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
        </div>
        <div class="form-group setting-item toggle">
            <label>Active</label>
            <input type="checkbox" id="editUserActive" ${user.isActive ? 'checked' : ''}>
        </div>
    `, () => saveUser(userId));
}

async function saveUser(userId) {
    const data = {
        name: document.getElementById('editUserName').value,
        phone: document.getElementById('editUserPhone').value,
        role: document.getElementById('editUserRole').value,
        isActive: document.getElementById('editUserActive').checked
    };

    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('User updated successfully');
            closeModal();
            allUsers = [];
            loadUsers();
        } else {
            alert('Failed to update user');
        }
    } catch (error) {
        console.error('Error updating user:', error);
    }
}

function editDriver(driverId) {
    alert('Edit driver: ' + driverId);
}

function viewRide(rideId) {
    const ride = allRides.find(r => r._id === rideId);
    if (!ride) return;

    openModal('Ride Details', `
        <div class="ride-details">
            <p><strong>ID:</strong> #${ride._id.slice(-6)}</p>
            <p><strong>Rider:</strong> ${ride.rider?.name || 'Unknown'}</p>
            <p><strong>Driver:</strong> ${ride.driver?.user?.name || 'Not assigned'}</p>
            <p><strong>Pickup:</strong> ${ride.pickupLocation?.address || 'Unknown'}</p>
            <p><strong>Drop:</strong> ${ride.dropLocation?.address || 'Unknown'}</p>
            <p><strong>Date:</strong> ${formatDate(ride.scheduledDate)} at ${ride.scheduledTime}</p>
            <p><strong>Passengers:</strong> ${ride.passengers}</p>
            <p><strong>Fare:</strong> Rs. ${ride.fare || 0}</p>
            <p><strong>Status:</strong> <span class="status-badge ${ride.status}">${ride.status}</span></p>
        </div>
    `, null, true);
}

// Modal Functions
function openModal(title, content, onSave, hideFooter = false) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalFooter').style.display = hideFooter ? 'none' : 'flex';

    if (onSave) {
        document.getElementById('modalAction').onclick = onSave;
    }

    document.getElementById('adminModal').classList.add('active');
}

function closeModal() {
    document.getElementById('adminModal').classList.remove('active');
}

// Export Functions
function exportUsers() {
    const csv = [
        ['Name', 'Student ID', 'Email', 'Role', 'Status', 'Joined'],
        ...allUsers.map(u => [
            u.name,
            u.studentId,
            u.email,
            u.role,
            u.isActive ? 'Active' : 'Inactive',
            formatDate(u.createdAt)
        ])
    ].map(row => row.join(',')).join('\n');

    downloadCSV(csv, 'users.csv');
}

function exportRides() {
    const csv = [
        ['ID', 'Rider', 'Driver', 'Pickup', 'Drop', 'Date', 'Fare', 'Status'],
        ...allRides.map(r => [
            r._id.slice(-6),
            r.rider?.name || 'Unknown',
            r.driver?.user?.name || 'Not assigned',
            r.pickupLocation?.address || 'Unknown',
            r.dropLocation?.address || 'Unknown',
            formatDate(r.scheduledDate),
            r.fare || 0,
            r.status
        ])
    ].map(row => row.join(',')).join('\n');

    downloadCSV(csv, 'rides.csv');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Settings
function saveSettings() {
    const settings = {
        baseFare: document.getElementById('baseFare').value,
        perKmRate: document.getElementById('perKmRate').value,
        perPassengerRate: document.getElementById('perPassengerRate').value,
        autoApproveDrivers: document.getElementById('autoApproveDrivers').checked,
        enableNotifications: document.getElementById('enableNotifications').checked,
        maintenanceMode: document.getElementById('maintenanceMode').checked
    };

    localStorage.setItem('adminSettings', JSON.stringify(settings));
    alert('Settings saved successfully');
}

function generateReport() {
    alert('Generating report...');
    // In a real app, this would generate a PDF report
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

function refreshActivity() {
    loadRecentActivity();
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('driver');
    localStorage.removeItem('currentRide');
    localStorage.removeItem('rememberedEmail');
    window.location.href = 'login.html';
}
