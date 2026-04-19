import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { readStoredUser } from '../lib/auth';

export default function EventBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useMemo(() => readStoredUser(), []);

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    ticketCount: 1,
    cardHolder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const ticketPrice = Number(event?.ticketPrice || 0);
  const totalAmount = Number(form.ticketCount || 0) * ticketPrice;

  useEffect(() => {
    async function loadEvent() {
      try {
        setIsLoading(true);
        const data = await apiRequest(`/api/events/${id}`);
        setEvent(data);
      } catch (err) {
        setError(err.message || 'Failed to load event details');
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [id]);

  const canBook =
    event &&
    event.status === 'approved' &&
    String(event.eventType || '').toLowerCase() === 'indoor' &&
    ticketPrice > 0;

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (eventObject) => {
    eventObject.preventDefault();
    setError('');
    setSubmitMessage('');

    if (!user) {
      setError('Please login to continue booking.');
      return;
    }

    if (!canBook) {
      setError('This event is not eligible for booking. Only approved indoor events can be booked.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest('/api/event-bookings', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event._id,
          userId: user._id || user.id,
          userName: user.name || 'Student',
          userEmail: user.email || 'student@my.sliit.lk',
          ticketCount: Number(form.ticketCount),
          payment: {
            cardHolder: form.cardHolder,
            cardNumber: form.cardNumber,
            expiry: form.expiry,
            cvv: form.cvv,
            amount: totalAmount,
          },
        }),
      });

      setSubmitMessage('Payment submitted successfully. Admin verification is pending.');
      setTimeout(() => {
        navigate('/my-event-bookings');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to submit booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <section className="section-block">
        <div className="container surface eventsx-empty">
          <p>Please login to book event tickets.</p>
          <Link to="/login" className="button button-primary button-small">Go to Login</Link>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="section-block">
        <div className="container surface eventsx-empty">
          <p>Loading event information...</p>
        </div>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="section-block">
        <div className="container surface eventsx-empty">
          <p>Event not found.</p>
          <Link to="/events" className="button button-primary button-small">Back to Events</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Event Booking"
        title="Book Your Seat"
        subtitle="Submit payment, then wait for admin verification to receive your printable ticket."
      />

      <section className="section-block">
        <div className="container eventsx-grid">
          <article className="surface eventsx-detail-card">
            <h3>{event.title}</h3>
            <p>{event.description || 'No description available.'}</p>
            <div className="eventsx-meta">
              <span>Type: {event.eventType || 'general'}</span>
              <span>Status: {event.status}</span>
            </div>
            <div className="eventsx-meta">
              <span>Start: {new Date(event.startDate).toLocaleString()}</span>
              <span>Venue: {event.location || 'Campus'}</span>
            </div>
            <div className="eventsx-meta">
              <span>Price per ticket: LKR {ticketPrice || '-'}</span>
              <span>Total seats: {event.totalSeats || 'Unlimited'}</span>
            </div>

            {!canBook ? (
              <p className="text-danger" style={{ marginTop: '0.8rem' }}>
                Booking is available only for approved indoor events.
              </p>
            ) : null}
          </article>

          <article className="surface form-card">
            <h2>Payment Details</h2>
            <p className="form-note">Fill card details to submit booking payment.</p>

            {error ? <div className="notice error">{error}</div> : null}
            {submitMessage ? <div className="notice success">{submitMessage}</div> : null}

            <form onSubmit={handleSubmit} className="stacked-form">
              <label>
                <span className="field-label-row">Ticket Count</span>
                <input
                  type="number"
                  min="1"
                  value={form.ticketCount}
                  onChange={(eventObject) => handleChange('ticketCount', eventObject.target.value)}
                  required
                />
              </label>

              <label>
                <span className="field-label-row">Card Holder Name</span>
                <input
                  type="text"
                  value={form.cardHolder}
                  onChange={(eventObject) => handleChange('cardHolder', eventObject.target.value)}
                  required
                />
              </label>

              <label>
                <span className="field-label-row">Card Number</span>
                <input
                  type="text"
                  value={form.cardNumber}
                  onChange={(eventObject) => handleChange('cardNumber', eventObject.target.value)}
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </label>

              <div className="field-grid two-col">
                <label>
                  <span className="field-label-row">Expiry (MM/YY)</span>
                  <input
                    type="text"
                    value={form.expiry}
                    onChange={(eventObject) => handleChange('expiry', eventObject.target.value)}
                    placeholder="08/28"
                    required
                  />
                </label>

                <label>
                  <span className="field-label-row">CVV</span>
                  <input
                    type="password"
                    value={form.cvv}
                    onChange={(eventObject) => handleChange('cvv', eventObject.target.value)}
                    placeholder="123"
                    required
                  />
                </label>
              </div>

              <div className="callout-box subtle">
                <strong>Total Payment: LKR {totalAmount}</strong>
                <p>After payment submission, admin must verify before ticket is issued.</p>
              </div>

              <button type="submit" className="button button-primary button-full" disabled={!canBook || isSubmitting}>
                {isSubmitting ? 'Submitting Payment...' : 'Pay and Book'}
              </button>

              <Link to="/events" className="button button-ghost button-full">Cancel</Link>
            </form>
          </article>
        </div>
      </section>
    </>
  );
}
