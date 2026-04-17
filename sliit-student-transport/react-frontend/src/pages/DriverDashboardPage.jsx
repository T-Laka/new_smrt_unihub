import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { driverMetrics, rideMatches } from '../data/siteData';

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'requests', label: 'Ride Requests', icon: '📬' },
  { id: 'history', label: 'Ride History', icon: '📜' },
  { id: 'earnings', label: 'Earnings', icon: '💰' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

export default function DriverDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  function renderTab() {
    if (activeTab === 'requests') {
      return (
        <div className="surface dashboard-panel">
          <h2>Ride Requests</h2>
          <div className="card-stack">
            {rideMatches.slice(0, 3).map((ride) => (
              <article key={`${ride.driver}-${ride.time}`} className="surface nested-card">
                <strong>{ride.route}</strong>
                <p>{ride.time} · {ride.price}</p>
                <button type="button" className="button button-primary button-small">Accept Request</button>
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
          <p>Review past trips, cancellations, and completed rides in one place.</p>
        </div>
      );
    }

    if (activeTab === 'earnings') {
      return (
        <div className="surface dashboard-panel">
          <h2>Earnings</h2>
          <p>Track how much you have earned from completed rides.</p>
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div className="surface dashboard-panel">
          <h2>Settings</h2>
          <p>Update your driver profile, vehicle information, and availability.</p>
        </div>
      );
    }

    return (
      <div className="dashboard-overview-grid">
        <div className="stats-grid compact">
          {driverMetrics.map((metric) => (
            <article key={metric.label} className={`surface stat-card tone-${metric.tone}`}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>

        <div className="surface dashboard-panel">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <button type="button" className="button button-secondary">Set Availability</button>
            <button type="button" className="button button-secondary">Update Location</button>
            <button type="button" className="button button-secondary">View Requests</button>
            <button type="button" className="button button-secondary">Earnings</button>
          </div>
        </div>

        <div className="surface dashboard-panel">
          <h2>Recent Ride Requests</h2>
          <div className="card-stack">
            {rideMatches.slice(0, 2).map((ride) => (
              <article key={`${ride.driver}-${ride.time}`} className="surface nested-card">
                <strong>{ride.route}</strong>
                <p>{ride.time} · {ride.price}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Driver Dashboard"
        title="Welcome back"
        subtitle="Manage ride requests, earnings, and your driving schedule."
      />

      <section className="section-block">
        <div className="container dashboard-shell">
          <aside className="surface dashboard-sidebar">
            <div className="sidebar-profile">
              <div className="avatar-badge">🚘</div>
              <h3>Driver Name</h3>
              <p>Verified Driver</p>
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