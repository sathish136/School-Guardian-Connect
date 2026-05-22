import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Cpu, Plug, Fingerprint, ScanLine, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Attendance", href: "/attendance", icon: CalendarCheck },
  { name: "Scan", href: "/scan", icon: ScanLine },
  { name: "Devices", href: "/devices", icon: Cpu },
  { name: "Integration", href: "/sms", icon: Plug },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex" style={{ background: "#F7F7F8" }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex flex-col fixed inset-y-0 z-10"
        style={{ background: "#16161A", borderRight: "1px solid #1E1E24" }}
      >
        {/* Brand */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: "1px solid #1E1E24" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#5E6AD2" }}
            >
              <Fingerprint className="text-white" style={{ width: 14, height: 14 }} />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">SafePass</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {nav.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-colors duration-100"
                  style={
                    active
                      ? { background: "rgba(255,255,255,0.07)", color: "#FFFFFF" }
                      : { color: "#8B8B99" }
                  }
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#D1D1DB"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#8B8B99"; }}
                >
                  <item.icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3.5" style={{ borderTop: "1px solid #1E1E24" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: "#5E6AD2", color: "#fff" }}
            >
              A
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium leading-tight text-white truncate">Admin</p>
              <p className="text-[11px] leading-tight truncate" style={{ color: "#55555F" }}>Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-56">
        <main className="min-h-screen px-8 py-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
