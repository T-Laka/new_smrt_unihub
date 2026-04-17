import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthLabel(date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function buildCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < startWeekday; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export default function EventsCalendarPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    async function loadEvents() {
      setIsLoading(true);
      setError('');
      try {
        const data = await apiRequest('/api/events');
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load events');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const eventDate = new Date(event.startDate);
      if (Number.isNaN(eventDate.getTime())) return;
      const key = toDateKey(eventDate);
      const existing = map.get(key) || [];
      existing.push(event);
      existing.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      map.set(key, existing);
    });
    return map;
  }, [events]);

  const calendarDays = useMemo(() => buildCalendarDays(monthDate), [monthDate]);

  const thisMonthEvents = useMemo(() => {
    return events.filter((event) => {
      const start = new Date(event.startDate);
      return start.getFullYear() === monthDate.getFullYear() && start.getMonth() === monthDate.getMonth();
    });
  }, [events, monthDate]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((event) => new Date(event.startDate).getTime() >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 6);
  }, [events]);

  const goPrevMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <section className="section-block">
      <div className="container eventsx-grid">
        <article className="surface eventsx-hero">
          <div>
            <span className="section-kicker">Approved Event Calendar</span>
            <h2>Monthly Campus Event View</h2>
            <p>
              Every approved event appears here by date so students can plan participation and avoid schedule clashes.
            </p>
          </div>
          <div className="eventsx-stat-grid">
            <div className="eventsx-stat-card"><strong>{events.length}</strong><span>Approved Events</span></div>
            <div className="eventsx-stat-card"><strong>{thisMonthEvents.length}</strong><span>This Month</span></div>
            <div className="eventsx-stat-card"><strong>{upcomingEvents.length}</strong><span>Upcoming Preview</span></div>
            <div className="eventsx-stat-card"><strong>{monthLabel(monthDate)}</strong><span>Current View</span></div>
          </div>
        </article>

        {error ? <div className="surface eventsx-empty"><p className="text-danger">{error}</p></div> : null}

        <div className="eventsx-calendar-layout">
          <article className="surface eventsx-calendar-card">
            <div className="eventsx-calendar-head">
              <button type="button" className="button button-small button-ghost" onClick={goPrevMonth}>Previous</button>
              <h3>{monthLabel(monthDate)}</h3>
              <button type="button" className="button button-small button-ghost" onClick={goNextMonth}>Next</button>
            </div>

            <div className="eventsx-calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            {isLoading ? (
              <div className="eventsx-empty"><p>Loading calendar...</p></div>
            ) : (
              <div className="eventsx-calendar-grid">
                {calendarDays.map((dateValue, index) => {
                  if (!dateValue) {
                    return <div key={`empty-${index}`} className="eventsx-calendar-cell empty" />;
                  }

                  const dateKey = toDateKey(dateValue);
                  const dayEvents = eventsByDate.get(dateKey) || [];
                  const isToday = toDateKey(new Date()) === dateKey;

                  return (
                    <div key={dateKey} className={`eventsx-calendar-cell ${isToday ? 'today' : ''}`}>
                      <div className="eventsx-calendar-date">{dateValue.getDate()}</div>
                      <div className="eventsx-calendar-events">
                        {dayEvents.slice(0, 2).map((event) => (
                          <Link key={event._id} to={`/events/${event._id}`} className="eventsx-calendar-event-link">
                            {event.title}
                          </Link>
                        ))}
                        {dayEvents.length > 2 ? <span className="eventsx-calendar-more">+{dayEvents.length - 2} more</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <aside className="surface eventsx-calendar-side">
            <h3>Upcoming Events</h3>
            <p>Quick preview of the next approved events.</p>
            {upcomingEvents.length === 0 ? (
              <p>No upcoming events yet.</p>
            ) : (
              <div className="eventsx-community-grid">
                {upcomingEvents.map((event) => (
                  <article key={event._id} className="eventsx-community-card">
                    <h4>{event.title}</h4>
                    <p>{event.location || 'Campus'}</p>
                    <div className="eventsx-meta">
                      <span>{new Date(event.startDate).toLocaleString()}</span>
                      <span>{event.eventType || 'General'}</span>
                    </div>
                    <Link to={`/events/${event._id}`} className="button button-small button-primary">Open</Link>
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
