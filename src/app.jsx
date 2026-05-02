import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = {
  cream: "#F5F0E8",
  parchment: "#EDE4D0",
  darkGreen: "#1C3A2E",
  forest: "#2D5A45",
  gold: "#B8960C",
  goldLight: "#D4AF37",
  ink: "#1A1A14",
  muted: "#6B6B5A",
  border: "#C8B99A",
  white: "#FDFAF4",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:wght@300;400;500;600&display=swap');`;

const DEFAULT_SUBJECTS = [
  { id: 1, name: "Analyse", color: "#1C3A2E", sessions: 0, target: 10 },
  { id: 2, name: "Math App", color: "#2D5A45", sessions: 0, target: 8 },
  { id: 3, name: "Thermodynamique", color: "#4A3728", sessions: 0, target: 8 },
  { id: 4, name: "Électronique", color: "#2C3E50", sessions: 0, target: 7 },
  { id: 5, name: "Probabilités", color: "#3D2B1F", sessions: 0, target: 9 },
  { id: 6, name: "Électromagnétisme", color: "#1A2E3A", sessions: 0, target: 8 },
];

const POMODORO_DURATION = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

// ─── Storage helpers ────────────────────────────────────────────────────────
const storage = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: COLORS.cream,
    fontFamily: "'EB Garamond', Georgia, serif",
    color: COLORS.ink,
  },
  sidebar: {
    width: 220,
    background: COLORS.darkGreen,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: "0",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  sidebarLogo: {
    padding: "32px 24px 24px",
    borderBottom: `1px solid rgba(255,255,255,0.1)`,
  },
  sidebarLogoTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.goldLight,
    margin: 0,
    letterSpacing: "0.02em",
  },
  sidebarLogoSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  navItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 24px",
    cursor: "pointer",
    background: active ? "rgba(212,175,55,0.15)" : "transparent",
    borderLeft: active ? `3px solid ${COLORS.goldLight}` : "3px solid transparent",
    color: active ? COLORS.goldLight : "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontFamily: "'EB Garamond', serif",
    letterSpacing: "0.03em",
    transition: "all 0.2s",
    userSelect: "none",
  }),
  main: {
    marginLeft: 220,
    padding: "40px 48px",
    minHeight: "100vh",
  },
  pageTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 32,
    fontWeight: 700,
    color: COLORS.darkGreen,
    marginBottom: 4,
    letterSpacing: "-0.01em",
  },
  pageSubtitle: {
    fontSize: 15,
    color: COLORS.muted,
    fontStyle: "italic",
    marginBottom: 36,
  },
  card: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    padding: "24px 28px",
    boxShadow: "0 1px 8px rgba(28,58,46,0.06)",
  },
  btn: (variant = "primary") => ({
    padding: "9px 22px",
    borderRadius: 3,
    border: variant === "primary" ? "none" : `1px solid ${COLORS.border}`,
    background: variant === "primary" ? COLORS.darkGreen : "transparent",
    color: variant === "primary" ? COLORS.goldLight : COLORS.muted,
    fontFamily: "'EB Garamond', serif",
    fontSize: 14,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  input: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 3,
    padding: "9px 14px",
    fontFamily: "'EB Garamond', serif",
    fontSize: 15,
    background: COLORS.white,
    color: COLORS.ink,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  label: {
    fontSize: 12,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: COLORS.muted,
    display: "block",
    marginBottom: 6,
    fontFamily: "'EB Garamond', serif",
  },
  divider: {
    border: "none",
    borderTop: `1px solid ${COLORS.border}`,
    margin: "24px 0",
  },
  badge: (color) => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 2,
    background: color + "22",
    color: color,
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontFamily: "'EB Garamond', serif",
  }),
};

