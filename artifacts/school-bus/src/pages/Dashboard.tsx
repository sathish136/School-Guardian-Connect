import { useGetDashboardStats, useListScans } from "@workspace/api-client-react";
import { Users, Fingerprint, MessageSquare, ArrowUpRight, LogIn, LogOut, CheckCircle2, Clock, Minus } from "lucide-react";
import { format, isToday, differenceInMinutes } from "date-fns";
import type { ScanEvent } from "@workspace/api-client-react";

const ACCENT = "#5E6AD2";
const BORDER = "#E8E8EC";
const MUTED = "#8B8B99";
const HEAD = "#0A0A0B";

const PALETTE = [
  { bg: "#EEF2FF", fg: "#4338CA" }, { bg: "#F0FDF4", fg: "#15803D" },
  { bg: "#FFF7ED", fg: "#C2410C" }, { bg: "#FDF2F8", fg: "#9D174D" },
  { bg: "#F0FDFA", fg: "#0F766E" }, { bg: "#FFFBEB", fg: "#B45309" },
  { bg: "#FFF1F2", fg: "#BE123C" },
];
const palette = (id: number) => PALETTE[id % PALETTE.length];
const initials = (name: string | null | undefined) =>
  (name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

function Stat({ label, value, sub, icon: Icon, iconColor }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-lg px-5 py-4 flex flex-col gap-3" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
        <Icon style={{ width: 15, height: 15, color: iconColor }} />
      </div>
      <div>
        <p className="text-[28px] font-semibold tracking-tight leading-none" style={{ color: HEAD }}>{value}</p>
        {sub && <p className="text-[12px] mt-1.5" style={{ color: MUTED }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ── Pair board + alight scans per student ────────────────────────── */
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

  // Group by student, keep latest board + latest alight
  const map = new Map<number, AttendanceRow>();
  for (const s of todayScans) {
    if (!map.has(s.studentId)) {
      map.set(s.studentId, {
        studentId: s.studentId,
        studentName: s.studentName ?? null,
        guardianPhone: s.guardianPhone ?? null,
        busNumber: s.busNumber ?? null,
        boardScan: null,
        alightScan: null,
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
  if (!board || !alight) return <span style={{ color: "#D1D5DB" }}>—</span>;
  const mins = differenceInMinutes(new Date(alight.scannedAt), new Date(board.scannedAt));
  if (mins < 0) return <span style={{ color: "#D1D5DB" }}>—</span>;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m} min`;
  return (
    <span className="text-[12px] font-medium px-2 py-0.5 rounded" style={{ background: "#F4F4F5", color: "#52525B" }}>
      {label}
    </span>
  );
}

function NotifStatus({ scan }: { scan: ScanEvent | null }) {
  if (!scan) return <span style={{ color: "#D1D5DB" }}>—</span>;
  return scan.smsSent
    ? <span className="flex items-center gap-1 text-[12px]" style={{ color: "#15803D" }}><CheckCircle2 style={{ width: 11, height: 11 }} />Sent</span>
    : <span className="flex items-center gap-1 text-[12px]" style={{ color: "#EF4444" }}>Not sent</span>;
}

function TimeCell({ scan, type }: { scan: ScanEvent | null; type: "board" | "alight" }) {
  if (!scan) {
    return (
      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#D1D5DB" }}>
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
          ? <LogIn style={{ width: 12, height: 12, color: ACCENT }} />
          : <LogOut style={{ width: 12, height: 12, color: "#BE123C" }} />
        }
        <span className="text-[13px] font-semibold tabular-nums" style={{ color: HEAD }}>{format(t, "h:mm a")}</span>
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
          <p className="text-[13px]" style={{ color: MUTED }}>{greeting}, Admin</p>
          <h1 className="text-[22px] font-semibold mt-0.5" style={{ color: HEAD }}>Dashboard</h1>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
          style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
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
        <Stat label="Today's Punches" value={stats?.todayScans ?? 0} sub={`${boardCount} boarded · ${alightCount} alighted`} icon={Fingerprint} iconColor={MUTED} />
        <Stat label="Messages Sent" value={stats?.smsSentToday ?? 0} sub={stats?.smsFailedToday ? `${stats.smsFailedToday} failed` : "all delivered"} icon={MessageSquare} iconColor="#16A34A" />
        <Stat label="On Bus Now" value={stats?.studentsOnBus ?? 0} sub="active" icon={ArrowUpRight} iconColor="#D97706" />
      </div>

      {/* Today's Attendance */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFAFA" }}>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: HEAD }}>Today's Attendance</p>
            <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>Board &amp; alight times with notification status</p>
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
            <Clock style={{ width: 12, height: 12 }} />
            {format(now, "EEEE, MMMM d")}
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y" style={{ borderColor: "#F4F4F5" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex gap-4 animate-pulse">
                <div className="h-7 w-7 rounded-full shrink-0" style={{ background: "#F4F4F5" }} />
                <div className="flex-1 grid grid-cols-5 gap-4">
                  {[...Array(5)].map((_, j) => <div key={j} className="h-3 rounded" style={{ background: "#F4F4F5" }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-[13px] font-medium" style={{ color: "#52525B" }}>No punches yet today</p>
            <p className="text-[12px] mt-1" style={{ color: MUTED }}>Board and alight times will appear here as students scan</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", borderBottom: `1px solid ${BORDER}`, background: "#FAFAFA", color: MUTED }}>
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
                  className="grid px-5 py-3 items-center"
                  style={{
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    borderBottom: i < attendance.length - 1 ? `1px solid #F4F4F5` : "none",
                    background: isOnBus ? "#FAFFFE" : "#fff",
                  }}
                >
                  {/* Student */}
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: bg, color: fg }}>
                      {initials(row.studentName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: HEAD }}>{row.studentName}</p>
                      {isOnBus && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#DCFCE7", color: "#15803D" }}>On bus</span>
                      )}
                    </div>
                  </div>

                  {/* Boarded */}
                  <TimeCell scan={row.boardScan} type="board" />

                  {/* Alighted */}
                  <TimeCell scan={row.alightScan} type="alight" />

                  {/* Duration */}
                  <Duration board={row.boardScan} alight={row.alightScan} />

                  {/* Notification */}
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

      {/* All scans today — quick log */}
      {scans.filter(s => isToday(new Date(s.scannedAt))).length > 0 && (
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFAFA" }}>
            <p className="text-[13px] font-semibold" style={{ color: HEAD }}>Punch log</p>
            <span className="text-[12px]" style={{ color: MUTED }}>{todayTotal.length} punch{todayTotal.length !== 1 ? "es" : ""} today</span>
          </div>
          <div>
            {scans.filter(s => isToday(new Date(s.scannedAt))).map((scan, i, arr) => {
              const { bg, fg } = palette(scan.studentId);
              return (
                <div
                  key={scan.id}
                  className="px-5 py-2.5 flex items-center gap-3"
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid #F4F4F5` : "none" }}
                >
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: bg, color: fg }}>
                    {initials(scan.studentName)}
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-medium truncate" style={{ color: HEAD }}>{scan.studentName}</span>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0"
                      style={scan.scanType === "board"
                        ? { background: "#EEF2FF", color: ACCENT }
                        : { background: "#FFF1F2", color: "#BE123C" }
                      }
                    >
                      {scan.scanType === "board" ? <LogIn style={{ width: 10, height: 10 }} /> : <LogOut style={{ width: 10, height: 10 }} />}
                      {scan.scanType === "board" ? "Boarded" : "Alighted"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {scan.smsSent && <CheckCircle2 style={{ width: 11, height: 11, color: "#15803D" }} />}
                    <span className="text-[12px] tabular-nums font-medium" style={{ color: MUTED }}>{format(new Date(scan.scannedAt), "h:mm a")}</span>
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
