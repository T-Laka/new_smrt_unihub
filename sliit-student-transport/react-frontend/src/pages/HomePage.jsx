import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import DriverMapPreview from '../components/DriverMapPreview';
import { featureCards, featuredDrivers, heroStats } from '../data/siteData';

export default function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-badge">🎓 For SLIIT Students Only</span>
            <h1>Your Campus, <span>Your Ride.</span></h1>
            <p>
              Connect with fellow SLIIT students for safe, affordable, and shared rides to and from campus.
            </p>
            <div className="hero-actions">
              <Link to="/find-ride" className="button button-primary">Search Rides</Link>
            <Link to="/events" className="button button-secondary">Browse Events</Link>
            </div>

            <div className="hero-pill">
              <div className="avatar-stack" aria-hidden="true">
                <span>👨‍🎓</span>
                <span>👩‍🎓</span>
                <span>👨‍🎓</span>
              </div>
              <p><strong>1,200+ students</strong> already riding together</p>
            </div>
          </div>

          <div className="hero-panel surface">
            <div className="hero-panel-header">
              <span>Live overview</span>
              <span className="pulse-badge">Online</span>
            </div>
            <div className="mini-stat-grid">
              {heroStats.map((stat) => (
                <div key={stat.label} className="mini-stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container quick-search surface">
        <div className="field-grid">
          <label>
            Pickup Location
            <input type="text" placeholder="Your location or area" />
          </label>
          <label>
            Destination
            <input type="text" placeholder="SLIIT or drop-off point" />
          </label>
          <label>
            Date & Time
            <input type="datetime-local" />
          </label>
        </div>
        <Link to="/find-ride" className="button button-primary">Search Rides</Link>
      </section>

      <section className="section-block">
        <div className="container section-heading">
          <div>
            <span className="section-kicker">Live Map</span>
            <h2>Driver activity near campus</h2>
          </div>
          <p>See active drivers around SLIIT Malabe before you book a ride.</p>
        </div>
        <div className="container">
          <DriverMapPreview />
        </div>
      </section>

      <section className="section-block muted-section">
        <div className="container stats-grid">
          {heroStats.map((stat) => (
            <article key={stat.label} className="stat-card surface">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="container section-heading">
          <div>
            <span className="section-kicker">Nearby Drivers</span>
            <h2>Available right now, close to you</h2>
          </div>
          <Link to="/find-ride" className="button button-small button-primary">View All Drivers</Link>
        </div>

        <div className="container card-grid driver-grid">
          {featuredDrivers.map((driver) => (
            <article key={driver.name} className="surface card driver-card">
              <div className="driver-accent" style={{ background: driver.color }} />
              <div className="driver-avatar">{driver.emoji}</div>
              <h3>{driver.name}</h3>
              <p className="muted">{driver.vehicle}</p>
              <div className="driver-meta">
                <span className="pill success">Online</span>
                <span className="pill">{driver.distance}</span>
              </div>
              <Link to="/find-ride" className="button button-primary button-full">Request Ride</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block muted-section">
        <div className="container section-heading center">
          <div>
            <span className="section-kicker">Why Choose Us</span>
            <h2>Everything you need for a safer campus commute</h2>
          </div>
          <p>Built around verified students, shared costs, and quick matching.</p>
        </div>

        <div className="container card-grid feature-grid">
          {featureCards.map((feature) => (
            <article key={feature.title} className="surface card feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}