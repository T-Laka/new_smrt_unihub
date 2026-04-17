import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function NotFoundPage() {
  return (
    <>
      <PageHeader
        eyebrow="404"
        title="Page not found"
        subtitle="The route you requested does not exist in the React frontend."
      />

      <section className="section-block">
        <div className="container surface form-card center-card">
          <p>Return to the homepage or use the navbar to continue.</p>
          <Link to="/" className="button button-primary">Go Home</Link>
        </div>
      </section>
    </>
  );
}