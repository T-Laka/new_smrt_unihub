import PageHeader from '../components/PageHeader';

export default function DashboardTestPage() {
  return (
    <>
      <PageHeader
        eyebrow="Debug"
        title="Dashboard Test"
        subtitle="Use this page to verify dashboard styling and layout behaviour."
      />

      <section className="section-block">
        <div className="container card-grid">
          <article className="surface card">
            <h2>Connections</h2>
            <p>Check auth state, socket events, and API responses here.</p>
          </article>
          <article className="surface card">
            <h2>Layout</h2>
            <p>Validate sidebar, cards, and responsive breakpoints.</p>
          </article>
          <article className="surface card">
            <h2>Routing</h2>
            <p>Confirm each React route opens the expected page shell.</p>
          </article>
        </div>
      </section>
    </>
  );
}