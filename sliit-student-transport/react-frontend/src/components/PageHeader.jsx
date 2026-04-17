export default function PageHeader({ title, subtitle, eyebrow }) {
  return (
    <section className="page-header">
      <div className="container page-header-inner">
        {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </section>
  );
}