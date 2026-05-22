import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import {
  Users, Fingerprint, MessageSquare, ArrowUpRight,
  LogIn, LogOut, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import { format, isToday } from "date-fns";

function StatCard({
  label, value, icon: Icon, color, sub
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
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
        <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Students Enrolled"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          color="bg-indigo-50 text-indigo-600"
          sub="total registered"
        />
        <StatCard
          label="Today's Punches"
          value={stats?.todayScans ?? 0}
          icon={Fingerprint}
          color="bg-violet-50 text-violet-600"
          sub={`${stats?.todayBoardings ?? 0} in · ${stats?.todayAlightings ?? 0} out`}
        />
        <StatCard
          label="SMS Sent Today"
          value={stats?.smsSentToday ?? 0}
          icon={MessageSquare}
          color="bg-emerald-50 text-emerald-600"
          sub={stats?.smsFailedToday ? `${stats.smsFailedToday} failed` : "all delivered"}
        />
        <StatCard
          label="Currently on Bus"
          value={stats?.studentsOnBus ?? 0}
          icon={ArrowUpRight}
          color="bg-amber-50 text-amber-600"
          sub="active right now"
        />
      </div>

      {/* Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
            <p className="text-xs text-slate-400 mt-0.5">Biometric punch log</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {format(now, "MMM d, h:mm a")}
          </div>
        </div>

        {activityLoading ? (
          <div className="divide-y divide-slate-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded w-48" />
                  <div className="h-2.5 bg-slate-100 rounded w-32" />
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

              return (
                <div key={item.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isBoard ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {item.studentName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">{item.studentName}</span>
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isBoard
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-rose-50 text-rose-600"
                      }`}>
                        {isBoard ? <LogIn className="h-2.5 w-2.5" /> : <LogOut className="h-2.5 w-2.5" />}
                        {isBoard ? "Boarded" : "Alighted"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.busNumber ? `Bus ${item.busNumber}` : "Unknown bus"}
                      {item.grade ? ` · ${item.grade}` : ""}
                    </p>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.smsSent && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> SMS
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
            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No activity yet today</p>
            <p className="text-xs text-slate-400 mt-1">Biometric punches will appear here in real time</p>
          </div>
        )}
      </div>
    </div>
  );
}
