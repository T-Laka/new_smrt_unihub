import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useCanteen } from '../context/CanteenContext';

const features = [
  { icon: '🥗', title: 'Fresh Menus', desc: 'Discover updated menus and kitchen specials every day.' },
  { icon: '🎯', title: 'Smart Offers', desc: 'Targeted offers based on canteen and demand windows.' },
  { icon: '🛵', title: 'Live Delivery', desc: 'Track helper progress and receive timely handoff updates.' },
  { icon: '📦', title: 'Stock Aware', desc: 'See in-stock and out-of-stock status before requesting.' },
];

const quickActions = [
  {
    title: 'Food Catalog',
    desc: 'Browse items, quantities, and ready-to-order status.',
    to: '/canteen-food-stock',
    cta: 'Open Catalog',
    tone: 'primary',
    icon: '🍽️',
  },
  {
    title: 'Offer Hub',
    desc: 'Check active promotions and limited-time bundles.',
    to: '/canteen-offers',
    cta: 'View Offers',
    tone: 'secondary',
    icon: '🎁',
  },
  {
    title: 'Requests & Tracking',
    desc: 'Create, assign, and track request progress in one place.',
    to: '/canteen-requests',
    cta: 'Manage Requests',
    tone: 'ghost',
    icon: '📍',
  },
  {
    title: 'Helper Profile',
    desc: 'Enable helper mode and configure service settings.',
    to: '/helper-profile',
    cta: 'Open Profile',
    tone: 'ghost',
    icon: '🧑‍🍳',
  },
];

export default function CanteenPage() {
  const { selectedCanteen, setSelectedCanteen, canteens } = useCanteen();

  return (
    <>
      <PageHeader
        eyebrow="Campus Canteen"
        title="Canteen Experience Hub"
        subtitle="Choose your canteen, browse live stock, and move from order to delivery with full visibility."
      />

      <section className="section-block">
        <div className="container canteenx-grid">
          <article className="surface canteenx-hero">
            <div>
              <p className="canteenx-kicker">Live Campus Dining</p>
              <h2>{selectedCanteen?.name || 'Select a Canteen'} Command Center</h2>
              <p>
                Switch canteens instantly and keep your food workflow clean: check stock, apply offers,
                request support, and monitor delivery updates.
              </p>
            </div>
            <div className="canteenx-hero-cards">
              <div>
                <strong>{canteens.length}</strong>
                <span>Connected Canteens</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Request Tracking</span>
              </div>
              <div>
                <strong>Live</strong>
                <span>Stock Visibility</span>
              </div>
            </div>
          </article>

          <article className="surface canteenx-selector">
            <h2>Select Your Canteen</h2>
            <p>Switch context before you manage items, offers, or requests.</p>
            <div className="canteenx-selector-grid">
              {canteens.map((canteen) => (
                <button
                  key={canteen.id}
                  type="button"
                  onClick={() => setSelectedCanteen(canteen)}
                  className={`canteenx-selector-card ${selectedCanteen?.id === canteen.id ? 'active' : ''}`}
                >
                  <span className="canteenx-selector-title">{canteen.name}</span>
                  <span className="canteenx-selector-sub">{canteen.location}</span>
                  {selectedCanteen?.id === canteen.id && (
                    <span className="canteenx-selector-tag">Selected</span>
                  )}
                </button>
              ))}
            </div>
          </article>

          <article className="surface canteenx-actions">
            <div className="canteenx-actions-head">
              <h2>Quick Actions</h2>
              <p>
                Work on <strong>{selectedCanteen?.name || 'selected canteen'}</strong> with fast access modules.
              </p>
            </div>
            <div className="canteenx-actions-grid">
              {quickActions.map((action) => (
                <article key={action.to} className="canteenx-action-card">
                  <div className="canteenx-action-icon">{action.icon}</div>
                  <h3>{action.title}</h3>
                  <p>{action.desc}</p>
                  <Link
                    to={action.to}
                    className={`button button-small ${action.tone === 'primary' ? 'button-primary' : action.tone === 'secondary' ? 'button-secondary' : 'button-ghost'}`}
                  >
                    {action.cta}
                  </Link>
                </article>
              ))}
            </div>
          </article>

          <div className="canteenx-feature-grid">
            {features.map((f, idx) => (
              <article key={idx} className="surface canteenx-feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