// ─── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    const users = storage.get("sv_users") || {};
    if (mode === "signup") {
      if (!name || !email || !password) return setError("All fields are required.");
      if (users[email]) return setError("Account already exists.");
      users[email] = { name, email, password, subjects: DEFAULT_SUBJECTS, sessions: [], schedule: [] };
      storage.set("sv_users", users);
      onLogin(users[email]);
    } else {
      if (!users[email] || users[email].password !== password) return setError("Invalid credentials.");
      onLogin(users[email]);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.darkGreen,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'EB Garamond', serif",
    }}>
      <div style={{
        background: COLORS.cream,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 6,
        padding: "48px 52px",
        width: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.darkGreen,
            letterSpacing: "0.02em",
          }}>StudyVault</div>
          <div style={{
            fontSize: 11,
            color: COLORS.muted,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginTop: 4,
          }}>Your academic sanctum</div>
          <div style={{
            width: 40,
            height: 2,
            background: COLORS.goldLight,
            margin: "14px auto 0",
            borderRadius: 1,
          }} />
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: `1px solid ${COLORS.border}` }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1,
              padding: "9px 0",
              background: "none",
              border: "none",
              borderBottom: mode === m ? `2px solid ${COLORS.darkGreen}` : "2px solid transparent",
              fontFamily: "'EB Garamond', serif",
              fontSize: 14,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: mode === m ? COLORS.darkGreen : COLORS.muted,
              cursor: "pointer",
              marginBottom: -1,
            }}>{m === "login" ? "Sign In" : "Register"}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "signup" && (
            <div>
              <label style={S.label}>Full Name</label>
              <input style={S.input} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label style={S.label}>Email</label>
            <input style={S.input} placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          {error && <div style={{ color: "#8B2020", fontSize: 13, fontStyle: "italic" }}>{error}</div>}
          <button onClick={handleSubmit} style={{
            ...S.btn("primary"),
            width: "100%",
            padding: "12px",
            marginTop: 4,
            fontSize: 13,
          }}>
            {mode === "login" ? "Enter the Vault" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ user, subjects }) {
  const totalSessions = subjects.reduce((a, s) => a + s.sessions, 0);
  const totalTarget = subjects.reduce((a, s) => a + s.target, 0);
  const overallPct = totalTarget ? Math.round((totalSessions / totalTarget) * 100) : 0;
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <div style={S.pageTitle}>Good day, {user.name.split(" ")[0]}.</div>
      <div style={S.pageSubtitle}>{today} — steady progress is the mark of discipline.</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        {[
          { label: "Total Sessions", value: totalSessions, sub: "completed" },
          { label: "Overall Progress", value: `${overallPct}%`, sub: "of targets" },
          { label: "Subjects", value: subjects.length, sub: "being tracked" },
        ].map(stat => (
          <div key={stat.label} style={{ ...S.card, textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: COLORS.darkGreen }}>{stat.value}</div>
            <div style={{ fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.muted, marginTop: 2 }}>{stat.label}</div>
            <div style={{ fontSize: 12, color: COLORS.border, marginTop: 2 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: COLORS.darkGreen, marginBottom: 20 }}>Subject Progress</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {subjects.map(sub => {
            const pct = Math.min(100, Math.round((sub.sessions / sub.target) * 100));
            return (
              <div key={sub.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 15 }}>{sub.name}</span>
                  <span style={{ fontSize: 13, color: COLORS.muted }}>{sub.sessions}/{sub.target} sessions</span>
                </div>
                <div style={{ height: 6, background: COLORS.parchment, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: pct >= 100 ? COLORS.gold : COLORS.forest,
                    borderRadius: 3,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Subjects ────────────────────────────────────────────────────────────────
function Subjects({ subjects, setSubjects }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState(10);

  const addSubject = () => {
    if (!newName.trim()) return;
    const colors = [COLORS.darkGreen, COLORS.forest, "#4A3728", "#2C3E50", "#3D2B1F", "#1A2E3A"];
    const sub = { id: Date.now(), name: newName.trim(), color: colors[subjects.length % colors.length], sessions: 0, target: parseInt(newTarget) || 10 };
    setSubjects([...subjects, sub]);
    setNewName(""); setNewTarget(10); setAdding(false);
  };

  const increment = (id) => setSubjects(subjects.map(s => s.id === id ? { ...s, sessions: s.sessions + 1 } : s));
  const decrement = (id) => setSubjects(subjects.map(s => s.id === id && s.sessions > 0 ? { ...s, sessions: s.sessions - 1 } : s));
  const remove = (id) => setSubjects(subjects.filter(s => s.id !== id));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <div style={S.pageTitle}>Subjects</div>
          <div style={S.pageSubtitle}>Track each discipline with intention.</div>
        </div>
        <button onClick={() => setAdding(!adding)} style={S.btn("primary")}>+ Add Subject</button>
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 24, display: "flex", gap: 16, alignItems: "flex-end" }}>
          <div style={{ flex: 2 }}>
            <label style={S.label}>Subject Name</label>
            <input style={S.input} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Analyse" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Target Sessions</label>
            <input style={S.input} type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} />
          </div>
          <button onClick={addSubject} style={S.btn("primary")}>Save</button>
          <button onClick={() => setAdding(false)} style={S.btn("ghost")}>Cancel</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {subjects.map(sub => {
          const pct = Math.min(100, Math.round((sub.sessions / sub.target) * 100));
          return (
            <div key={sub.id} style={{ ...S.card, borderLeft: `4px solid ${sub.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: COLORS.darkGreen }}>{sub.name}</div>
                <button onClick={() => remove(sub.id)} style={{ background: "none", border: "none", color: COLORS.border, cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
              <div style={{ height: 5, background: COLORS.parchment, borderRadius: 3, marginBottom: 14 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: sub.color, borderRadius: 3 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: COLORS.muted }}>{sub.sessions} / {sub.target} sessions • {pct}%</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => decrement(sub.id)} style={{ ...S.btn("ghost"), padding: "4px 12px" }}>−</button>
                  <button onClick={() => increment(sub.id)} style={{ ...S.btn("primary"), padding: "4px 12px" }}>+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Planner ─────────────────────────────────────────────────────────────────
function Planner({ subjects, schedule, setSchedule }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [form, setForm] = useState({ day: "Monday", subjectId: subjects[0]?.id, time: "09:00", note: "" });
  const [adding, setAdding] = useState(false);

  const addBlock = () => {
    const sub = subjects.find(s => s.id === parseInt(form.subjectId));
    if (!sub) return;
    setSchedule([...schedule, { id: Date.now(), ...form, subjectId: parseInt(form.subjectId), subjectName: sub.name, subjectColor: sub.color }]);
    setAdding(false);
  };

  const removeBlock = (id) => setSchedule(schedule.filter(b => b.id !== id));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <div style={S.pageTitle}>Weekly Planner</div>
          <div style={S.pageSubtitle}>Structure is the foundation of mastery.</div>
        </div>
        <button onClick={() => setAdding(!adding)} style={S.btn("primary")}>+ Schedule Block</button>
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 28 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 18, color: COLORS.darkGreen }}>New Study Block</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={S.label}>Day</label>
              <select style={S.input} value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>
                {days.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Subject</label>
              <select style={S.input} value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Time</label>
              <input type="time" style={S.input} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Note (optional)</label>
            <input style={S.input} placeholder="e.g. Chapter 4 exercises" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addBlock} style={S.btn("primary")}>Add Block</button>
            <button onClick={() => setAdding(false)} style={S.btn("ghost")}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
        {days.map(day => {
          const blocks = schedule.filter(b => b.day === day).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={day}>
              <div style={{
                fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                color: COLORS.muted, marginBottom: 10, fontFamily: "'EB Garamond', serif",
              }}>{day.slice(0, 3)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {blocks.length === 0 && (
                  <div style={{ height: 48, border: `1px dashed ${COLORS.border}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: COLORS.border, fontSize: 18 }}>·</span>
                  </div>
                )}
                {blocks.map(b => (
                  <div key={b.id} style={{
                    background: b.subjectColor + "18",
                    border: `1px solid ${b.subjectColor}44`,
                    borderLeft: `3px solid ${b.subjectColor}`,
                    borderRadius: 3,
                    padding: "8px 10px",
                    position: "relative",
                  }}>
                    <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.05em" }}>{b.time}</div>
                    <div style={{ fontSize: 12, color: COLORS.darkGreen, fontWeight: 500, marginTop: 2 }}>{b.subjectName}</div>
                    {b.note && <div style={{ fontSize: 10, color: COLORS.muted, fontStyle: "italic", marginTop: 2 }}>{b.note}</div>}
                    <button onClick={() => removeBlock(b.id)} style={{
                      position: "absolute", top: 4, right: 6,
                      background: "none", border: "none", color: COLORS.border, cursor: "pointer", fontSize: 12, padding: 0,
                    }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pomodoro ────────────────────────────────────────────────────────────────
function Pomodoro({ subjects, setSubjects, sessions, setSessions }) {
  const [mode, setMode] = useState("work");
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
  const [running, setRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || null);
  const [rounds, setRounds] = useState(0);
  const intervalRef = useRef(null);

  const durations = { work: POMODORO_DURATION, short: SHORT_BREAK, long: LONG_BREAK };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === "work") {
              const sub = subjects.find(s => s.id === parseInt(selectedSubject));
              if (sub) {
                setSubjects(prev => prev.map(s => s.id === sub.id ? { ...s, sessions: s.sessions + 1 } : s));
                setSessions(prev => [...prev, {
                  id: Date.now(),
                  subject: sub.name,
                  date: new Date().toLocaleDateString(),
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                }]);
              }
              setRounds(r => r + 1);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode, selectedSubject]);

  const switchMode = (m) => { setMode(m); setTimeLeft(durations[m]); setRunning(false); };
  const reset = () => { setTimeLeft(durations[mode]); setRunning(false); };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const pct = ((durations[mode] - timeLeft) / durations[mode]) * 100;
  const circumference = 2 * Math.PI * 80;

  return (
    <div>
      <div style={S.pageTitle}>Pomodoro</div>
      <div style={S.pageSubtitle}>Focus in intervals. Rest with intention.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
            {[["work", "Focus"], ["short", "Short Break"], ["long", "Long Break"]].map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                padding: "6px 14px", borderRadius: 2, border: `1px solid ${COLORS.border}`,
                background: mode === m ? COLORS.darkGreen : "transparent",
                color: mode === m ? COLORS.goldLight : COLORS.muted,
                fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase",
                fontFamily: "'EB Garamond', serif", cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>

          <div style={{ position: "relative", display: "inline-block", marginBottom: 28 }}>
            <svg width={180} height={180} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={90} cy={90} r={80} fill="none" stroke={COLORS.parchment} strokeWidth={6} />
              <circle cx={90} cy={90} r={80} fill="none" stroke={mode === "work" ? COLORS.forest : COLORS.gold}
                strokeWidth={6} strokeDasharray={circumference}
                strokeDashoffset={circumference - (pct / 100) * circumference}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700,
              color: COLORS.darkGreen, letterSpacing: "0.02em",
            }}>{mins}:{secs}</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Studying</label>
            <select style={{ ...S.input, textAlign: "center" }} value={selectedSubject} onChange={e => setSelectedSubject(parseInt(e.target.value))}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => setRunning(!running)} style={{ ...S.btn("primary"), padding: "10px 32px", fontSize: 14 }}>
              {running ? "Pause" : timeLeft === durations[mode] ? "Start" : "Resume"}
            </button>
            <button onClick={reset} style={S.btn("ghost")}>Reset</button>
          </div>

          <div style={{ marginTop: 20, fontSize: 13, color: COLORS.muted }}>
            Rounds completed today: <strong>{rounds}</strong>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: COLORS.darkGreen, marginBottom: 18 }}>Session Log</div>
          {sessions.length === 0 ? (
            <div style={{ color: COLORS.muted, fontStyle: "italic", fontSize: 14 }}>No sessions recorded yet. Complete a Pomodoro to log your first.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
              {[...sessions].reverse().map(s => (
                <div key={s.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", background: COLORS.parchment, borderRadius: 3,
                }}>
                  <div>
                    <div style={{ fontSize: 14, color: COLORS.darkGreen }}>{s.subject}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>{s.date}</div>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.muted }}>{s.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "subjects", label: "Subjects", icon: "◉" },
  { id: "planner", label: "Planner", icon: "◫" },
  { id: "pomodoro", label: "Pomodoro", icon: "◷" },
];

export default function App() {
  const [user, setUser] = useState(() => storage.get("sv_session"));
  const [page, setPage] = useState("dashboard");

  const [subjects, setSubjects] = useState(() => {
    const u = storage.get("sv_session");
    return u?.subjects || DEFAULT_SUBJECTS;
  });
  const [schedule, setSchedule] = useState(() => {
    const u = storage.get("sv_session");
    return u?.schedule || [];
  });
  const [sessions, setSessions] = useState(() => {
    const u = storage.get("sv_session");
    return u?.sessions || [];
  });

  useEffect(() => {
    if (!user) return;
    const updated = { ...user, subjects, schedule, sessions };
    storage.set("sv_session", updated);
    const users = storage.get("sv_users") || {};
    if (users[user.email]) {
      users[user.email] = { ...users[user.email], subjects, schedule, sessions };
      storage.set("sv_users", users);
    }
  }, [subjects, schedule, sessions]);

  const handleLogin = (u) => {
    setUser(u);
    setSubjects(u.subjects || DEFAULT_SUBJECTS);
    setSchedule(u.schedule || []);
    setSessions(u.sessions || []);
    storage.set("sv_session", u);
  };

  const handleLogout = () => {
    storage.set("sv_session", null);
    setUser(null);
  };

  if (!user) return (
    <>
      <style>{FONTS}</style>
      <AuthScreen onLogin={handleLogin} />
    </>
  );

  return (
    <>
      <style>{FONTS + `* { box-sizing: border-box; } select { appearance: none; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${COLORS.parchment}; } ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }`}</style>
      <div style={{ ...S.app, display: "flex" }}>
        <div style={S.sidebar}>
          <div style={S.sidebarLogo}>
            <div style={S.sidebarLogoTitle}>StudyVault</div>
            <div style={S.sidebarLogoSub}>{user.name}</div>
          </div>
          <nav style={{ padding: "16px 0", flex: 1 }}>
            {NAV.map(n => (
              <div key={n.id} onClick={() => setPage(n.id)} style={S.navItem(page === n.id)}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <span>{n.label}</span>
              </div>
            ))}
          </nav>
          <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={handleLogout} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.4)",
              fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "'EB Garamond', serif",
            }}>Sign Out</button>
          </div>
        </div>

        <main style={S.main}>
          {page === "dashboard" && <Dashboard user={user} subjects={subjects} />}
          {page === "subjects" && <Subjects subjects={subjects} setSubjects={setSubjects} />}
          {page === "planner" && <Planner subjects={subjects} schedule={schedule} setSchedule={setSchedule} />}
          {page === "pomodoro" && <Pomodoro subjects={subjects} setSubjects={setSubjects} sessions={sessions} setSessions={setSessions} />}
        </main>
      </div>
    </>
  );
}
