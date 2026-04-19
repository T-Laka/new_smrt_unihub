import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { readStoredUser } from '../lib/auth';

function statusClass(status) {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return '';
  return '';
}

function printTicket(booking) {
  const event = booking.event || {};
  const ticket = booking.ticket || {};
  const payment = booking.payment || {};

  const html = `
    <html>
      <head>
        <title>Event Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          .ticket { border: 2px dashed #2563eb; border-radius: 12px; padding: 20px; max-width: 700px; }
          .header { margin-bottom: 16px; }
          .title { font-size: 24px; margin: 0 0 8px 0; }
          .meta { margin: 6px 0; }
          .code { margin-top: 18px; font-size: 20px; font-weight: bold; color: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <p class="title">SLIIT Event Ticket</p>
            <p class="meta"><strong>Event:</strong> ${event.title || '-'}</p>
            <p class="meta"><strong>Venue:</strong> ${event.location || '-'}</p>
            <p class="meta"><strong>Date:</strong> ${event.startDate ? new Date(event.startDate).toLocaleString() : '-'}</p>
          </div>
          <p class="meta"><strong>Name:</strong> ${booking.userName || '-'}</p>
          <p class="meta"><strong>Email:</strong> ${booking.userEmail || '-'}</p>
          <p class="meta"><strong>Tickets:</strong> ${booking.ticketCount || 1}</p>
          <p class="meta"><strong>Amount Paid:</strong> LKR ${payment.amount || '-'}</p>
          <p class="meta"><strong>Payment Ref:</strong> ${payment.reference || '-'}</p>
          <p class="meta"><strong>Issued On:</strong> ${ticket.issuedAt ? new Date(ticket.issuedAt).toLocaleString() : '-'}</p>
          <p class="code">Ticket No: ${ticket.ticketNumber || '-'}</p>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
}

export default function MyEventBookingsPage() {
  const user = useMemo(() => readStoredUser(), []);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = async () => {
    if (!user?._id && !user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const data = await apiRequest(`/api/event-bookings/my/${user._id || user.id}`);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const intervalId = setInterval(loadBookings, 10000);
    return () => clearInterval(intervalId);
  }, []);

  if (!user) {
    return (
      <section className="section-block">
        <div className="container surface eventsx-empty">
          <p>Please login to view your bookings and tickets.</p>
          <Link to="/login" className="button button-primary button-small">Go to Login</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="My Event Bookings"
        title="Booking Status and Tickets"
        subtitle="Admin verifies your payment. Once approved, your ticket appears here and can be printed."
      />

      <section className="section-block">
        <div className="container eventsx-grid">
          <article className="surface eventsx-toolbar">
            <div className="eventsx-toolbar-actions">
              <Link to="/events" className="button button-small button-ghost">Browse Events</Link>
              <button type="button" className="button button-small button-primary" onClick={loadBookings}>
                Refresh Status
              </button>
            </div>
          </article>

          {isLoading ? (
            <div className="surface eventsx-empty"><p>Loading bookings...</p></div>
          ) : error ? (
            <div className="surface eventsx-empty"><p className="text-danger">{error}</p></div>
          ) : bookings.length === 0 ? (
            <div className="surface eventsx-empty">
              <p>No event bookings found yet.</p>
              <Link to="/events" className="button button-primary button-small">Go Book an Event</Link>
            </div>
          ) : (
            <div className="eventsx-card-grid">
              {bookings.map((booking) => (
                <article key={booking._id} className="surface eventsx-card">
                  <div className="eventsx-card-head">
                    <div className="section-kicker">{new Date(booking.createdAt).toLocaleDateString()}</div>
                    <span className={`pill ${statusClass(booking.verificationStatus)}`}>
                      {booking.verificationStatus}
                    </span>
                  </div>

                  <h3>{booking.event?.title || 'Event'}</h3>
                  <p>{booking.event?.location || 'Campus'}</p>
                  <div className="eventsx-meta">
                    <span>Tickets: {booking.ticketCount}</span>
                    <span>Amount: LKR {booking.payment?.amount || '-'}</span>
                  </div>
                  <div className="eventsx-meta">
                    <span>Payment Ref: {booking.payment?.reference || '-'}</span>
                    <span>Card: ****{booking.payment?.cardLast4 || '-'}</span>
                  </div>

                  {booking.verificationStatus === 'pending' ? (
                    <div className="notice" style={{ marginTop: '0.7rem' }}>
                      Payment submitted. Waiting for admin verification.
                    </div>
                  ) : null}

                  {booking.verificationStatus === 'rejected' ? (
                    <div className="notice error" style={{ marginTop: '0.7rem' }}>
                      Payment rejected by admin. {booking.adminNote ? `Reason: ${booking.adminNote}` : ''}
                    </div>
                  ) : null}

                  {booking.verificationStatus === 'approved' && booking.ticket ? (
                    <div className="callout-box" style={{ marginTop: '0.7rem' }}>
                      <strong>Ticket No: {booking.ticket.ticketNumber}</strong>
                      <p>Issued: {new Date(booking.ticket.issuedAt).toLocaleString()}</p>
                      <button
                        type="button"
                        className="button button-primary button-small"
                        onClick={() => printTicket(booking)}
                      >
                        Print Ticket
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
