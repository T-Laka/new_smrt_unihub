import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    eventType: 'indoor',
    totalSeats: '',
    ticketPrice: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'eventType') {
      setFormData(prev => ({
        ...prev,
        eventType: value,
        totalSeats: value === 'indoor' ? prev.totalSeats : '',
        ticketPrice: value === 'indoor' ? prev.ticketPrice : '',
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const eventData = {
        ...formData,
        totalSeats: formData.eventType === 'indoor' ? parseInt(formData.totalSeats) : undefined,
        ticketPrice: formData.eventType === 'indoor' ? parseFloat(formData.ticketPrice) : undefined,
      };

      await apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });

      navigate('/events');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section-block">
      <div className="container eventsx-grid">
        <article className="surface eventsx-hero">
          <div>
            <span className="section-kicker">Create Event</span>
            <h2>Launch a New Campus Event</h2>
            <p>
              Fill in event details and submit for admin approval. Clear and complete details speed up moderation.
            </p>
          </div>
          <div className="eventsx-stat-grid">
            <div className="eventsx-stat-card"><strong>{formData.title ? 'Ready' : 'Draft'}</strong><span>Current State</span></div>
            <div className="eventsx-stat-card"><strong>{formData.eventType}</strong><span>Event Type</span></div>
            <div className="eventsx-stat-card"><strong>{formData.totalSeats || '-'}</strong><span>Seat Capacity</span></div>
            <div className="eventsx-stat-card"><strong>{formData.eventType === 'indoor' ? `LKR ${formData.ticketPrice || '-'}` : 'N/A'}</strong><span>Ticket Price</span></div>
            <div className="eventsx-stat-card"><strong>{formData.location || 'TBD'}</strong><span>Location</span></div>
          </div>
        </article>

        <div className="eventsx-create-grid">
          <form onSubmit={handleSubmit} className="surface eventsx-create-form">
            {error ? <p className="text-danger">{error}</p> : null}

            <label>
              <span>Event Title *</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter event title"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the event"
                rows={4}
              />
            </label>

            <div className="field-grid">
              <label>
                <span>Start Date & Time *</span>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>End Date & Time *</span>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label>
              <span>Location</span>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Event location"
              />
            </label>

            <label>
              <span>Event Type *</span>
              <select name="eventType" value={formData.eventType} onChange={handleChange} required>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </label>

            {formData.eventType === 'indoor' ? (
              <>
                <label>
                  <span>Total Seats *</span>
                  <input
                    type="number"
                    name="totalSeats"
                    value={formData.totalSeats}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Number of seats"
                  />
                </label>

                <label>
                  <span>Ticket Price (LKR) *</span>
                  <input
                    type="number"
                    name="ticketPrice"
                    value={formData.ticketPrice}
                    onChange={handleChange}
                    required
                    min="1"
                    step="1"
                    placeholder="Ticket price for indoor event"
                  />
                </label>
              </>
            ) : null}

            <div className="eventsx-actions">
              <button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Event'}
              </button>
              <Link to="/events" className="button button-ghost">Back to Events</Link>
            </div>
          </form>

          <aside className="surface eventsx-create-side">
            <h3>Submission Preview</h3>
            <p>Review your event summary before submitting.</p>
            <div className="eventsx-detail-grid">
              <div className="eventsx-detail-card">
                <h4>Title</h4>
                <p>{formData.title || 'Untitled Event'}</p>
              </div>
              <div className="eventsx-detail-card">
                <h4>Schedule</h4>
                <p>{formData.startDate ? new Date(formData.startDate).toLocaleString() : 'Start time not set'}</p>
                <p>{formData.endDate ? new Date(formData.endDate).toLocaleString() : 'End time not set'}</p>
              </div>
              <div className="eventsx-detail-card">
                <h4>Location</h4>
                <p>{formData.location || 'To be decided'}</p>
              </div>
              <div className="eventsx-detail-card">
                <h4>Status on Submit</h4>
                <p>Pending Approval</p>
              </div>
              <div className="eventsx-detail-card">
                <h4>Ticket Price</h4>
                <p>{formData.eventType === 'indoor' ? `LKR ${formData.ticketPrice || '-'}` : 'N/A for outdoor events'}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}