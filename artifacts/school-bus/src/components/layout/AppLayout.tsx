import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, Cpu, Plug, Activity, CalendarCheck, Bus, LogOut, ChevronRight, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Attendance", href: "/attendance", icon: CalendarCheck },
  { name: "Buses", href: "/buses", icon: Bus },
  { name: "GPS Tracker", href: "/gps", icon: MapPin },
  { name: "Live Monitor", href: "/scan", icon: Activity },
  { name: "Devices", href: "/devices", icon: Cpu },
  { name: "Integration", href: "/sms", icon: Plug },
];

export function AppLayout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex" style={{ background: "#F1F5F9" }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex flex-col fixed inset-y-0 z-10"
        style={{ background: "#1E3A5F", borderRight: "1px solid #1A3352" }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#F59E0B" }}
            >
              <Bus className="text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-tight block leading-tight">SafeRide Ops</span>
              <span className="text-[11px] leading-tight" style={{ color: "#5B8AB5" }}>School Bus Management</span>
            </div>
          </div>
        </div>

        {/* School bus image strip */}
        <div className="mx-4 mt-4 rounded-xl overflow-hidden" style={{ height: 80 }}>
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80"
            alt="School bus"
            className="w-full h-full object-cover"
            style={{ opacity: 0.65 }}
          />
        </div>

        {/* Nav label */}
        <p className="px-5 mt-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#3E6A94" }}>
          Main Menu
        </p>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-100",
                  )}
                  style={
                    active
                      ? { background: "#F59E0B", color: "#fff", boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }
                      : { color: "#7BADD4" }
                  }
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                      (e.currentTarget as HTMLElement).style.color = "#fff";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#7BADD4";
                    }
                  }}
                >
                  <item.icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span className="flex-1">{item.name}</span>
                  {active && <ChevronRight style={{ width: 13, height: 13, opacity: 0.7 }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 overflow-hidden" style={{ background: "#F59E0B", color: "#fff" }}>
              <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=80&h=80&q=80" alt="Admin" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold leading-tight text-white truncate">Admin User</p>
              <p className="text-[11px] leading-tight truncate" style={{ color: "#5B8AB5" }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-100 cursor-pointer"
            style={{ color: "#7BADD4", background: "transparent", border: "none" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)"; (e.currentTarget as HTMLElement).style.color = "#FCA5A5"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#7BADD4"; }}
          >
            <LogOut style={{ width: 14, height: 14 }} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center px-8 py-3" style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
            <Bus style={{ width: 13, height: 13 }} />
            <span>SafeRide Ops</span>
            <ChevronRight style={{ width: 11, height: 11 }} />
            <span className="font-medium capitalize" style={{ color: "#0F172A" }}>
              {nav.find(n => n.href === (location || "/"))?.name ?? "Dashboard"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            Live
          </div>
        </div>
        <main className="flex-1 px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
