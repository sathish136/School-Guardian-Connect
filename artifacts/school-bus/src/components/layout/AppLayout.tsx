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
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 z-10 shadow-sm">
        <div className="h-14 flex items-center px-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Fingerprint className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-base tracking-tight">SafePass</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-2 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Menu</p>
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}>
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600" : "text-slate-400")} />
                  <span>{item.name}</span>
                  {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">AD</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">Admin</p>
              <p className="text-[10px] text-slate-400 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 ml-60 min-w-0">
        <main className="min-h-screen py-7 px-8">{children}</main>
      </div>
    </div>
  );
}
