import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Cpu, Plug, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Devices", href: "/devices", icon: Cpu },
  { name: "Integration", href: "/sms", icon: Plug },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex" style={{ background: "#f1f5f9" }}>
      {/* Sidebar */}
      <aside className="w-60 flex flex-col fixed inset-y-0 z-10" style={{ background: "#0f172a" }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "#0d9488" }}>
              <Fingerprint className="h-4.5 w-4.5 text-white" style={{ height: "18px", width: "18px" }} />
            </div>
            <div>
              <span className="font-bold text-white text-[15px] tracking-tight">SafePass</span>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">School Bus Tracker</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          <p className="px-3 pb-3 text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em]">Navigation</p>
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-150",
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
                style={isActive ? { background: "rgba(13,148,136,0.18)", color: "#2dd4bf" } : {}}
                >
                  <item.icon
                    className="h-4 w-4 shrink-0"
                    style={isActive ? { color: "#2dd4bf" } : {}}
                  />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: "#2dd4bf" }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white" style={{ background: "#0d9488" }}>
              AD
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">Admin</p>
              <p className="text-[10px] text-slate-500 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 ml-60 min-w-0">
        <main className="min-h-screen py-8 px-8">{children}</main>
      </div>
    </div>
  );
}
