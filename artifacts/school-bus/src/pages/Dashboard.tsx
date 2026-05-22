import { useGetDashboardStats, useListScans } from "@workspace/api-client-react";
import { Users, Fingerprint, MessageSquare, Bus, LogIn, LogOut, CheckCircle2, Clock, Minus } from "lucide-react";
import { format, isToday, differenceInMinutes } from "date-fns";
import type { ScanEvent } from "@workspace/api-client-react";

const ACCENT = "#F59E0B";
const BORDER = "#E2E8F0";
const MUTED = "#64748B";
const HEAD = "#0F172A";

const PALETTE = [
  { bg: "#FEF3C7", fg: "#92400E" }, { bg: "#F0FDF4", fg: "#15803D" },
  { bg: "#EEF2FF", fg: "#4338CA" }, { bg: "#FDF2F8", fg: "#9D174D" },
  { bg: "#F0FDFA", fg: "#0F766E" }, { bg: "#FFF7ED", fg: "#C2410C" },
  { bg: "#FFF1F2", fg: "#BE123C" },
];
const palette = (id: number) => PALETTE[id % PALETTE.length];
const initials = (name: string | null | undefined) =>
  (name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

function Stat({ label, value, sub, icon: Icon, iconColor, iconBg }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl px-5 py-5 flex flex-col gap-4" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <Icon style={{ width: 15, height: 15, color: iconColor }} />
        </div>
      </div>
      <div>
        <p className="text-[30px] font-bold tracking-tight leading-none" style={{ color: HEAD }}>{value}</p>
        {sub && <p className="text-[12px] mt-1.5 font-medium" style={{ color: MUTED }}>{sub}</p>}
      </div>
    </div>
  );
}

interface AttendanceRow {
  studentId: number;
  studentName: string | null;
  guardianPhone: string | null;
  busNumber: string | null;
  boardScan: ScanEvent | null;
  alightScan: ScanEvent | null;
}

function buildAttendance(scans: ScanEvent[]): AttendanceRow[] {
  const todayScans = scans.filter(s => isToday(new Date(s.scannedAt)));
  const map = new Map<number, AttendanceRow>();
  for (const s of todayScans) {
    if (!map.has(s.studentId)) {
      map.set(s.studentId, {
        studentId: s.studentId, studentName: s.studentName ?? null,
        guardianPhone: s.guardianPhone ?? null, busNumber: s.busNumber ?? null,
        boardScan: null, alightScan: null,
      });
    }
    const row = map.get(s.studentId)!;
    if (s.scanType === "board") {
      if (!row.boardScan || new Date(s.scannedAt) > new Date(row.boardScan.scannedAt)) row.boardScan = s;
    } else {
      if (!row.alightScan || new Date(s.scannedAt) > new Date(row.alightScan.scannedAt)) row.alightScan = s;
    }
  }
  return [...map.values()].sort((a, b) => {
    const ta = a.boardScan?.scannedAt ?? a.alightScan?.scannedAt ?? "";
    const tb = b.boardScan?.scannedAt ?? b.alightScan?.scannedAt ?? "";
    return tb.localeCompare(ta);
  });
}

