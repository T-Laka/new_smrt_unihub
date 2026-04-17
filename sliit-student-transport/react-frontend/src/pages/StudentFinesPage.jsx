import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { readStoredUser } from '../lib/auth';

export default function StudentFinesPage() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = readStoredUser();

  useEffect(() => {
    if (user) {
      fetchFines();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchFines() {
    try {
      setLoading(true);
      const userId = user._id || user.id;
      const results = await apiRequest(`/api/fines/user/${userId}`);
      setFines(results);
    } catch (err) {
      setError(err.message || 'Failed to load fines');
    } finally {
      setLoading(false);
    }
  }

  const unpaidFines = fines.filter((fine) => fine.status === 'unpaid');
  const paidFines = fines.filter((fine) => fine.status === 'paid');
  const totalUnpaid = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

  return (
    <>
      <PageHeader
        eyebrow="Study Area"
        title="My Fines"
        subtitle="View and manage your study area fines."
      />

      <section className="section-block">
        <div className="container">
          {error ? <div className="notice error">{error}</div> : null}

          {!user ? (
            <div className="surface notice info">
              Please log in to view your fines.
            </div>
          ) : loading ? (
            <div className="surface notice info">
              Loading fines...
            </div>
          ) : fines.length === 0 ? (
            <div className="surface notice success">
              ✅ No fines! You can freely book study seats.
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="surface" style={{ padding: '1.5rem', borderLeft: '4px solid #fcd34d' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fcd34d' }}>Rs. {totalUnpaid}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Total Unpaid</div>
                </div>

                <div className="surface" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{unpaidFines.length}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Unpaid Fines</div>
                </div>

                <div className="surface" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{paidFines.length}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Paid Fines</div>
                </div>
              </div>

              {/* Unpaid Fines Section */}
              {unpaidFines.length > 0 && (
                <div className="surface" style={{ marginBottom: '2rem' }}>
                  <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Unpaid Fines ({unpaidFines.length})</h2>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {unpaidFines.map((fine) => (
                      <div key={fine._id} styles={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>Rs. {fine.amount}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{fine.reason}</div>
                          </div>
                          <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                            UNPAID
                          </span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          Created: {new Date(fine.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
                    ⚠️ <strong>Warning:</strong> You cannot book new seats until all fines are paid. Contact your admin to process payment.
                  </div>
                </div>
              )}

              {/* Paid Fines Section */}
              {paidFines.length > 0 && (
                <div className="surface">
                  <h2 style={{ color: '#10b981', marginBottom: '1rem' }}>✅ Paid Fines ({paidFines.length})</h2>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {paidFines.map((fine) => (
                      <div key={fine._id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>Rs. {fine.amount}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{fine.reason}</div>
                          </div>
                          <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                            PAID
                          </span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          Paid: {new Date(fine.paidAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
