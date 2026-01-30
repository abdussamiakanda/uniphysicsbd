import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Building2, Medal } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('contests')
        .select('id, year')
        .order('year', { ascending: false })
      if (!error) setContests(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const latestContest = contests[0]
  const pastContests = contests.slice(1, 7)

  if (loading) {
    return (
      <div className="home-root">
        <section className="home-hero">
          <div className="home-hero-inner">
            <div className="loading-state" aria-live="polite">
              <p className="loading" style={{ color: 'var(--header-text-muted)' }}>Loading…</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="home-root">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <span className="home-hero-badge">Bangladesh</span>
          <h1 className="home-hero-title">University Physics Competition</h1>
          <p className="home-hero-lead">
            Official results and statistics for Bangladeshi teams in the UPC. Explore outcomes by year, browse by university, and view medal summaries and problem-wise rankings.
          </p>
          <div className="home-hero-cta">
            {latestContest && (
              <Link to={`/competition/${latestContest.year}`} className="btn btn-primary">
                View UPC {latestContest.year} results →
              </Link>
            )}
            <Link to="/universities" className="btn btn-ghost">
              Browse universities
            </Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="home-intro">
        <h2 className="home-intro-title">What is this site?</h2>
        <p className="home-intro-text">
          This site tracks <strong>Bangladesh-only</strong> participation in the University Physics Competition (UPC). 
          You can view team results by competition year, see statistics by problem and rank, medal summaries by university, 
          and explore each university’s UPC history and achievements.
        </p>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-features-inner">
          <h2 className="home-features-title">What you can do</h2>
          <div className="home-features-grid">
            <div className="home-feature">
              <div className="home-feature-icon" aria-hidden><BarChart3 size={24} /></div>
              <h3 className="home-feature-title">Results by year</h3>
              <p className="home-feature-desc">
                Open any UPC year to see teams, problem and rank statistics, and medal summaries for Bangladeshi institutions.
              </p>
            </div>
            <div className="home-feature">
              <div className="home-feature-icon" aria-hidden><Building2 size={24} /></div>
              <h3 className="home-feature-title">Browse by university</h3>
              <p className="home-feature-desc">
                View each university’s profile, UPC participation over the years, and team-level results and medals.
              </p>
            </div>
            <div className="home-feature">
              <div className="home-feature-icon" aria-hidden><Medal size={24} /></div>
              <h3 className="home-feature-title">Stats & medals</h3>
              <p className="home-feature-desc">
                See computed statistics by problem (Gold, Silver, Bronze, Accomplished) and medal totals by university.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest competition CTA */}
      {latestContest && (
        <section className="home-latest">
          <div className="home-latest-card">
            <div className="home-latest-content">
              <h2>UPC {latestContest.year}</h2>
              <p>View teams, statistics by problem and rank, and medal summary for the latest competition.</p>
            </div>
            <div className="home-latest-cta">
              <Link to={`/competition/${latestContest.year}`} className="btn btn-primary">
                View results →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Explore */}
      <section className="home-section">
        <div className="home-section-inner">
          <h2 className="home-section-title">Explore</h2>
          <div className="home-cards">
            <Link to="/universities" className="home-card">
              <h3 className="home-card-title">Universities</h3>
              <p className="home-card-desc">
                Browse all Bangladeshi universities in the UPC, with profiles and year-by-year achievements.
              </p>
              <p className="home-card-meta">View list →</p>
            </Link>
            {latestContest && (
              <Link to={`/competition/${latestContest.year}`} className="home-card">
                <h3 className="home-card-title">UPC {latestContest.year}</h3>
                <p className="home-card-desc">
                  Teams, problem-wise stats, and medal summary for the most recent competition.
                </p>
                <p className="home-card-meta">View results →</p>
              </Link>
            )}
            {pastContests.length > 0 && (
              <div className="home-card home-card-static">
                <h3 className="home-card-title">Past competitions</h3>
                <p className="home-card-desc">
                  Open a year from the navigation bar or use the links below.
                </p>
                <div className="home-years" style={{ pointerEvents: 'auto' }}>
                  {pastContests.map((c) => (
                    <Link key={c.id} to={`/competition/${c.year}`}>
                      {c.year}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
