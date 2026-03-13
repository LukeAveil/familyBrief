
export default function HomePage() {
  return (
    <main className="home-hero">
      <div className="home-hero-card">
        <div className="ob-step" style={{ gap: 20 }}>
          <div className="ob-icon">🗓️</div>
          <h1 className="ob-title">FamilyBrief</h1>
          <p className="ob-subtitle">
            Turn chaotic school and activity emails into a calm, shared family calendar and a Sunday briefing.
          </p>
          <ul className="ob-benefits">
            <li><span>✉</span> Forward school emails — we turn them into calendar events</li>
            <li><span>📅</span> Colour-coded calendar for every family member</li>
            <li><span>☀️</span> Sunday morning briefings so no one is surprised</li>
          </ul>
          <div className="ob-actions">
            <a href="/auth" className="ob-btn-primary ob-btn-cta">
              Get started — it’s free while in beta
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
