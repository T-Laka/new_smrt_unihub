import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { readStoredUser } from '../lib/auth';

export default function StudyAreaPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [seats, setSeats] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [unpaidFines, setUnpaidFines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [arrived, setArrived] = useState(false);
  const user = readStoredUser();

  useEffect(() => {
    fetchSeats();
    fetchActiveBooking();
    fetchUnpaidFines();
  }, [date, startTime, endTime]);

  async function fetchSeats() {
    setError('');
    try {
      const results = await apiRequest(
        `/api/bookings/seats?date=${encodeURIComponent(date)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`
      );
      setSeats(results);
    } catch (err) {
      setError(err.message || 'Unable to load seats.');
    }
  }

  async function fetchActiveBooking() {
    if (!user) {
      setActiveBooking(null);
      return;
    }

    try {
      const userId = user._id || user.id;
      const booking = await apiRequest(`/api/bookings/active/${userId}`);
      setActiveBooking(booking);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchUnpaidFines() {
    if (!user) {
      setUnpaidFines([]);
      return;
    }

    try {
      const userId = user._id || user.id;
      const fines = await apiRequest(`/api/fines/user/${userId}`);
      const unpaid = fines.filter((fine) => fine.status === 'unpaid');
      setUnpaidFines(unpaid);
    } catch (err) {
      console.error('Failed to fetch fines:', err);
    }
  }

  async function handleBooking(seat) {
    if (!user) {
      return alert('Please login to book a seat.');
    }

    if (seat.status === 'booked') {
      return;
    }

    if (activeBooking) {
      return alert('You already have an active booking.');
    }

    if (unpaidFines.length > 0) {
      return alert(`You have ${unpaidFines.length} unpaid fine(s). Please clear them before booking. Total amount: Rs. ${unpaidFines.reduce((sum, f) => sum + f.amount, 0)}`);
    }

    if (!window.confirm(`Book Table ${seat.tableId} Seat ${seat.seatNumber} from ${startTime} to ${endTime}?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = user._id || user.id;
      await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          seatId: seat._id,
          date,
          startTime,
          endTime,
        }),
      });
      await fetchSeats();
      await fetchActiveBooking();
    } catch (err) {
      setError(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteBooking() {
    if (!activeBooking) return;
    try {
      await apiRequest(`/api/bookings/complete/${activeBooking._id || activeBooking.id}`, {
        method: 'PUT',
      });
      setActiveBooking(null);
      fetchSeats();
    } catch (err) {
      setError(err.message || 'Failed to complete booking');
    }
  }

  async function handleCancelBooking() {
    if (!activeBooking) return;
    try {
      await apiRequest(`/api/bookings/cancel/${activeBooking._id || activeBooking.id}`, {
        method: 'PUT',
      });
      setActiveBooking(null);
      fetchSeats();
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    }
  }

  async function handleArrived() {
    if (!activeBooking) return;
    setArrived(true);
    try {
      await apiRequest(`/api/bookings/arrive/${activeBooking._id || activeBooking.id}`, {
        method: 'PUT',
      });
      fetchActiveBooking();
      fetchSeats();
    } catch (err) {
      setError(err.message || 'Failed to mark arrival');
      setArrived(false);
    }
  }

  const [hoveredSeat, setHoveredSeat] = useState(null);
  const tableIds = Array.from(new Set(seats.map((seat) => seat.tableId))).sort((a, b) => a - b);

  return (
    <>
      <PageHeader
        eyebrow="Study Area"
        title="Book Your Study Seat"
        subtitle="Reserve a table and seat for your study session."
      />

      <section className="section-block">
        <div className="container">
          {error ? <div className="notice error">{error}</div> : null}

          {unpaidFines.length > 0 ? (
            <div className="notice error" style={{ marginBottom: '1rem' }}>
              <strong>⚠️ Unpaid Fines:</strong> You have {unpaidFines.length} unpaid fine(s) totaling Rs. {unpaidFines.reduce((sum, f) => sum + f.amount, 0)}.
              You must clear these before booking new seats.
              {unpaidFines.map((fine) => (
                <div key={fine._id} style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  • Rs. {fine.amount} - {fine.reason}
                </div>
              ))}
            </div>
          ) : null}

          {!user ? (
            <div className="surface notice info">
              Please log in to view and book seats.
            </div>
          ) : null}

          <div className="surface" style={{ marginBottom: '1.5rem' }}>
            <div className="grid-3 gap-1">
              <label>
                <span className="field-label-row">Date</span>
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label>
                <span className="field-label-row">Start Time</span>
                <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              </label>
              <label>
                <span className="field-label-row">End Time</span>
                <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
              </label>
            </div>
          </div>

          {activeBooking ? (
            <div className="surface" style={{ marginBottom: '1.5rem' }}>
              <h2>Active Booking</h2>
              <p>
                Table <strong>{activeBooking.seat?.tableId}</strong>, Seat <strong>{activeBooking.seat?.seatNumber}</strong>
                <br />
                {new Date(activeBooking.bookingDate).toLocaleDateString()} • {activeBooking.startTime} - {activeBooking.endTime}
              </p>
              <div className="stacked-form" style={{ gap: '0.75rem' }}>
                <button
                  type="button"
                  className="button button-primary button-full"
                  onClick={handleArrived}
                  disabled={loading}
                  style={{
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
                    transform: arrived ? 'scale(0.96)' : 'scale(1)',
                    background: arrived ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' : '',
                    boxShadow: arrived ? '0 0 0 4px rgba(59,130,246,0.35), 0 8px 24px rgba(59,130,246,0.25)' : '',
                  }}
                >
                  {arrived ? '✓ Arrived!' : 'I Arrived'}
                </button>
                <button type="button" className="button button-secondary button-full" onClick={handleCompleteBooking} disabled={loading}>
                  Complete
                </button>
                <button type="button" className="button button-ghost button-full" onClick={handleCancelBooking} disabled={loading}
                  style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="surface">
            <h2>Available Tables</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              {tableIds.map((tableId) => {
                const tableSeats = seats.filter((seat) => seat.tableId === tableId);
                const isSelected = false;

                return (
                  <div key={tableId} style={{ width: '140px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gridGap: '0.5rem',
                      padding: '0.75rem',
                      background: '#0f172a',
                      borderRadius: '1rem',
                      border: '1px solid rgba(148, 163, 184, 0.14)'
                    }}>
                      {tableSeats.map((seat) => {
                        const isBooked = seat.status === 'booked';
                        const isDisabled = isBooked || !user || Boolean(activeBooking) || unpaidFines.length > 0;
                        const isHovered = hoveredSeat === seat._id && !isDisabled;

                        let bg = '#e2e8f0';
                        if (isBooked) bg = '#dc2626';
                        else if (unpaidFines.length > 0) bg = '#f59e0b';
                        else if (isHovered) bg = '#38bdf8';

                        return (
                          <button
                            key={seat._id}
                            type="button"
                            onClick={() => handleBooking(seat)}
                            onMouseEnter={() => setHoveredSeat(seat._id)}
                            onMouseLeave={() => setHoveredSeat(null)}
                            disabled={isDisabled}
                            title={unpaidFines.length > 0 ? 'You have unpaid fines. Clear them to book.' : ''}
                            style={{
                              width: '100%',
                              height: '48px',
                              borderRadius: '0.8rem',
                              border: isHovered ? '1px solid #0ea5e9' : '1px solid rgba(148, 163, 184, 0.18)',
                              background: bg,
                              color: isBooked || unpaidFines.length > 0 ? '#fff' : '#0f172a',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                              boxShadow: isHovered ? '0 4px 14px rgba(56,189,248,0.45)' : 'none',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, border 0.15s ease',
                            }}
                          >
                            {seat.seatNumber}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center' }}>
                      Table {tableId}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
