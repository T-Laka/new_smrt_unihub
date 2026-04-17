import PageHeader from '../components/PageHeader';
import { Link } from 'react-router-dom';
import { adminRides, adminSummary, adminUsers } from '../data/siteData';
import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

export default function AdminPage() {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbHealth, setDbHealth] = useState({
    isConnected: false,
    mongoState: 'unknown',
  });

  useEffect(() => {
    async function loadPendingEvents() {
      try {
        const data = await apiRequest('/api/admin/events/pending');
        setPendingEvents(data);
      } catch (err) {
        console.error('Error loading pending events:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPendingEvents();
  }, []);

  useEffect(() => {
    async function loadDbHealth() {
      try {
        const data = await apiRequest('/api/admin/db-health');
        setDbHealth(data);
      } catch (err) {
        console.error('Error loading DB health:', err);
      }
    }

    loadDbHealth();
  }, []);

  async function handleApprove(eventId) {
    try {
      await apiRequest(`/api/admin/events/${eventId}/approve`, {
        method: 'POST',
      });
      setPendingEvents((previous) => previous.filter((event) => event._id !== eventId));
    } catch (err) {
      console.error('Error approving event:', err);
    }
  }

  async function handleReject(eventId) {
    try {
      await apiRequest(`/api/admin/events/${eventId}/reject`, {
        method: 'POST',
      });
      setPendingEvents((previous) => previous.filter((event) => event._id !== eventId));
    } catch (err) {
      console.error('Error rejecting event:', err);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Admin Panel"
        title="Dashboard"
        subtitle="Monitor users, drivers, and ride activity across the platform."
      />

      <section className="section-block">
        <div className="container admin-grid">
          {adminSummary.map((stat) => (
            <article key={stat.label} className="surface stat-card admin-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block muted-section">
        <div className="container">
          <article className="surface" style={{ marginBottom: '1rem' }}>
            <h2>Database Status</h2>
            <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
              MongoDB state: <strong>{dbHealth.mongoState}</strong>
            </p>
            <p style={{ color: dbHealth.isConnected ? '#22c55e' : '#ef4444' }}>
              {dbHealth.isConnected ? 'Database is connected' : 'Database is not connected'}
            </p>
          </article>

          <article className="surface">
            <h2>Study Area Management</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              Manage student seat bookings, check arrivals, and handle fines.
            </p>
            <Link to="/admin-study-area" className="button button-primary">
              Go to Study Area Admin
            </Link>
          </article>

          <article className="surface" style={{ marginTop: '1rem' }}>
            <h2>Canteen Management</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              Add food items, create offers, and manage availability shown to users.
            </p>
            <Link to="/admin-canteen" className="button button-primary">
              Open Canteen Admin
            </Link>
          </article>

          <article className="surface" style={{ marginTop: '1rem' }}>
            <h2>Event Administration</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              Manage all event records and update event statuses.
            </p>
            <Link to="/admin-events" className="button button-primary">
              Open Event Admin
            </Link>
          </article>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <article className="surface">
            <h2>Event Management</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              Review and approve pending events.
            </p>
            {isLoading ? (
              <p>Loading pending events...</p>
            ) : pendingEvents.length === 0 ? (
              <p>No pending events to review.</p>
            ) : (
              <div className="card-stack">
                {pendingEvents.map((event) => (
                  <div key={event._id} className="surface nested-card admin-row">
                    <div>
                      <strong>{event.title}</strong>
                      <p>{event.location} • {new Date(event.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <button
                        className="button button-small button-primary"
                        onClick={() => handleApprove(event._id)}
                      >
                        Approve
                      </button>
                      <button
                        className="button button-small button-secondary"
                        onClick={() => handleReject(event._id)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '1rem' }}>
              <Link to="/admin-events" className="button button-secondary button-small">
                Manage All Events
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section-block">
        <div className="container admin-grid">
          {adminSummary.map((stat) => (
            <article key={stat.label} className="surface stat-card admin-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block muted-section">
        <div className="container admin-panels">
          <article className="surface dashboard-panel">
            <h2>User Management</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((user) => (
                    <tr key={user.email}>
                      <td>{user.name}</td>
                      <td>{user.role}</td>
                      <td>{user.email}</td>
                      <td>{user.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="surface dashboard-panel">
            <h2>Ride Management</h2>
            <div className="card-stack">
              {adminRides.map((ride) => (
                <div key={`${ride.rider}-${ride.driver}`} className="surface nested-card admin-row">
                  <div>
                    <strong>{ride.rider}</strong>
                    <p>{ride.driver}</p>
                  </div>
                  <div>
                    <span className="pill">{ride.status}</span>
                    <strong>{ride.fare}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}