import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { rideMatches } from '../data/siteData';
import { isFutureOrToday } from '../lib/validation';

export default function FindRidePage() {
  const [search, setSearch] = useState({ pickup: '', drop: '', date: '', time: '', passengers: '1' });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    pickup: !search.pickup.trim() ? 'Pickup location is required.' : search.pickup.trim().length < 3 ? 'Enter a more specific pickup point.' : '',
    drop: !search.drop.trim() ? 'Drop location is required.' : search.drop.trim().length < 3 ? 'Enter a more specific destination.' : '',
    date: !search.date ? 'Date is required.' : !isFutureOrToday(search.date) ? 'Date cannot be in the past.' : '',
    time: !search.time ? 'Time is required.' : '',
    passengers: Number(search.passengers) < 1 ? 'At least one passenger is required.' : ''
  };

  const isFormValid = Object.values(errors).every((value) => !value);

  function touchField(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  const filteredRides = useMemo(() => {
    const query = `${search.pickup} ${search.drop}`.trim().toLowerCase();

    if (!query) {
      return rideMatches;
    }

    return rideMatches.filter((ride) => ride.route.toLowerCase().includes(query) || ride.driver.toLowerCase().includes(query));
  }, [search]);

  function handleSubmit(event) {
    event.preventDefault();

    setTouched({ pickup: true, drop: true, date: true, time: true, passengers: true });

    if (!isFormValid) {
      setSubmitted(false);
      return;
    }

    setSubmitted(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Ride Search"
        title="Find a Ride"
        subtitle="Tell us where you're going and we'll match you with a driver."
      />

      <section className="section-block">
        <div className="container layout-two-col">
          <form className="surface form-card" onSubmit={handleSubmit}>
            <h2>Search Available Rides</h2>
            <p className="form-note">Fill in your trip details to find the best match.</p>

            {submitted ? <div className="notice success">Search preferences saved. Matching rides are shown on the right.</div> : null}

            <div className="field-grid two-col">
              <label>
                <span className="field-label-row">Pickup Location</span>
                <input
                  type="text"
                  value={search.pickup}
                  onChange={(event) => setSearch((current) => ({ ...current, pickup: event.target.value }))}
                  onBlur={() => touchField('pickup')}
                  placeholder="e.g., Kaduwela"
                  className={touched.pickup && errors.pickup ? 'input-error' : ''}
                />
                {touched.pickup && errors.pickup ? <span className="field-error">{errors.pickup}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Drop Location</span>
                <input
                  type="text"
                  value={search.drop}
                  onChange={(event) => setSearch((current) => ({ ...current, drop: event.target.value }))}
                  onBlur={() => touchField('drop')}
                  placeholder="e.g., SLIIT Malabe"
                  className={touched.drop && errors.drop ? 'input-error' : ''}
                />
                {touched.drop && errors.drop ? <span className="field-error">{errors.drop}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Date</span>
                <input
                  type="date"
                  value={search.date}
                  onChange={(event) => setSearch((current) => ({ ...current, date: event.target.value }))}
                  onBlur={() => touchField('date')}
                  className={touched.date && errors.date ? 'input-error' : ''}
                />
                {touched.date && errors.date ? <span className="field-error">{errors.date}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Time</span>
                <input
                  type="time"
                  value={search.time}
                  onChange={(event) => setSearch((current) => ({ ...current, time: event.target.value }))}
                  onBlur={() => touchField('time')}
                  className={touched.time && errors.time ? 'input-error' : ''}
                />
                {touched.time && errors.time ? <span className="field-error">{errors.time}</span> : null}
              </label>
            </div>

            <label>
              <span className="field-label-row">Number of Passengers</span>
              <select
                value={search.passengers}
                onChange={(event) => setSearch((current) => ({ ...current, passengers: event.target.value }))}
                onBlur={() => touchField('passengers')}
              >
                <option value="1">1 Passenger</option>
                <option value="2">2 Passengers</option>
                <option value="3">3 Passengers</option>
                <option value="4">4 Passengers</option>
              </select>
              {touched.passengers && errors.passengers ? <span className="field-error">{errors.passengers}</span> : null}
            </label>

            <button type="submit" className="button button-primary button-full" disabled={!isFormValid}>
              Search Rides
            </button>
          </form>

          <div className="results-column">
            <div className="surface results-summary">
              <h2>Matching Rides</h2>
              <p>{filteredRides.length} rides available for your request.</p>
            </div>

            <div className="card-stack">
              {filteredRides.map((ride) => (
                <article key={`${ride.driver}-${ride.time}`} className="surface card ride-card">
                  <div>
                    <span className="pill">{ride.type}</span>
                    <h3>{ride.driver}</h3>
                    <p>{ride.route}</p>
                  </div>

                  <div className="ride-meta">
                    <span>{ride.time}</span>
                    <strong>{ride.price}</strong>
                    <span>{ride.seats} seats left</span>
                  </div>

                  <div className="card-actions">
                    <button type="button" className="button button-primary button-small">Request Ride</button>
                    <button type="button" className="button button-ghost button-small">View Profile</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}