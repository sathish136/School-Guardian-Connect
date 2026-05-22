import { Link, useLocation } from "wouter";
import { Shield, Users, Bus as BusIcon, Map as MapIcon, Activity, Radio, Settings, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: ShieldCheck },
  { name: "Students", href: "/students", icon: Users },
  { name: "Buses", href: "/buses", icon: BusIcon },
  { name: "Routes", href: "/routes", icon: MapIcon },
  { name: "Trips", href: "/trips", icon: Activity },
  { name: "Live Scans", href: "/scans", icon: Radio },
  { name: "SMS Config", href: "/sms", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <Shield className="h-6 w-6 text-amber-500 mr-3" />
          <span className="font-bold text-lg tracking-tight">SafeRide Ops</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-colors group",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                  data-testid={`nav-link-${item.name.toLowerCase()}`}
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0 -ml-1 mr-3 h-5 w-5",
                      isActive ? "text-amber-500" : "text-slate-400 group-hover:text-amber-500"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-amber-500 font-bold">
              AD
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs font-medium text-slate-400">Control Center</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <main className="flex-1 py-8 px-8">{children}</main>
      </div>
    </div>
  );
}
