import { useState } from "react";
import { Bus, Shield, Bell, Users } from "lucide-react";

const FEATURES = [
  { icon: Bus, label: "Real-time Bus Tracking", desc: "Monitor every bus on your route network" },
  { icon: Shield, label: "Biometric Safety", desc: "Fingerprint scan when students board & alight" },
  { icon: Bell, label: "Instant Guardian Alerts", desc: "SMS notifications sent to parents automatically" },
  { icon: Users, label: "Student Management", desc: "Full enrollment and attendance records" },
];

const STOPS = [
  { cx: 22,  cy: 88, label: "Colombo",      labelY: 104 },
  { cx: 105, cy: 34, label: "Kandy",         labelY: 23  },
  { cx: 196, cy: 62, label: "Dambulla",      labelY: 77  },
  { cx: 278, cy: 30, label: "Anuradhapura",  labelY: 19  },
  { cx: 346, cy: 68, label: "Jaffna",        labelY: 83  },
];

const ROUTE_PATH =
  "M 22,88 C 58,88 75,34 105,34 C 135,34 162,62 196,62 C 230,62 252,30 278,30 C 304,30 322,68 346,68";

function BusRouteAnimation() {
  return (
    <div
      className="mx-0 mt-2 rounded-2xl overflow-hidden px-4 py-3"
      style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(245,158,11,0.7)" }}>
        Live Route Simulation · Sri Lanka
      </p>
      <svg
        viewBox="0 0 370 118"
        className="w-full"
        style={{ height: 118, overflow: "visible" }}
      >
        {/* ── Glow / shadow under path ── */}
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="rgba(245,158,11,0.12)"
          strokeWidth="10"
        />

        {/* ── Dashed route line ── */}
        <path
          id="busRoutePath"
          d={ROUTE_PATH}
          fill="none"
          stroke="rgba(245,158,11,0.45)"
          strokeWidth="2"
          strokeDasharray="7 4"
        />

        {/* ── Completed segment (brighter, solid) — animates with the bus ── */}
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          style={{ opacity: 0.7 }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1000"
            to="0"
            dur="7s"
            repeatCount="indefinite"
          />
        </path>

        {/* ── Stop circles ── */}
        {STOPS.map((s) => (
          <g key={s.label}>
            {/* Pulse ring */}
            <circle cx={s.cx} cy={s.cy} r="7" fill="rgba(245,158,11,0.1)">
              <animate attributeName="r" values="5;9;5" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
            </circle>
            {/* Solid dot */}
            <circle cx={s.cx} cy={s.cy} r="4.5" fill="#F59E0B" opacity="0.9" />
            <circle cx={s.cx} cy={s.cy} r="2.5" fill="#fff" opacity="0.95" />
            {/* Label */}
            <text
              x={s.cx}
              y={s.labelY}
              textAnchor="middle"
              fontSize="8"
              fontWeight="600"
              fill="rgba(255,255,255,0.6)"
              fontFamily="system-ui, sans-serif"
            >
              {s.label}
            </text>
          </g>
        ))}

        {/* ── Animated bus marker ── */}
        <g>
          <animateMotion
            dur="7s"
            repeatCount="indefinite"
            rotate="auto"
            calcMode="spline"
            keyTimes="0;0.25;0.5;0.75;1"
            keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
          >
            <mpath href="#busRoutePath" />
          </animateMotion>

          {/* Bus body */}
          <rect x="-13" y="-8" width="26" height="16" rx="4" fill="#F59E0B" />
          {/* Front window */}
          <rect x="5" y="-6" width="6" height="9" rx="1.5" fill="rgba(255,255,255,0.85)" />
          {/* Side windows */}
          <rect x="-4" y="-6" width="5" height="5" rx="1" fill="rgba(255,255,255,0.55)" />
          <rect x="-11" y="-6" width="5" height="5" rx="1" fill="rgba(255,255,255,0.55)" />
          {/* Wheels */}
          <circle cx="-7" cy="8" r="3.5" fill="#1E3A5F" />
          <circle cx="-7" cy="8" r="1.5" fill="rgba(255,255,255,0.4)" />
          <circle cx="6"  cy="8" r="3.5" fill="#1E3A5F" />
          <circle cx="6"  cy="8" r="1.5" fill="rgba(255,255,255,0.4)" />
          {/* Headlight glow */}
          <ellipse cx="14" cy="0" rx="4" ry="2.5" fill="rgba(255,255,200,0.5)">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.4s" repeatCount="indefinite" />
          </ellipse>
        </g>

        {/* ── Speed lines behind bus (trailing effect) ── */}
        <g opacity="0.3">
          <animateMotion
            dur="7s"
            repeatCount="indefinite"
            rotate="auto"
            calcMode="spline"
            keyTimes="0;0.25;0.5;0.75;1"
            keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
          >
            <mpath href="#busRoutePath" />
          </animateMotion>
          <line x1="-16" y1="-3" x2="-26" y2="-3" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="-16" y1="0"  x2="-28" y2="0"  stroke="#F59E0B" strokeWidth="2"   strokeLinecap="round" />
          <line x1="-16" y1="3"  x2="-26" y2="3"  stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("saferide_auth", "true");
        onLogin();
      } else {
        setError("Invalid username or password. Try admin / admin123");
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F8FAFC" }}>
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: "#1E3A5F" }}
      >
        {/* Background bus photo */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
            alt="School bus"
            className="w-full h-full object-cover"
            style={{ opacity: 0.15 }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F59E0B" }}>
              <Bus className="text-white" style={{ width: 18, height: 18 }} />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SafeRide Ops</span>
          </div>

          {/* Headline */}
          <div className="mt-auto">
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              School Bus Management
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Every child home,<br />
              <span style={{ color: "#F59E0B" }}>safe and on time.</span>
            </h1>
            <p className="mt-3 text-base leading-relaxed" style={{ color: "#94A3B8" }}>
              A complete platform to manage your school's bus fleet, track student attendance, and keep guardians informed.
            </p>

            {/* Feature cards */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(245,158,11,0.2)" }}>
                    <Icon style={{ width: 14, height: 14, color: "#F59E0B" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: "#64748B" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Bus route animation ── */}
            <div className="mt-5">
              <BusRouteAnimation />
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex -space-x-2">
              {["photo-1503454537195-1dcabb73ffb9", "photo-1588072432836-e10032774350", "photo-1491308056676-205b7c9a7dc1"].map(id => (
                <img key={id} src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=80&h=80&q=80`} alt="student"
                  className="h-8 w-8 rounded-full object-cover ring-2" style={{ ringColor: "#1E3A5F" }} />
              ))}
            </div>
            <p className="text-xs" style={{ color: "#64748B" }}>Trusted by schools for student safety</p>
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-16 justify-center">
        {/* Mobile brand */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#F59E0B" }}>
            <Bus className="text-white" style={{ width: 16, height: 16 }} />
          </div>
          <span className="font-bold text-lg" style={{ color: "#0F172A" }}>SafeRide Ops</span>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm" style={{ marginTop: "-32px" }}>
          <h2 className="text-2xl font-bold mb-1.5" style={{ color: "#0F172A" }}>Welcome back</h2>
          <p className="text-sm mb-7" style={{ color: "#64748B" }}>Sign in to your administrator account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "#374151" }}>Username</label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full h-10 px-3 text-sm rounded-lg outline-none transition-all"
                style={{ border: "1px solid #E2E8F0", background: "#fff", color: "#0F172A" }}
                onFocus={e => (e.target.style.borderColor = "#F59E0B")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "#374151" }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3 text-sm rounded-lg outline-none transition-all"
                style={{ border: "1px solid #E2E8F0", background: "#fff", color: "#0F172A" }}
                onFocus={e => (e.target.style.borderColor = "#F59E0B")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2.5 rounded-lg" style={{ background: "#FFF1F2", color: "#BE123C", border: "1px solid #FECDD3" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-sm font-semibold transition-opacity"
              style={{ background: "#F59E0B", color: "#fff", opacity: loading ? 0.75 : 1, cursor: loading ? "not-allowed" : "pointer", border: "none" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 px-4 py-3 rounded-lg flex items-start gap-2.5" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <Shield style={{ width: 14, height: 14, color: "#64748B", marginTop: 1, flexShrink: 0 }} />
            <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>
              <span className="font-medium" style={{ color: "#374151" }}>Demo credentials:</span>{" "}
              Username <code className="font-mono">admin</code> · Password{" "}
              <code className="font-mono">admin123</code>
            </p>
          </div>

          {/* Powered by */}
          <div className="mt-7 flex items-center justify-center gap-2">
            <span className="text-[11px] font-medium" style={{ color: "#94A3B8" }}>Powered by</span>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCzrc0k5wmNzmItazY38yj1_7K5zAFLMxn-Q&s"
              alt="Live U"
              className="h-5 w-5 rounded object-contain"
              style={{ opacity: 0.85 }}
            />
            <span className="text-[11px] font-semibold" style={{ color: "#64748B" }}>Live U Pvt Ltd, Sri Lanka</span>
          </div>
        </div>
      </div>
    </div>
  );
}
