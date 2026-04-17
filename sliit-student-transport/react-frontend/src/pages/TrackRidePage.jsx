import PageHeader from '../components/PageHeader';

const timeline = [
  { time: '08:00', label: 'Driver accepted your ride' },
  { time: '08:10', label: 'Driver is on the way' },
  { time: '08:20', label: 'Pickup completed' },
  { time: '08:45', label: 'Estimated arrival at campus' }
];

export default function TrackRidePage() {
  return (
    <>
      <PageHeader
        eyebrow="Live Trip"
        title="Track Ride"
        subtitle="Follow the ride status, timing, and driver progress from one screen."
      />

      <section className="section-block">
        <div className="container track-grid">
          <div className="surface map-card track-map-card">
            <div className="map-visual track-map">
              <div className="map-grid-lines" />
              <div className="track-route route-a" />
              <div className="track-route route-b" />
              <div className="map-campus-marker campus-a">Pickup</div>
              <div className="map-campus-marker campus-b">Campus</div>
            </div>
          </div>

          <div className="surface dashboard-panel">
            <h2>Ride Progress</h2>
            <div className="timeline">
              {timeline.map((event, index) => (
                <div key={event.label} className="timeline-item">
                  <span className="timeline-time">{event.time}</span>
                  <span className={`timeline-dot ${index === timeline.length - 1 ? 'current' : ''}`} />
                  <p>{event.label}</p>
                </div>
              ))}
            </div>
            <div className="callout-box subtle">
              <strong>Status</strong>
              <p>Driver is currently en route to the campus with live tracking enabled.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}