import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { getApprovedStalls, getEventMemories } from '../lib/eventCommunityApi';

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [memories, setMemories] = useState([]);
  const [communityError, setCommunityError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const canBook =
    event &&
    event.status === 'approved' &&
    String(event.eventType || '').toLowerCase() === 'indoor' &&
    Number(event.ticketPrice || 0) > 0;

  useEffect(() => {
    let isMounted = true;

    async function loadEvent() {
      try {
        setIsLoading(true);
        setError('');
        setCommunityError('');
        const data = await apiRequest(`/api/events/${id}`);
        if (!isMounted) return;
        setEvent(data);

        try {
          const [stallData, memoryData] = await Promise.all([
            getApprovedStalls(data._id),
            getEventMemories(data._id),
          ]);

          if (!isMounted) return;
          setStalls(Array.isArray(stallData) ? stallData : []);
          setMemories(Array.isArray(memoryData) ? memoryData : []);
        } catch {
          if (!isMounted) return;
          setCommunityError('Could not load stalls or memories for this event right now.');
          setStalls([]);
          setMemories([]);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadEvent();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <section className="section-block">
        <div className="container surface eventsx-empty">
          <p>Loading event details…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-block">
        <div className="container surface eventsx-empty">
          <p className="text-danger">{error}</p>
          <Link to="/events" className="button button-primary button-small">See all events</Link>
        </div>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="section-block">
        <div className="container surface eventsx-empty">
          <p>Event not found.</p>
          <Link to="/events" className="button button-primary button-small">See all events</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-block eventsx-detail-wrap">
      <div className="container eventsx-grid">
        <article className="surface eventsx-hero">
          <div>
            <span className="section-kicker">Event Details</span>
            <h2>{event.title}</h2>
            <p>{event.description || 'No description available.'}</p>
          </div>
          <div className="eventsx-stat-grid">
            <div className="eventsx-stat-card">
              <strong>{new Date(event.startDate).toLocaleDateString()}</strong>
              <span>Start Date</span>
            </div>
            <div className="eventsx-stat-card">
              <strong>{new Date(event.endDate).toLocaleDateString()}</strong>
              <span>End Date</span>
            </div>
            <div className="eventsx-stat-card">
              <strong>{event.location || 'Campus'}</strong>
              <span>Location</span>
            </div>
            <div className="eventsx-stat-card">
              <strong>{event.status}</strong>
              <span>Status</span>
            </div>
          </div>
        </article>

        <article className="surface eventsx-detail-body">
          <div className="eventsx-detail-grid">
            <div className="eventsx-detail-card">
              <h3>Schedule</h3>
              <p><strong>Start:</strong> {new Date(event.startDate).toLocaleString()}</p>
              <p><strong>End:</strong> {new Date(event.endDate).toLocaleString()}</p>
            </div>
            <div className="eventsx-detail-card">
              <h3>Venue</h3>
              <p>{event.location || 'Campus'}</p>
            </div>
            <div className="eventsx-detail-card">
              <h3>Event Type</h3>
              <p>{event.eventType || 'General'}</p>
            </div>
            {event.totalSeats ? (
              <div className="eventsx-detail-card">
                <h3>Capacity</h3>
                <p>{event.totalSeats} seats</p>
              </div>
            ) : null}
            {String(event.eventType || '').toLowerCase() === 'indoor' && Number(event.ticketPrice || 0) > 0 ? (
              <div className="eventsx-detail-card">
                <h3>Ticket Price</h3>
                <p>LKR {Number(event.ticketPrice)}</p>
              </div>
            ) : null}
          </div>

          {communityError ? <p className="text-danger">{communityError}</p> : null}

          <div className="eventsx-detail-grid">
            <div className="eventsx-detail-card">
              <h3>Approved Stalls</h3>
              {stalls.length === 0 ? (
                <p>No approved stalls yet.</p>
              ) : (
                <div className="eventsx-community-grid">
                  {stalls.map((stall) => (
                    <article key={stall._id} className="eventsx-community-card">
                      {stall.image ? <img src={stall.image} alt={stall.stallName} /> : null}
                      <h4>{stall.stallName}</h4>
                      <p>{stall.description || stall.itemsSummary || 'Stall details will be updated soon.'}</p>
                      <div className="eventsx-meta">
                        <span>{stall.category}</span>
                        <span>{stall.facultyName || stall.ownerName}</span>
                      </div>
                      {stall.itemsSummary ? <p><strong>Items:</strong> {stall.itemsSummary}</p> : null}
                      {stall.fundingGoal ? <p><strong>Funding Goal:</strong> LKR {stall.fundingGoal}</p> : null}
                      {stall.stallDate ? <p><strong>Stall Date:</strong> {new Date(stall.stallDate).toLocaleDateString()}</p> : null}
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="eventsx-detail-card">
              <h3>Shared Memories</h3>
              {memories.length === 0 ? (
                <p>No memories posted for this event yet.</p>
              ) : (
                <div className="eventsx-community-grid">
                  {memories.slice(0, 4).map((memory) => (
                    <article key={memory._id} className="eventsx-community-card">
                      {memory.images?.length ? <img src={memory.images[0]} alt={memory.title || 'Event memory'} /> : null}
                      <h4>{memory.title || 'Event Highlight'}</h4>
                      <p>{memory.description || 'No description provided.'}</p>
                      <div className="eventsx-meta">
                        <span>By {memory.sharedByName}</span>
                        <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="eventsx-actions">
            <Link to="/events" className="button button-primary button-small">
              Browse Other Events
            </Link>
            {canBook ? (
              <Link to={`/events/${event._id}/book`} className="button button-secondary button-small">
                Book
              </Link>
            ) : null}
            <Link to="/my-event-bookings" className="button button-ghost button-small">
              My Tickets
            </Link>
            <Link to="/event-memories" className="button button-ghost button-small">
              Share Memory
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
