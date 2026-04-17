import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { readStoredUser } from '../lib/auth';

export default function AdminStudyAreaPage() {
  const [pendingArrivals, setPendingArrivals] = useState([]);
  const [unpaidFines, setUnpaidFines] = useState([]);
  const [tab, setTab] = useState('arrivals');
  const [loading, setLoading] = useState(false);
  const user = readStoredUser();

  useEffect(() => {
    fetchPendingArrivals();
    fetchUnpaidFines();
  }, []);

  async function fetchPendingArrivals() {
    try {
      const results = await apiRequest('/api/bookings/pending-arrivals');
      setPendingArrivals(results);
    } catch (err) {
      console.error('Failed to fetch pending arrivals:', err);
    }
  }

  async function fetchUnpaidFines() {
    try {
      const results = await apiRequest('/api/fines/unpaid');
      setUnpaidFines(results);
    } catch (err) {
      console.error('Failed to fetch unpaid fines:', err);
    }
  }

  async function handleConfirm(bookingId) {
    setLoading(true);
    try {
      const adminId = user._id || user.id;
      await apiRequest(`/api/bookings/admin-confirm/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ admin_id: adminId }),
      });
      await fetchPendingArrivals();
    } catch (err) {
      alert(err.message || 'Failed to confirm arrival');
    } finally {
      setLoading(false);
    }
  }

  async function handleNoShow(bookingId) {
    setLoading(true);
    try {
      const adminId = user._id || user.id;
      await apiRequest(`/api/bookings/admin-no-show/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ admin_id: adminId, fine_amount: 100 }),
      });
      await fetchPendingArrivals();
    } catch (err) {
      alert(err.message || 'Failed to mark no-show');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment(fineId) {
    setLoading(true);
    try {
      await apiRequest(`/api/fines/pay/${fineId}`, {
        method: 'PUT',
      });
      await fetchUnpaidFines();
    } catch (err) {
      alert(err.message || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '1.5rem',
    transition: 'border-color 0.2s',
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin Panel"
        title="Study Area Administration"
        subtitle="Manage seat bookings, arrivals, and fines."
      />

      <section className="section-block">
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div className="grid-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
            {[
              {
                label: 'Pending Arrivals',
                value: pendingArrivals.length,
                color: '#818cf8',
                bg: 'rgba(99,102,241,0.1)',
                icon: '🕐',
              },
              {
                label: 'Unpaid Fines',
                value: unpaidFines.length,
                color: '#fcd34d',
                bg: 'rgba(245,158,11,0.1)',
                icon: '💰',
              },
            ].map(({ label, value, color, bg, icon }) => (
              <article key={label} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      fontFamily: "'Outfit',sans-serif",
                      color,
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {label}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[
              { key: 'arrivals', label: 'Pending Arrivals', count: pendingArrivals.length },
              { key: 'fines', label: 'Fine Management', count: unpaidFines.length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: tab === key ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                  color: tab === key ? '#818cf8' : '#94a3b8',
                  outline: tab === key ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {label}
                {count > 0 && (
                  <span
                    style={{
                      marginLeft: '8px',
                      background: tab === key ? '#6366f1' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      borderRadius: '99px',
                      padding: '1px 7px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === 'arrivals' &&
            (pendingArrivals.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✓</div>
                <div style={{ fontWeight: 600 }}>No pending arrivals</div>
              </div>
            ) : (
              <div className="grid-auto" style={{ gap: '1rem' }}>
                {pendingArrivals.map((item) => (
                  <div key={item.arrival_id} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#fff',
                            fontSize: '1rem',
                          }}
                        >
                          {item.student_name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.student_name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            {item.student_email}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          background: 'rgba(245,158,11,0.15)',
                          color: '#fcd34d',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        PENDING
                      </span>
                    </div>

                    <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {[
                        { label: 'Table', value: item.table_id },
                        { label: 'Seat', value: item.seat_number },
                        { label: 'Date', value: item.booking_date?.slice(0, 10) },
                        { label: 'Time', value: `${item.start_time} – ${item.end_time}` },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            padding: '0.6rem 0.75rem',
                          }}
                        >
                          <div
                            style={{
                              color: '#64748b',
                              fontSize: '0.72rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {label}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.15rem' }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="stacked-form" style={{ gap: '0.75rem' }}>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => handleConfirm(item.booking_id)}
                        disabled={loading}
                      >
                        ✓ Confirm Present
                      </button>
                      <button
                        type="button"
                        className="button button-danger"
                        onClick={() => handleNoShow(item.booking_id)}
                        disabled={loading}
                      >
                        ✗ No Show
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {tab === 'fines' &&
            (unpaidFines.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✓</div>
                <div style={{ fontWeight: 600 }}>No unpaid fines</div>
              </div>
            ) : (
              <div className="grid-auto" style={{ gap: '1rem' }}>
                {unpaidFines.map((fine) => (
                  <div
                    key={fine.fine_id}
                    style={{ ...cardStyle, borderColor: 'rgba(245,158,11,0.2)' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(245,158,11,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#fcd34d',
                            fontSize: '1rem',
                          }}
                        >
                          {fine.student_name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{fine.student_name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            {fine.student_email}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Outfit',sans-serif",
                          fontWeight: 800,
                          fontSize: '1.3rem',
                          color: '#fcd34d',
                        }}
                      >
                        LKR {fine.amount}
                      </div>
                    </div>
                    <div
                      style={{
                        background: 'rgba(245,158,11,0.08)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.75rem',
                        color: '#fbbf24',
                        fontSize: '0.85rem',
                        marginBottom: '1rem',
                      }}
                    >
                      {fine.reason}
                    </div>
                    <button
                      type="button"
                      className="button button-primary"
                      style={{ width: '100%' }}
                      onClick={() => handleConfirmPayment(fine.fine_id)}
                      disabled={loading}
                    >
                      ✓ Confirm Payment Received
                    </button>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
