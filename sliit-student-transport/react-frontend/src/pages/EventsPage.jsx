import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  const locationOptions = useMemo(() => {
    const unique = Array.from(
      new Set(events.map((event) => String(event.location || 'Campus').trim()))
    );
    return ['all', ...unique];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const haystack = `${event.title || ''} ${event.description || ''} ${event.location || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(searchText.trim().toLowerCase());
      const matchesLocation =
        locationFilter === 'all' ||
        String(event.location || 'Campus').trim() === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [events, searchText, locationFilter]);

  const eventStats = useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    let thisWeek = 0;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    events.forEach((event) => {
      const start = new Date(event.startDate).getTime();
      if (Number.isFinite(start) && start >= now) {
        upcoming += 1;
        if (start - now <= oneWeek) thisWeek += 1;
      }
    });

    return {
      total: events.length,
      upcoming,
      thisWeek,
      locations: Math.max(locationOptions.length - 1, 0),
    };
  }, [events, locationOptions]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await apiRequest('/api/events');
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, []);

  return (
    <section className="section-block">
      <div className="container eventsx-grid">
        <article className="surface eventsx-hero">
          <div>
            <span className="section-kicker">Campus Events</span>
            <h2>Discover and Plan Your Campus Moments</h2>
            <p>
              Explore approved events, track timelines, and register interest in activities happening around SLIIT.
            </p>
          </div>
          <div className="eventsx-stat-grid">
            <div className="eventsx-stat-card"><strong>{eventStats.total}</strong><span>Total Events</span></div>
            <div className="eventsx-stat-card"><strong>{eventStats.upcoming}</strong><span>Upcoming</span></div>
            <div className="eventsx-stat-card"><strong>{eventStats.thisWeek}</strong><span>This Week</span></div>
            <div className="eventsx-stat-card"><strong>{eventStats.locations}</strong><span>Locations</span></div>
          </div>
        </article>

        <div className="eventsx-toolbar">
          <label>
            <span>Search Events</span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by title, description, or location"
            />
          </label>
          <label>
            <span>Location</span>
            <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
              {locationOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'ALL LOCATIONS' : option}
                </option>
              ))}
            </select>
          </label>
          <div className="eventsx-toolbar-actions">
            <Link to="/" className="button button-small button-ghost">Back to Home</Link>
            <Link to="/create-event" className="button button-small button-primary">Create Event</Link>
            <Link to="/event-stalls/new" className="button button-small">Create Stall</Link>
            <Link to="/event-memories" className="button button-small button-ghost">Share Memory</Link>
            <Link to="/events-calendar" className="button button-small button-ghost">View Calendar</Link>
          </div>
        </div>

        {isLoading ? (
          <div className="surface card eventsx-empty">
            <p>Loading events…</p>
          </div>
        ) : error ? (
          <div className="surface card eventsx-empty">
            <p className="text-danger">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="surface card eventsx-empty">
            <p>No events are available yet. Check back soon.</p>
          </div>
        ) : (
          <div className="eventsx-card-grid">
            {filteredEvents.map((event) => (
              <article key={event._id} className="surface eventsx-card">
                <div className="eventsx-card-head">
                  <div className="section-kicker">{new Date(event.startDate).toLocaleDateString()}</div>
                  <span className={`pill ${event.status === 'approved' ? 'success' : ''}`}>{event.status}</span>
                </div>
                <h3>{event.title}</h3>
                <p className="eventsx-location">{event.location || 'Online / Campus'}</p>
                <p>{event.description || 'No additional details available.'}</p>
                <div className="eventsx-meta">
                  <span>Start: {new Date(event.startDate).toLocaleString()}</span>
                  <span>End: {new Date(event.endDate).toLocaleString()}</span>
                </div>
                <div className="eventsx-actions">
                  <Link to={`/events/${event._id}`} className="button button-primary button-small">
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