function Duration({ board, alight }: { board: ScanEvent | null; alight: ScanEvent | null }) {
  if (!board || !alight) return <span style={{ color: "#CBD5E1" }}>—</span>;
  const mins = differenceInMinutes(new Date(alight.scannedAt), new Date(board.scannedAt));
  if (mins < 0) return <span style={{ color: "#CBD5E1" }}>—</span>;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m} min`;
  return (
    <span className="text-[12px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: "#FEF3C7", color: "#92400E" }}>
      {label}
    </span>
  );
}

function NotifStatus({ scan }: { scan: ScanEvent | null }) {
  if (!scan) return <span style={{ color: "#CBD5E1" }}>—</span>;
  return scan.smsSent
    ? <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: "#15803D" }}><CheckCircle2 style={{ width: 11, height: 11 }} />Sent</span>
    : <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: "#EF4444" }}>Not sent</span>;
}

function TimeCell({ scan, type }: { scan: ScanEvent | null; type: "board" | "alight" }) {
  if (!scan) {
    return (
      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#CBD5E1" }}>
        <Minus style={{ width: 12, height: 12 }} />
        <span>—</span>
      </div>
    );
  }
  const t = new Date(scan.scannedAt);
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {type === "board"
          ? <LogIn style={{ width: 12, height: 12, color: "#16A34A" }} />
          : <LogOut style={{ width: 12, height: 12, color: "#BE123C" }} />
        }
        <span className="text-[13px] font-bold tabular-nums" style={{ color: HEAD }}>{format(t, "h:mm a")}</span>
      </div>
      <p className="text-[11px] mt-0.5 ml-[18px]" style={{ color: MUTED }}>{format(t, "d MMM yyyy")}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: scans = [], isLoading } = useListScans({ limit: 200 });

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const attendance = buildAttendance(scans);
  const todayTotal = scans.filter(s => isToday(new Date(s.scannedAt)));
  const boardCount = todayTotal.filter(s => s.scanType === "board").length;
  const alightCount = todayTotal.filter(s => s.scanType === "alight").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium" style={{ color: MUTED }}>{greeting}, Admin</p>
          <h1 className="text-[24px] font-bold mt-0.5" style={{ color: HEAD }}>Dashboard</h1>
        </div>
        <div
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}
        >
          {format(now, "EEEE, MMMM d")}
        </div>
      </div>

      {/* Banner image */}
      <div
        className="relative rounded-2xl overflow-hidden flex items-end px-6 py-5"
        style={{ background: "#1E3A5F", minHeight: 120 }}
      >
        <img
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
          alt="Students boarding bus"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.2 }}
        />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#F59E0B" }}>Today's Overview</p>
          <p className="text-xl font-bold text-white">Student bus attendance &amp; scan activity</p>
        </div>
        <div className="relative z-10 ml-auto flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{boardCount}</p>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Boarded</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{alightCount}</p>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Alighted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats?.studentsOnBus ?? 0}</p>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>On Bus</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Stat
          label="Total Students"
          value={stats?.totalStudents ?? 0}
          sub="enrolled"
          icon={Users}
          iconColor="#1E3A5F"
          iconBg="#DBEAFE"
        />
        <Stat
          label="Today's Scans"
          value={stats?.todayScans ?? 0}
          sub={`${boardCount} boarded · ${alightCount} alighted`}
          icon={Fingerprint}
          iconColor="#92400E"
          iconBg="#FEF3C7"
        />
        <Stat
          label="SMS Sent"
          value={stats?.smsSentToday ?? 0}
          sub={stats?.smsFailedToday ? `${stats.smsFailedToday} failed` : "all delivered"}
          icon={MessageSquare}
          iconColor="#15803D"
          iconBg="#DCFCE7"
        />
        <Stat
          label="On Bus Now"
          value={stats?.studentsOnBus ?? 0}
          sub="currently travelling"
          icon={Bus}
          iconColor="#B45309"
          iconBg="#FEF9C3"
        />
      </div>

      {/* Today's Attendance */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <div>
            <p className="text-[14px] font-bold" style={{ color: HEAD }}>Today's Attendance</p>
            <p className="text-[12px] mt-0.5 font-medium" style={{ color: MUTED }}>Board &amp; alight times with notification status</p>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: MUTED }}>
            <Clock style={{ width: 12, height: 12 }} />
            {format(now, "EEEE, MMMM d")}
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full shrink-0" style={{ background: "#F1F5F9" }} />
                <div className="flex-1 grid grid-cols-5 gap-4">
                  {[...Array(5)].map((_, j) => <div key={j} className="h-3 rounded-full" style={{ background: "#F1F5F9" }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF3C7" }}>
              <Bus style={{ width: 24, height: 24, color: "#F59E0B" }} />
            </div>
            <p className="text-[14px] font-semibold" style={{ color: HEAD }}>No scans yet today</p>
            <p className="text-[12px] mt-1 font-medium" style={{ color: MUTED }}>Board and alight times will appear here as students scan</p>
          </div>
        ) : (
          <>
            <div className="grid px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", borderBottom: `1px solid ${BORDER}`, background: "#FAFBFC", color: MUTED }}>
              <span>Student</span>
              <span>Boarded</span>
              <span>Alighted</span>
              <span>Duration</span>
              <span>Notification</span>
            </div>
            {attendance.map((row, i) => {
              const { bg, fg } = palette(row.studentId);
              const isOnBus = row.boardScan && !row.alightScan;
              return (
                <div
                  key={row.studentId}
                  className="grid px-6 py-3.5 items-center"
                  style={{
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    borderBottom: i < attendance.length - 1 ? `1px solid #F1F5F9` : "none",
                    background: isOnBus ? "#FFFBEB" : "#fff",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: bg, color: fg }}>
                      {initials(row.studentName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: HEAD }}>{row.studentName}</p>
                      {isOnBus && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>On bus</span>
                      )}
                    </div>
                  </div>
                  <TimeCell scan={row.boardScan} type="board" />
                  <TimeCell scan={row.alightScan} type="alight" />
                  <Duration board={row.boardScan} alight={row.alightScan} />
                  <div className="space-y-0.5">
                    <NotifStatus scan={row.boardScan} />
                    {row.alightScan && <NotifStatus scan={row.alightScan} />}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Punch log */}
      {scans.filter(s => isToday(new Date(s.scannedAt))).length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
            <p className="text-[14px] font-bold" style={{ color: HEAD }}>Scan Log</p>
            <span
              className="text-[12px] font-semibold px-3 py-1 rounded-full"
              style={{ background: "#FEF3C7", color: "#92400E" }}
            >
              {todayTotal.length} scan{todayTotal.length !== 1 ? "s" : ""} today
            </span>
          </div>
          <div>
            {scans.filter(s => isToday(new Date(s.scannedAt))).map((scan, i, arr) => {
              const { bg, fg } = palette(scan.studentId);
              return (
                <div
                  key={scan.id}
                  className="px-6 py-3 flex items-center gap-3"
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid #F1F5F9` : "none" }}
                >
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: bg, color: fg }}>
                    {initials(scan.studentName)}
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-semibold truncate" style={{ color: HEAD }}>{scan.studentName}</span>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={scan.scanType === "board"
                        ? { background: "#DCFCE7", color: "#15803D" }
                        : { background: "#FFF1F2", color: "#BE123C" }
                      }
                    >
                      {scan.scanType === "board" ? <LogIn style={{ width: 10, height: 10 }} /> : <LogOut style={{ width: 10, height: 10 }} />}
                      {scan.scanType === "board" ? "Boarded" : "Alighted"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {scan.smsSent && <CheckCircle2 style={{ width: 12, height: 12, color: "#15803D" }} />}
                    <span className="text-[12px] tabular-nums font-semibold" style={{ color: MUTED }}>{format(new Date(scan.scannedAt), "h:mm a")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
