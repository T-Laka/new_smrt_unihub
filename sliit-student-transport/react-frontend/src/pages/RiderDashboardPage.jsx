import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { riderBookings, riderMetrics } from '../data/siteData';

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'book', label: 'Book a Ride', icon: '🚗' },
  { id: 'bookings', label: 'My Bookings', icon: '📋' },
  { id: 'history', label: 'Ride History', icon: '📜' },
  { id: 'favorites', label: 'Favorite Drivers', icon: '⭐' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

export default function RiderDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  function renderTab() {
    if (activeTab === 'book') {
      return (
        <div className="surface dashboard-panel">
          <h2>Book a Ride</h2>
          <div className="field-grid two-col">
            <label>
              Pickup Location
              <input type="text" placeholder="Enter pickup location" />
            </label>
            <label>
              Drop Location
              <input type="text" placeholder="Enter destination" />
            </label>
          </div>
          <div className="field-grid two-col">
            <label>
              Date
              <input type="date" />
            </label>
            <label>
              Time
              <input type="time" />
            </label>
          </div>
          <button type="button" className="button button-primary">Search for Drivers</button>
        </div>
      );
    }

    if (activeTab === 'bookings') {
      return (
        <div className="surface dashboard-panel">
          <h2>Active Bookings</h2>
          <div className="card-stack">
            {riderBookings.map((booking) => (
              <article key={booking.title} className="surface nested-card">
                <strong>{booking.title}</strong>
                <p>{booking.driver}</p>
                <span className="pill success">{booking.status}</span>
                <span className="muted">{booking.time}</span>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="surface dashboard-panel">
          <h2>Ride History</h2>
          <p>Track your completed rides, past fares, and travel history from here.</p>
        </div>
      );
    }

    if (activeTab === 'favorites') {
      return (
        <div className="surface dashboard-panel">
          <h2>Favorite Drivers</h2>
          <p>Save preferred drivers so they are easier to find next time.</p>
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div className="surface dashboard-panel">
          <h2>Settings</h2>
          <p>Update your profile details, ride preferences, and notification settings.</p>
        </div>
      );
    }

    return (
      <div className="dashboard-overview-grid">
        <div className="stats-grid compact">
          {riderMetrics.map((metric) => (
            <article key={metric.label} className={`surface stat-card tone-${metric.tone}`}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>

        <div className="surface dashboard-panel">
          <h2>Active Bookings</h2>
          <div className="card-stack">
            {riderBookings.map((booking) => (
              <article key={booking.title} className="surface nested-card">
                <strong>{booking.title}</strong>
                <p>{booking.driver}</p>
                <span className="pill success">{booking.status}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="surface dashboard-panel">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <button type="button" className="button button-secondary">Book Ride</button>
            <button type="button" className="button button-secondary">My Bookings</button>
            <button type="button" className="button button-secondary">Ride History</button>
            <button type="button" className="button button-secondary">Favorites</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Rider Dashboard"
        title="Welcome back"
        subtitle="Manage bookings, review ride history, and find your next trip."
      />

      <section className="section-block">
        <div className="container dashboard-shell">
          <aside className="surface dashboard-sidebar">
            <div className="sidebar-profile">
              <div className="avatar-badge">👨‍🎓</div>
              <h3>Rider Name</h3>
              <p>SLIIT Student</p>
            </div>
            <nav className="sidebar-nav">
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="dashboard-content">{renderTab()}</div>
        </div>
      </section>
    </>
  );
}