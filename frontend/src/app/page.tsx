"use client";

import { type FormEvent, useEffect, useState } from "react";
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
type EvaluationResult = {
  assessment: {
    relevance: number;
    completeness: number;
    specificity: number;
    evidence: number;
    correctness: number | null;
    contradiction_detected: boolean;
    unsupported_claim_detected: boolean;
    quality: number;
  };
  decision: {
    action: string;
    difficulty: string;
    focus: string | null;
    reason: string;
    interviewer_guidance: string;
  };
};

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
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [evaluationError, setEvaluationError] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);

  async function handleEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsEvaluating(true);
    setEvaluationError("");
    setEvaluation(null);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${apiUrl}/answers/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: String(form.get("question") ?? ""),
          answer: String(form.get("answer") ?? ""),
          skill: String(form.get("skill") ?? ""),
          resume_evidence: String(form.get("resume_evidence") ?? ""),
          personality: String(form.get("personality") ?? "friendly"),
          difficulty: String(form.get("difficulty") ?? "medium"),
          current_question_id: "manual-evaluation",
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(typeof result.detail === "string" ? result.detail : "Answer evaluation failed.");
      }
      setEvaluation(result as EvaluationResult);
    } catch (error) {
      setEvaluationError(error instanceof Error ? error.message : "Answer evaluation failed.");
    } finally {
      setIsEvaluating(false);
    }
  }

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

          <section className="evaluation-panel" aria-labelledby="evaluation-title">
            <div className="section-heading section-heading-tight">
              <div><p className="eyebrow">LIVE API CHECK</p><h2 id="evaluation-title">Evaluate an answer</h2></div>
              <span className="muted-caption">Uses your server-side NVIDIA configuration</span>
            </div>
            <p className="panel-description">Submit a real answer for model assessment and an adaptive next-step recommendation. This is a practice check, not a full interview session.</p>
            <form className="evaluation-form" onSubmit={handleEvaluation}>
              <label className="setup-field evaluation-wide">
                <span>Interview question</span>
                <textarea name="question" required maxLength={4000} placeholder="What was the most challenging part of your project?" />
              </label>
              <label className="setup-field evaluation-wide">
                <span>Your answer</span>
                <textarea name="answer" required maxLength={12000} placeholder="Describe what you did, why, and what changed as a result." />
              </label>
              <label className="setup-field">
                <span>Skill being assessed</span>
                <input name="skill" required maxLength={80} defaultValue="Project explanation" />
              </label>
              <label className="setup-field">
                <span>Interviewer style</span>
                <select name="personality" defaultValue="friendly">
                  <option value="friendly">Friendly</option>
                  <option value="hr">HR</option>
                  <option value="strict">Strict</option>
                  <option value="technical">Technical</option>
                </select>
              </label>
              <label className="setup-field">
                <span>Current difficulty</span>
                <select name="difficulty" defaultValue="medium">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <label className="setup-field evaluation-wide">
                <span>Resume evidence <span className="optional-label">OPTIONAL</span></span>
                <textarea name="resume_evidence" maxLength={12000} placeholder="Relevant resume detail to use as context" />
              </label>
              <div className="evaluation-submit-row evaluation-wide">
                <span className="muted-caption">Your API key is used only by the Python server.</span>
                <button className="evaluate-button" type="submit" disabled={isEvaluating || apiHealth !== "online"}>
                  <Sparkles aria-hidden="true" size={15} /> {isEvaluating ? "Evaluating…" : "Evaluate answer"}
                </button>
              </div>
            </form>
            {evaluationError && <p className="evaluation-error" role="alert">{evaluationError}</p>}
            {evaluation && (
              <div className="evaluation-result" role="status" aria-live="polite">
                <div className="result-heading">
                  <div><p className="eyebrow">MODEL ASSESSMENT</p><h3>Next step: {evaluation.decision.action.replaceAll("_", " ")}</h3></div>
                  <span className="result-difficulty">Next difficulty · {evaluation.decision.difficulty}</span>
                </div>
                <p className="result-reason">{evaluation.decision.reason.replaceAll("_", " ")}{evaluation.decision.focus ? ` · Focus: ${evaluation.decision.focus.replaceAll("_", " ")}` : ""}</p>
                <div className="assessment-grid">
                  {([
                    ["Relevance", evaluation.assessment.relevance],
                    ["Completeness", evaluation.assessment.completeness],
                    ["Specificity", evaluation.assessment.specificity],
                    ["Evidence", evaluation.assessment.evidence],
                    ["Correctness", evaluation.assessment.correctness],
                    ["Answer quality", evaluation.assessment.quality],
                    ["Contradiction", evaluation.assessment.contradiction_detected],
                    ["Unsupported claim", evaluation.assessment.unsupported_claim_detected],
                  ] as const).map(([label, value]) => (
                    <div className="assessment-metric" key={label}>
                      <span>{label}</span>
                      <strong>
                        {typeof value === "boolean"
                          ? value ? "Detected" : "Not detected"
                          : value === null ? "Not assessed" : `${Math.round(value * 100)}%`}
                      </strong>
                    </div>
                  ))}
                </div>
                <p className="guidance-note">{evaluation.decision.interviewer_guidance} Training feedback only; not a hiring prediction.</p>
              </div>
            )}
          </section>

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
