import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import { Users, Fingerprint, MessageSquare, ArrowUpRight, LogIn, LogOut, CheckCircle2, Clock } from "lucide-react";
import { format, isToday } from "date-fns";

const ACCENT = "#5E6AD2";

function Stat({ label, value, sub, icon: Icon, iconColor }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconColor: string;
}) {
  return (
    <div
      className="bg-white rounded-lg px-5 py-4 flex flex-col gap-3"
      style={{ border: "1px solid #E8E8EC" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "#8B8B99" }}>{label}</p>
        <Icon style={{ width: 15, height: 15, color: iconColor }} />
      </div>
      <div>
        <p className="text-[28px] font-semibold tracking-tight leading-none" style={{ color: "#0A0A0B" }}>{value}</p>
        {sub && <p className="text-[12px] mt-1.5" style={{ color: "#8B8B99" }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: activity = [], isLoading } = useGetRecentActivity({ limit: 20 });
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px]" style={{ color: "#8B8B99" }}>{greeting}, Admin</p>
          <h1 className="text-[22px] font-semibold mt-0.5" style={{ color: "#0A0A0B" }}>Dashboard</h1>
        </div>
        <div
          className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
          style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          Live
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Students" value={stats?.totalStudents ?? 0} sub="enrolled" icon={Users} iconColor={ACCENT} />
        <Stat label="Today's Punches" value={stats?.todayScans ?? 0} sub={`${stats?.todayBoardings ?? 0} in · ${stats?.todayAlightings ?? 0} out`} icon={Fingerprint} iconColor="#8B8B99" />
        <Stat label="Messages Sent" value={stats?.smsSentToday ?? 0} sub={stats?.smsFailedToday ? `${stats.smsFailedToday} failed` : "all delivered"} icon={MessageSquare} iconColor="#16A34A" />
        <Stat label="On Bus Now" value={stats?.studentsOnBus ?? 0} sub="active" icon={ArrowUpRight} iconColor="#D97706" />
      </div>

      {/* Activity */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1px solid #E8E8EC" }}>
        <div
          className="px-5 py-3.5 flex items-center justify-between"
          style={{ borderBottom: "1px solid #E8E8EC" }}
        >
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "#0A0A0B" }}>Recent Activity</p>
            <p className="text-[12px] mt-0.5" style={{ color: "#8B8B99" }}>Live biometric punch log</p>
          </div>
          <span className="text-[12px]" style={{ color: "#8B8B99" }}>
            <Clock style={{ display: "inline", width: 12, height: 12, marginRight: 4, verticalAlign: "middle" }} />
            {format(now, "MMM d, h:mm a")}
          </span>
        </div>

        {isLoading ? (
          <div className="divide-y" style={{ borderColor: "#F4F4F5" }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3 flex gap-3 animate-pulse">
                <div className="h-7 w-7 rounded-full shrink-0" style={{ background: "#F4F4F5" }} />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 rounded w-40" style={{ background: "#F4F4F5" }} />
                  <div className="h-2.5 rounded w-28" style={{ background: "#F4F4F5" }} />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[13px] font-medium" style={{ color: "#52525B" }}>No activity yet today</p>
            <p className="text-[12px] mt-1" style={{ color: "#A1A1AA" }}>Biometric punches will appear here in real time</p>
          </div>
        ) : (
          <div>
            {activity.map((item, i) => {
              const isBoard = item.scanType === "board";
              const scannedAt = new Date(item.scannedAt);
              const timeLabel = isToday(scannedAt) ? format(scannedAt, "h:mm a") : format(scannedAt, "MMM d, h:mm a");
              const initials = item.studentName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";
              return (
                <div
                  key={item.id}
                  className="px-5 py-3 flex items-center gap-3"
                  style={{ borderBottom: i < activity.length - 1 ? "1px solid #F4F4F5" : "none" }}
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={isBoard ? { background: "#EEF2FF", color: ACCENT } : { background: "#FFF1F2", color: "#E11D48" }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium truncate" style={{ color: "#0A0A0B" }}>{item.studentName}</span>
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded"
                        style={isBoard
                          ? { background: "#EEF2FF", color: ACCENT }
                          : { background: "#FFF1F2", color: "#E11D48" }}
                      >
                        {isBoard ? <LogIn style={{ width: 10, height: 10 }} /> : <LogOut style={{ width: 10, height: 10 }} />}
                        {isBoard ? "Boarded" : "Alighted"}
                      </span>
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: "#8B8B99" }}>
                      {item.busNumber ? `Bus ${item.busNumber}` : "—"}{item.grade ? ` · ${item.grade}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.smsSent && (
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#16A34A" }}>
                        <CheckCircle2 style={{ width: 11, height: 11 }} /> Sent
                      </span>
                    )}
                    <span className="text-[12px]" style={{ color: "#A1A1AA" }}>{timeLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
