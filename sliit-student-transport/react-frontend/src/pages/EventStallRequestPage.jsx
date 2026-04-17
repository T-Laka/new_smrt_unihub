import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { createStallRequest, getApprovedStalls } from '../lib/eventCommunityApi';

export default function EventStallRequestPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [allApprovedStalls, setAllApprovedStalls] = useState([]);
  const [expandedStallId, setExpandedStallId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState('');
  const [formData, setFormData] = useState({
    stallName: '',
    category: 'fundraising',
    itemsSummary: '',
    description: '',
    fundingGoal: '',
    stallDate: '',
    facultyName: '',
  });

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(window.localStorage.getItem('currentUser') || 'null');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const suggestedName = currentUser?.name || '';
    setFormData((prev) => ({
      ...prev,
      facultyName: prev.facultyName || suggestedName,
    }));
  }, [currentUser]);

  const loadEvents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/events');
      const nextEvents = Array.isArray(data) ? data : [];
      setEvents(nextEvents);
      if (nextEvents.length > 0) {
        setSelectedEventId((prev) => prev || nextEvents[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllApprovedStalls = async () => {
    try {
      const data = await getApprovedStalls();
      setAllApprovedStalls(Array.isArray(data) ? data : []);
    } catch {
      setAllApprovedStalls([]);
    }
  };

  useEffect(() => {
    loadEvents();
    loadAllApprovedStalls();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadAllApprovedStalls();
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setAlert('');

    if (!selectedEventId || !formData.stallName.trim() || !formData.facultyName.trim()) {
      setError('Event, stall name, and faculty name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStallRequest({
        eventId: selectedEventId,
        stallName: formData.stallName.trim(),
        category: formData.category,
        itemsSummary: formData.itemsSummary.trim(),
        description: formData.description.trim(),
        fundingGoal: Number(formData.fundingGoal || 0),
        stallDate: formData.stallDate || null,
        facultyName: formData.facultyName.trim(),
        requestedByUserId: currentUser?._id,
      });

      setAlert('Stall request submitted. Admin approval is required before it appears publicly.');
      setFormData((prev) => ({
        ...prev,
        stallName: '',
        category: 'fundraising',
        itemsSummary: '',
        description: '',
        fundingGoal: '',
        stallDate: '',
        facultyName: prev.facultyName,
      }));
      await loadAllApprovedStalls();
    } catch (err) {
      setError(err.message || 'Failed to submit stall request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section-block">
      <div className="container eventsx-grid">
        <article className="surface eventsx-hero">
          <div>
            <span className="section-kicker">Fundraising Stalls</span>
            <h2>Request a Stall for Your Event</h2>
            <p>
              Create a stall request with item details and goal. Approved stalls are shown to all students in event details.
            </p>
          </div>
          <div className="eventsx-stat-grid">
            <div className="eventsx-stat-card"><strong>{events.length}</strong><span>Approved Events</span></div>
            <div className="eventsx-stat-card"><strong>{allApprovedStalls.length}</strong><span>Approved Stalls</span></div>
            <div className="eventsx-stat-card"><strong>Admin</strong><span>Approval Required</span></div>
            <div className="eventsx-stat-card"><strong>Live</strong><span>Auto Refresh</span></div>
          </div>
        </article>

        {alert ? <div className="surface eventsx-empty"><p>{alert}</p></div> : null}
        {error ? <div className="surface eventsx-empty"><p className="text-danger">{error}</p></div> : null}

        <div className="eventsx-create-grid">
          <form className="surface eventsx-create-form" onSubmit={handleSubmit}>
            <label>
              <span>Select Event *</span>
              <select value={selectedEventId} onChange={(event) => setSelectedEventId(event.target.value)} required>
                <option value="">Choose an approved event</option>
                {events.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.title} ({new Date(event.startDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Stall Name *</span>
              <input
                type="text"
                name="stallName"
                value={formData.stallName}
                onChange={onChange}
                required
                placeholder="Ex: Rotaract Charity Snack Booth"
              />
            </label>

            <div className="field-grid two-col">
              <label>
                <span>Category</span>
                <select name="category" value={formData.category} onChange={onChange}>
                  <option value="fundraising">Fundraising</option>
                  <option value="food">Food</option>
                  <option value="merchandise">Merchandise</option>
                  <option value="awareness">Awareness</option>
                </select>
              </label>
              <label>
                <span>Funding Goal (LKR)</span>
                <input
                  type="number"
                  min="0"
                  name="fundingGoal"
                  value={formData.fundingGoal}
                  onChange={onChange}
                  placeholder="0"
                />
              </label>
            </div>

            <label>
              <span>Stall Date</span>
              <input
                type="date"
                name="stallDate"
                value={formData.stallDate}
                onChange={onChange}
              />
            </label>

            <label>
              <span>Items Summary</span>
              <input
                type="text"
                name="itemsSummary"
                value={formData.itemsSummary}
                onChange={onChange}
                placeholder="Ex: Muffins, juices, and stickers"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                rows={3}
                name="description"
                value={formData.description}
                onChange={onChange}
                placeholder="What is the purpose of this stall?"
              />
            </label>

            <label>
              <span>Faculty Name *</span>
              <input
                type="text"
                name="facultyName"
                value={formData.facultyName}
                onChange={onChange}
                required
                placeholder="Ex: Faculty of Computing"
              />
            </label>

            <div className="eventsx-actions">
              <button type="submit" className="button button-primary" disabled={isSubmitting || isLoading || !selectedEventId}>
                {isSubmitting ? 'Submitting...' : 'Submit Stall Request'}
              </button>
              <Link to="/events" className="button button-ghost">Back to Events</Link>
            </div>
          </form>

          <aside className="surface eventsx-create-side">
            <h3>All Approved Stalls</h3>
            <p>Latest approved stalls across all events.</p>

            {allApprovedStalls.length === 0 ? (
              <p>No approved stalls available yet.</p>
            ) : (
              <div className="eventsx-community-grid">
                {allApprovedStalls.slice(0, 8).map((stall) => (
                  <article key={`all-${stall._id}`} className="eventsx-community-card">
                    {stall.image ? <img src={stall.image} alt={stall.stallName} /> : null}
                    <h4>{stall.stallName}</h4>
                    <p>{stall.description || stall.itemsSummary || 'No extra details provided.'}</p>
                    <div className="eventsx-meta">
                      <span>Event: {stall.eventId?.title || 'Unknown Event'}</span>
                      <span>Faculty: {stall.facultyName || stall.ownerName}</span>
                      {stall.stallDate ? <span>Date: {new Date(stall.stallDate).toLocaleDateString()}</span> : null}
                    </div>
                    <button
                      type="button"
                      className="button button-small button-ghost"
                      onClick={() => setExpandedStallId((prev) => (prev === stall._id ? '' : stall._id))}
                    >
                      {expandedStallId === stall._id ? 'Hide Details' : 'View Details'}
                    </button>

                    {expandedStallId === stall._id ? (
                      <div className="eventsx-detail-card" style={{ marginTop: '0.6rem' }}>
                        <p><strong>Event:</strong> {stall.eventId?.title || 'Unknown Event'}</p>
                        <p><strong>Event Date:</strong> {stall.eventId?.startDate ? new Date(stall.eventId.startDate).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Category:</strong> {stall.category || 'general'}</p>
                        <p><strong>Faculty:</strong> {stall.facultyName || stall.ownerName || 'N/A'}</p>
                        <p><strong>Items:</strong> {stall.itemsSummary || 'Not specified'}</p>
                        <p><strong>Description:</strong> {stall.description || 'Not specified'}</p>
                        <p><strong>Stall Date:</strong> {stall.stallDate ? new Date(stall.stallDate).toLocaleDateString() : 'Not specified'}</p>
                        <p><strong>Funding Goal:</strong> {stall.fundingGoal > 0 ? `LKR ${Number(stall.fundingGoal).toLocaleString()}` : 'N/A'}</p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
