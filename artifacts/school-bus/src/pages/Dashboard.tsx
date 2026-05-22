import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import {
  Users, Fingerprint, MessageSquare, ArrowUpRight,
  LogIn, LogOut, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import { format, isToday } from "date-fns";

const teal = "#0d9488";
const tealLight = "#ccfbf1";
const tealDark = "#0f766e";

function StatCard({
  label, value, icon: Icon, bg, iconColor, sub
}: {
  label: string; value: number | string; icon: React.ElementType;
  bg: string; iconColor: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-xl" style={{ background: bg }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ limit: 15 });

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" :
    now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-7 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium">{greeting}, Admin</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Dashboard</h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border"
          style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#4ade80" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#16a34a" }} />
          </span>
          System Live
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Students"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          bg="#f0fdfa"
          iconColor={teal}
          sub="enrolled"
        />
        <StatCard
          label="Today's Punches"
          value={stats?.todayScans ?? 0}
          icon={Fingerprint}
          bg="#faf5ff"
          iconColor="#7c3aed"
          sub={`${stats?.todayBoardings ?? 0} in · ${stats?.todayAlightings ?? 0} out`}
        />
        <StatCard
          label="Messages Sent"
          value={stats?.smsSentToday ?? 0}
          icon={MessageSquare}
          bg="#f0fdf4"
          iconColor="#16a34a"
          sub={stats?.smsFailedToday ? `${stats.smsFailedToday} failed` : "all delivered"}
        />
        <StatCard
          label="On Bus Now"
          value={stats?.studentsOnBus ?? 0}
          icon={ArrowUpRight}
          bg="#fffbeb"
          iconColor="#d97706"
          sub="active"
        />
      </div>

      {/* Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live biometric punch log</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {format(now, "MMM d, h:mm a")}
          </div>
        </div>

        {activityLoading ? (
          <div className="divide-y divide-slate-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-3 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-40" />
                  <div className="h-2.5 bg-slate-100 rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : activity && activity.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {activity.map((item) => {
              const isBoard = item.scanType === "board";
              const scannedAt = new Date(item.scannedAt);
              const timeLabel = isToday(scannedAt)
                ? format(scannedAt, "h:mm a")
                : format(scannedAt, "MMM d, h:mm a");
              const initials = item.studentName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

              return (
                <div key={item.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={isBoard
                      ? { background: "#f0fdfa", color: teal }
                      : { background: "#fff1f2", color: "#e11d48" }
                    }>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 truncate">{item.studentName}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={isBoard
                          ? { background: "#f0fdfa", color: teal }
                          : { background: "#fff1f2", color: "#e11d48" }
                        }>
                        {isBoard ? <LogIn className="h-2.5 w-2.5" /> : <LogOut className="h-2.5 w-2.5" />}
                        {isBoard ? "Boarded" : "Alighted"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.busNumber ? `Bus ${item.busNumber}` : "No bus"}
                      {item.grade ? ` · ${item.grade}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.smsSent && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#16a34a" }}>
                        <CheckCircle2 className="h-3 w-3" /> Sent
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{timeLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No activity yet today</p>
            <p className="text-xs text-slate-400 mt-1.5">Biometric punches will appear here in real time</p>
          </div>
        )}
      </div>
    </div>
  );
}
