"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  Clock3,
  Code2,
  FileText,
  Gauge,
  LayoutDashboard,
  Mic2,
  Plus,
  Settings2,
  Sparkles,
  Target,
} from "lucide-react";

type ApiHealth = "checking" | "online" | "offline";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const navigation = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Practice setup", href: "#practice", icon: BrainCircuit },
  { label: "Progress", href: "#progress", icon: Gauge },
];

const skillRows = [
  { name: "Technical reasoning", icon: Code2 },
  { name: "Communication", icon: Mic2 },
  { name: "Behavioral answers", icon: BriefcaseBusiness },
  { name: "Resume knowledge", icon: FileText },
];

export default function Home() {
  const [apiHealth, setApiHealth] = useState<ApiHealth>("checking");
  const [activeNavigation, setActiveNavigation] = useState("Overview");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${apiUrl}/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("API health check failed");
        return response.json();
      })
      .then((health: { status?: string }) => {
        setApiHealth(health.status === "ok" ? "online" : "offline");
      })
      .catch(() => {
        if (!controller.signal.aborted) setApiHealth("offline");
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="workspace-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand-lockup" href="#overview" aria-label="Round One home">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span className="brand-name">round one<span>INTERVIEW STUDIO</span></span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="main-nav">
          {navigation.map(({ label, href, icon: Icon }) => (
            <a
              aria-current={activeNavigation === label ? "page" : undefined}
              className={`nav-link ${activeNavigation === label ? "is-active" : ""}`}
              href={href}
              key={label}
              onClick={() => setActiveNavigation(label)}
            >
              <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Practice setup" && <ArrowUpRight aria-hidden="true" className="nav-trailing" size={14} />}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-label">YOUR PROFILE</div>
          <div className="profile-row">
            <div className="profile-avatar" aria-hidden="true">S</div>
            <div className="profile-copy"><strong>Practice profile</strong><span>Local workspace</span></div>
            <ChevronDown aria-hidden="true" size={15} />
          </div>
          <button className="icon-button settings-button" type="button" aria-label="Settings are not available yet" disabled>
            <Settings2 aria-hidden="true" size={16} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>Overview</strong></div>
          <div className={`api-status api-${apiHealth}`} role="status" aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            {apiHealth === "checking" ? "Checking API" : apiHealth === "online" ? "API connected" : "API offline"}
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">YOUR TRAINING DESK <span className="eyebrow-line" /></p>
              <h1>Practice with a point of view.</h1>
              <p className="heading-subtitle">Build interview readiness one considered answer at a time.</p>
            </div>
            <a className="help-link" href="#how-it-works"><CircleHelp aria-hidden="true" size={16} /> How it works</a>
          </section>

          <section className="welcome-panel" aria-labelledby="welcome-title">
            <div className="welcome-copy">
              <span className="panel-kicker"><Sparkles aria-hidden="true" size={14} /> A FRESH START</span>
              <h2 id="welcome-title">Your first session sets the baseline.</h2>
              <p>Choose a focus and interviewer style. Your skill profile will take shape from the answers you give, not a preset score.</p>
              <a className="primary-link" href="#practice">Set up a practice session <ArrowDownRight aria-hidden="true" size={16} /></a>
            </div>
            <div className="welcome-stamp" aria-hidden="true">
              <div className="stamp-ring"><span>ONE<br />GOOD<br />ANSWER</span><ArrowDownRight size={22} /></div>
            </div>
          </section>

          <section className="snapshot-section" aria-labelledby="snapshot-title">
            <div className="section-heading">
              <div><p className="eyebrow">AT A GLANCE</p><h2 id="snapshot-title">Your snapshot</h2></div>
              <span className="muted-caption">Updates as you complete sessions</span>
            </div>
            <div className="snapshot-grid">
              <article className="metric-panel">
                <span className="metric-label">COMPLETED SESSIONS</span>
                <div className="metric-value metric-empty">—</div>
                <p>No interview history yet</p>
                <BookOpenCheck className="metric-icon coral-icon" aria-hidden="true" size={19} />
              </article>
              <article className="metric-panel">
                <span className="metric-label">STRONGEST SKILL</span>
                <div className="metric-value metric-empty">—</div>
                <p>Waiting for your first answer</p>
                <Target className="metric-icon green-icon" aria-hidden="true" size={19} />
              </article>
              <article className="metric-panel">
                <span className="metric-label">NEXT PRACTICE</span>
                <div className="metric-value metric-next">Start anywhere</div>
                <p>Adaptive focus begins with session one</p>
                <Clock3 className="metric-icon amber-icon" aria-hidden="true" size={19} />
              </article>
            </div>
          </section>

          <div className="lower-grid">
            <section className="practice-panel" id="practice" aria-labelledby="practice-title">
              <div className="section-heading section-heading-tight">
                <div><p className="eyebrow">MAKE IT YOURS</p><h2 id="practice-title">Session setup</h2></div>
                <span className="setup-number">01 <span>/ 04</span></span>
              </div>
              <p className="panel-description">Pick the shape of the conversation. The engine will adapt question by question.</p>

              <div className="setup-fields">
                <label className="setup-field">
                  <span>Interview focus</span>
                  <select defaultValue="mixed">
                    <option value="mixed">Mixed practice</option>
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="hr">HR</option>
                  </select>
                </label>
                <label className="setup-field">
                  <span>Interviewer style</span>
                  <select defaultValue="friendly">
                    <option value="friendly">Friendly</option>
                    <option value="hr">HR</option>
                    <option value="strict">Strict</option>
                    <option value="technical">Technical</option>
                  </select>
                </label>
                <label className="setup-field">
                  <span>Practice mode</span>
                  <select defaultValue="practice">
                    <option value="practice">Practice with feedback</option>
                    <option value="pressure">Pressure simulation</option>
                  </select>
                </label>
                <label className="setup-field">
                  <span>Difficulty</span>
                  <select defaultValue="adaptive">
                    <option value="adaptive">Adaptive</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </label>
              </div>

              <div className="setup-footer">
                <span className="endpoint-note"><span className="status-dot" aria-hidden="true" /> Session API not connected</span>
                <button className="start-button" type="button" disabled title="The interview session endpoint is not implemented yet">
                  <Plus aria-hidden="true" size={16} /> Start session
                </button>
              </div>
            </section>

            <section className="skills-panel" id="progress" aria-labelledby="skills-title">
              <div className="section-heading section-heading-tight">
                <div><p className="eyebrow">BUILT FROM EVIDENCE</p><h2 id="skills-title">Skill signals</h2></div>
                <span className="coming-label">NOT ASSESSED</span>
              </div>
              <p className="panel-description">Scores stay blank until the system has real answers to assess.</p>
              <div className="skill-list">
                {skillRows.map(({ name, icon: Icon }) => (
                  <div className="skill-row" key={name}>
                    <span className="skill-icon"><Icon aria-hidden="true" size={16} strokeWidth={1.8} /></span>
                    <span className="skill-name">{name}</span>
                    <span className="skill-unassessed">—</span>
                  </div>
                ))}
              </div>
              <a className="text-link" href="#practice">Choose a starting focus <ArrowUpRight aria-hidden="true" size={15} /></a>
            </section>
          </div>

          <section className="history-section" aria-labelledby="history-title">
            <div className="section-heading">
              <div><p className="eyebrow">THE LONG VIEW</p><h2 id="history-title">Practice history</h2></div>
              <span className="muted-caption">Your progress, over time</span>
            </div>
            <div className="history-empty">
              <div className="history-icon"><BookOpenCheck aria-hidden="true" size={20} /></div>
              <div><h3>Your story starts here</h3><p>Completed interviews and skill trends will appear here when session storage is connected.</p></div>
              <a className="text-link" href="#practice">Configure a session <ArrowUpRight aria-hidden="true" size={15} /></a>
            </div>
          </section>

          <footer className="page-footer" id="how-it-works">
            <span>ROUND ONE <span className="footer-dot">·</span> INTERVIEW TRAINING</span>
            <span>Feedback for practice, never a hiring prediction.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
