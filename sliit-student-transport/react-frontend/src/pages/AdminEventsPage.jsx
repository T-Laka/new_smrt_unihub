import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { deleteStall, getAdminStalls, updateStallStatus } from '../lib/eventCommunityApi';

const statusOptions = ['all', 'pending', 'approved', 'rejected', 'completed', 'cancelled'];
const stallStatusOptions = ['all', 'pending', 'approved', 'rejected'];

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stallStatusFilter, setStallStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isStallLoading, setIsStallLoading] = useState(true);
  const [error, setError] = useState('');

  const summary = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        acc.total += 1;
        acc[event.status] = (acc[event.status] || 0) + 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0, cancelled: 0 }
    );
  }, [events]);

  const pendingEvents = useMemo(
    () => events.filter((event) => event.status === 'pending'),
    [events]
  );

  const stallSummary = useMemo(() => {
    return stalls.reduce(
      (acc, stall) => {
        acc.total += 1;
        acc[stall.status] = (acc[stall.status] || 0) + 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [stalls]);

  const pendingStalls = useMemo(
    () => stalls.filter((stall) => stall.status === 'pending'),
    [stalls]
  );

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError('');
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const data = await apiRequest(`/api/admin/events${query}`);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStalls = async () => {
    try {
      setIsStallLoading(true);
      setError('');
      const data = await getAdminStalls(stallStatusFilter);
      setStalls(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load stall requests');
      setStalls([]);
    } finally {
      setIsStallLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [statusFilter]);

  useEffect(() => {
    loadStalls();
  }, [stallStatusFilter]);

  const changeStatus = async (eventId, status) => {
    try {
      await apiRequest(`/api/admin/events/${eventId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event permanently?')) return;

    try {
      await apiRequest(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });
      await loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    }
  };

  const changeStallStatus = async (stallId, status) => {
    try {
      await updateStallStatus(stallId, status);
      await loadStalls();
    } catch (err) {
      setError(err.message || 'Failed to update stall status');
    }
  };

  const removeStall = async (stallId) => {
    if (!window.confirm('Delete this stall request permanently?')) return;

    try {
      await deleteStall(stallId);
      await loadStalls();
    } catch (err) {
      setError(err.message || 'Failed to delete stall request');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin Events"
        title="Event Operations Dashboard"
        subtitle="Control approvals, moderation, and completion flow for all submitted events."
      />

      <section className="section-block">
        <div className="container adminx-grid">
          <article className="surface adminx-hero">
            <div>
              <p className="adminx-kicker">Moderation Snapshot</p>
              <h2>Real-time Event Control</h2>
              <p>Track pending queue, quickly moderate submissions, and keep the campus event feed clean.</p>
            </div>
            <div className="adminx-chip-grid">
              <div className="adminx-chip"><strong>{summary.total}</strong><span>Total</span></div>
              <div className="adminx-chip"><strong>{summary.pending}</strong><span>Pending</span></div>
              <div className="adminx-chip"><strong>{summary.approved}</strong><span>Approved</span></div>
              <div className="adminx-chip"><strong>{summary.rejected}</strong><span>Rejected</span></div>
              <div className="adminx-chip"><strong>{summary.completed}</strong><span>Completed</span></div>
              <div className="adminx-chip"><strong>{summary.cancelled}</strong><span>Cancelled</span></div>
            </div>
          </article>

          <article className="surface adminx-list-card">
            <div className="adminx-list-head">
              <h2>Pending Review Queue</h2>
              <p>Prioritize approvals before event start dates.</p>
            </div>
            {pendingEvents.length === 0 ? (
              <p>No pending events right now.</p>
            ) : (
              <div className="adminx-cards-grid">
                {pendingEvents.map((event) => (
                  <article key={event._id} className="adminx-offer-card">
                    <div className="adminx-offer-top">
                      <span>🕒</span>
                      <span className="adminx-stock-pill out">Pending</span>
                    </div>
                    <h3>{event.title}</h3>
                    <p>{event.location || 'Campus'}</p>
                    <small>{new Date(event.startDate).toLocaleString()}</small>
                    <small>{new Date(event.endDate).toLocaleString()}</small>
                    <div className="adminx-action-row compact">
                      <button
                        type="button"
                        className="button button-small button-primary"
                        onClick={() => changeStatus(event._id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button button-small button-secondary"
                        onClick={() => changeStatus(event._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="surface adminx-list-card">
            <div className="adminx-list-head">
              <h2>Pending Stall Requests</h2>
              <p>Fundraising and event stalls waiting for moderation.</p>
            </div>

            <div className="adminx-chip-grid">
              <div className="adminx-chip"><strong>{stallSummary.total}</strong><span>Total Stalls</span></div>
              <div className="adminx-chip"><strong>{stallSummary.pending}</strong><span>Pending</span></div>
              <div className="adminx-chip"><strong>{stallSummary.approved}</strong><span>Approved</span></div>
              <div className="adminx-chip"><strong>{stallSummary.rejected}</strong><span>Rejected</span></div>
            </div>

            {pendingStalls.length === 0 ? (
              <p>No pending stall requests.</p>
            ) : (
              <div className="adminx-cards-grid">
                {pendingStalls.map((stall) => (
                  <article key={stall._id} className="adminx-offer-card">
                    <div className="adminx-offer-top">
                      <span>🏪</span>
                      <span className="adminx-stock-pill out">Pending</span>
                    </div>
                    <h3>{stall.stallName}</h3>
                    <p>{stall.eventId?.title || 'Unknown Event'}</p>
                    <small>Faculty: {stall.facultyName || stall.ownerName || 'N/A'}</small>
                    {stall.stallDate ? <small>Date: {new Date(stall.stallDate).toLocaleDateString()}</small> : null}
                    <small>{stall.category || 'general'} {stall.fundingGoal ? `· Goal LKR ${stall.fundingGoal}` : ''}</small>
                    <div className="adminx-action-row compact">
                      <button
                        type="button"
                        className="button button-small button-primary"
                        onClick={() => changeStallStatus(stall._id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button button-small button-secondary"
                        onClick={() => changeStallStatus(stall._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="surface adminx-list-card">
            <div className="adminx-action-row" style={{ justifyContent: 'space-between' }}>
              <label>
                <span>Filter by Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status.toUpperCase()}</option>
                  ))}
                </select>
              </label>

              <button type="button" className="button button-secondary" onClick={loadEvents}>
                Refresh
              </button>
            </div>

            {error ? <p className="text-danger">{error}</p> : null}

            {isLoading ? (
              <p>Loading events...</p>
            ) : events.length === 0 ? (
              <p>No events found for selected filter.</p>
            ) : (
              <div className="adminx-cards-grid">
                {events.map((event) => (
                  <article key={event._id} className="adminx-offer-card">
                    <div className="adminx-offer-top">
                      <span>📅</span>
                      <span className={`adminx-stock-pill ${event.status === 'approved' || event.status === 'completed' ? 'in' : 'out'}`}>
                        {event.status}
                      </span>
                    </div>

                    <h3>{event.title}</h3>
                    <p>{event.description || 'No description provided.'}</p>
                    <small>
                      {new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}
                    </small>
                    <small>{event.location || 'Campus'}</small>

                    <div className="adminx-action-row compact">
                      <button
                        type="button"
                        className="button button-small button-primary"
                        onClick={() => changeStatus(event._id, 'approved')}
                        disabled={event.status === 'approved'}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button button-small button-secondary"
                        onClick={() => changeStatus(event._id, 'rejected')}
                        disabled={event.status === 'rejected'}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="button button-small"
                        onClick={() => changeStatus(event._id, 'completed')}
                        disabled={event.status === 'completed'}
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        className="button button-small"
                        onClick={() => deleteEvent(event._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="surface adminx-list-card">
            <div className="adminx-action-row" style={{ justifyContent: 'space-between' }}>
              <label>
                <span>Stall Status Filter</span>
                <select value={stallStatusFilter} onChange={(event) => setStallStatusFilter(event.target.value)}>
                  {stallStatusOptions.map((status) => (
                    <option key={status} value={status}>{status.toUpperCase()}</option>
                  ))}
                </select>
              </label>

              <button type="button" className="button button-secondary" onClick={loadStalls}>
                Refresh Stalls
              </button>
            </div>

            {isStallLoading ? (
              <p>Loading stall requests...</p>
            ) : stalls.length === 0 ? (
              <p>No stall requests found for selected filter.</p>
            ) : (
              <div className="adminx-cards-grid">
                {stalls.map((stall) => (
                  <article key={stall._id} className="adminx-offer-card">
                    <div className="adminx-offer-top">
                      <span>🏪</span>
                      <span className={`adminx-stock-pill ${stall.status === 'approved' ? 'in' : 'out'}`}>
                        {stall.status}
                      </span>
                    </div>

                    {stall.image ? <img src={stall.image} alt={stall.stallName} /> : null}
                    <h3>{stall.stallName}</h3>
                    <p>{stall.description || stall.itemsSummary || 'No description available.'}</p>
                    <small>{stall.eventId?.title || 'Unknown Event'}</small>
                    <small>Faculty: {stall.facultyName || stall.ownerName || 'N/A'}</small>
                    {stall.stallDate ? <small>Stall Date: {new Date(stall.stallDate).toLocaleDateString()}</small> : null}
                    {stall.itemsSummary ? <small>Items: {stall.itemsSummary}</small> : null}
                    {stall.fundingGoal ? <small>Funding Goal: LKR {stall.fundingGoal}</small> : null}

                    <div className="adminx-action-row compact">
                      <button
                        type="button"
                        className="button button-small button-primary"
                        onClick={() => changeStallStatus(stall._id, 'approved')}
                        disabled={stall.status === 'approved'}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button button-small button-secondary"
                        onClick={() => changeStallStatus(stall._id, 'rejected')}
                        disabled={stall.status === 'rejected'}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="button button-small"
                        onClick={() => removeStall(stall._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </>
  );
}
