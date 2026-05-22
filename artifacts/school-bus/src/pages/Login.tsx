import { useState } from "react";
import { Bus, Shield, Bell, Users } from "lucide-react";

const FEATURES = [
  { icon: Bus, label: "Real-time Bus Tracking", desc: "Monitor every bus on your route network" },
  { icon: Shield, label: "Biometric Safety", desc: "Fingerprint scan when students board & alight" },
  { icon: Bell, label: "Instant Guardian Alerts", desc: "SMS notifications sent to parents automatically" },
  { icon: Users, label: "Student Management", desc: "Full enrollment and attendance records" },
];

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
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: "#1E3A5F" }}
      >
        {/* School bus photo overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
            alt="School bus"
            className="w-full h-full object-cover"
            style={{ opacity: 0.18 }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#F59E0B" }}
            >
              <Bus className="text-white" style={{ width: 18, height: 18 }} />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SafeRide Ops</span>
          </div>

          {/* Headline */}
          <div className="mt-auto mb-8">
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              School Bus Management
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Every child home,<br />
              <span style={{ color: "#F59E0B" }}>safe and on time.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed" style={{ color: "#94A3B8" }}>
              A complete platform to manage your school's bus fleet, track student attendance, and keep guardians informed.
            </p>

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(245,158,11,0.2)" }}
                  >
                    <Icon style={{ width: 14, height: 14, color: "#F59E0B" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: "#64748B" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom kids photo strip */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex -space-x-2">
              {[
                "photo-1503454537195-1dcabb73ffb9",
                "photo-1588072432836-e10032774350",
                "photo-1491308056676-205b7c9a7dc1",
              ].map((id) => (
                <img
                  key={id}
                  src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=80&h=80&q=80`}
                  alt="student"
                  className="h-8 w-8 rounded-full object-cover ring-2"
                  style={{ ringColor: "#1E3A5F" }}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: "#64748B" }}>
              Trusted by schools for student safety
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile brand */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "#F59E0B" }}
          >
            <Bus className="text-white" style={{ width: 16, height: 16 }} />
          </div>
          <span className="font-bold text-lg" style={{ color: "#0F172A" }}>SafeRide Ops</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-1.5" style={{ color: "#0F172A" }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: "#64748B" }}>Sign in to your administrator account</p>

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
                style={{
                  border: "1px solid #E2E8F0",
                  background: "#fff",
                  color: "#0F172A",
                }}
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
                style={{
                  border: "1px solid #E2E8F0",
                  background: "#fff",
                  color: "#0F172A",
                }}
                onFocus={e => (e.target.style.borderColor = "#F59E0B")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>

            {error && (
              <div
                className="text-xs px-3 py-2.5 rounded-lg"
                style={{ background: "#FFF1F2", color: "#BE123C", border: "1px solid #FECDD3" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-sm font-semibold transition-opacity"
              style={{
                background: "#F59E0B",
                color: "#fff",
                opacity: loading ? 0.75 : 1,
                cursor: loading ? "not-allowed" : "pointer",
                border: "none",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div
            className="mt-6 px-4 py-3 rounded-lg flex items-start gap-2.5"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
          >
            <Shield style={{ width: 14, height: 14, color: "#64748B", marginTop: 1, flexShrink: 0 }} />
            <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>
              <span className="font-medium" style={{ color: "#374151" }}>Demo credentials:</span>{" "}
              Username <code className="font-mono">admin</code> · Password{" "}
              <code className="font-mono">admin123</code>
            </p>
          </div>

          {/* Powered by */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="text-[11px] font-medium" style={{ color: "#94A3B8" }}>Powered by</span>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCzrc0k5wmNzmItazY38yj1_7K5zAFLMxn-Q&s"
              alt="Live U"
              className="h-5 w-5 rounded object-contain"
              style={{ opacity: 0.85 }}
            />
            <span className="text-[11px] font-semibold" style={{ color: "#64748B" }}>
              Live U Pvt Ltd, Sri Lanka
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
