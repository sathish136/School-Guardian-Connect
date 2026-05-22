import { useListScans } from "@workspace/api-client-react";
import { format, isToday, differenceInMinutes, startOfDay, endOfDay } from "date-fns";
import { LogIn, LogOut, CheckCircle2, Minus, CalendarDays, Bell } from "lucide-react";
import { useState } from "react";
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

interface AttendanceRow {
  studentId: number;
  studentName: string | null;
  boardScan: ScanEvent | null;
  alightScan: ScanEvent | null;
}

function buildAttendance(scans: ScanEvent[], date: Date): AttendanceRow[] {
  const start = startOfDay(date).getTime();
  const end = endOfDay(date).getTime();
  const dayScans = scans.filter(s => {
    const t = new Date(s.scannedAt).getTime();
    return t >= start && t <= end;
  });

  const map = new Map<number, AttendanceRow>();
  for (const s of dayScans) {
    if (!map.has(s.studentId)) {
      map.set(s.studentId, { studentId: s.studentId, studentName: s.studentName ?? null, boardScan: null, alightScan: null });
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
    return ta.localeCompare(tb);
  });
}

function TimeCell({ scan, type }: { scan: ScanEvent | null; type: "board" | "alight" }) {
  if (!scan) {
    return (
      <div className="flex items-center gap-1.5" style={{ color: "#CBD5E1" }}>
        <Minus style={{ width: 11, height: 11 }} />
        <span className="text-xs">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      {type === "board"
        ? <LogIn style={{ width: 12, height: 12, color: "#16A34A" }} />
        : <LogOut style={{ width: 12, height: 12, color: "#BE123C" }} />
      }
      <span className="text-sm font-bold tabular-nums" style={{ color: HEAD }}>
        {format(new Date(scan.scannedAt), "h:mm a")}
      </span>
    </div>
  );
}

function DurationBadge({ board, alight }: { board: ScanEvent | null; alight: ScanEvent | null }) {
  if (!board || !alight) return <span style={{ color: "#CBD5E1" }}>—</span>;
  const mins = differenceInMinutes(new Date(alight.scannedAt), new Date(board.scannedAt));
  if (mins <= 0) return <span style={{ color: "#CBD5E1" }}>—</span>;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>
      {h > 0 ? `${h}h ${m}m` : `${m} min`}
    </span>
  );
}

function StatusBadge({ row }: { row: AttendanceRow }) {
  if (row.boardScan && row.alightScan) {
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#DCFCE7", color: "#15803D" }}>
        Completed
      </span>
    );
  }
  if (row.boardScan) {
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit" style={{ background: "#FEF9C3", color: "#854D0E" }}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500" />
        </span>
        On bus
      </span>
    );
  }
  return (
    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
      Alight only
    </span>
  );
}

function NotifDots({ board, alight }: { board: ScanEvent | null; alight: ScanEvent | null }) {
  const scans = [board, alight].filter(Boolean) as ScanEvent[];
  if (scans.length === 0) return <span style={{ color: "#CBD5E1" }}>—</span>;
  return (
    <div className="flex flex-col gap-1">
      {scans.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs font-medium">
          {s.smsSent
            ? <><CheckCircle2 style={{ width: 11, height: 11, color: "#16A34A" }} /><span style={{ color: "#16A34A" }}>Sent</span></>
            : <><span style={{ color: "#EF4444" }}>✕</span><span style={{ color: "#EF4444" }}>Failed</span></>
          }
        </div>
      ))}
    </div>
  );
}

export default function Attendance() {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const [dateStr, setDateStr] = useState(todayStr);

  const selectedDate = new Date(dateStr + "T00:00:00");
  const isSelectedToday = dateStr === todayStr;

  const { data: scans = [], isLoading } = useListScans({ limit: 500 });

  const attendance = buildAttendance(scans, selectedDate);
  const totalBoarded = attendance.filter(r => r.boardScan).length;
  const totalAlighted = attendance.filter(r => r.alightScan).length;
  const onBus = attendance.filter(r => r.boardScan && !r.alightScan).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold" style={{ color: HEAD }}>Attendance</h1>
          <p className="text-[13px] mt-0.5 font-medium" style={{ color: MUTED }}>Board and alight times per student</p>
        </div>
      </div>

      {/* Auto-send notice */}
      <div className="flex items-start gap-3 px-5 py-3.5 rounded-2xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
        <Bell style={{ width: 15, height: 15, color: "#16A34A", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#15803D" }}>Automatic notifications enabled</p>
          <p className="text-xs mt-0.5" style={{ color: "#16A34A" }}>
            Guardian messages are sent automatically via WhatsApp/SMS the moment a student boards or alights. No manual action needed.
          </p>
        </div>
      </div>

      {/* Date picker + stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Calendar date input */}
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5" style={{ border: `1px solid ${BORDER}` }}>
          <CalendarDays style={{ width: 16, height: 16, color: ACCENT, flexShrink: 0 }} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Date</p>
            <input
              type="date"
              max={todayStr}
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              className="text-sm font-bold outline-none bg-transparent cursor-pointer"
              style={{ color: HEAD, border: "none" }}
            />
          </div>
          {isSelectedToday && (
            <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>
              Today
            </span>
          )}
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-3">
          {[
            { label: "Boarded", value: totalBoarded, color: "#15803D", bg: "#DCFCE7" },
            { label: "Alighted", value: totalAlighted, color: "#BE123C", bg: "#FFF1F2" },
            { label: "On bus", value: onBus, color: "#92400E", bg: "#FEF3C7" },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-2xl" style={{ background: stat.bg, color: stat.color }}>
              <span className="text-xl font-black">{stat.value}</span>
              {stat.label}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="grid px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr", borderBottom: `1px solid ${BORDER}`, background: "#FAFBFC", color: MUTED }}>
          <span>Student</span>
          <span>Status</span>
          <span>Boarded</span>
          <span>Alighted</span>
          <span>Duration</span>
          <span>Notification</span>
        </div>

        {isLoading ? (
          <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full shrink-0" style={{ background: "#F1F5F9" }} />
                <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr" }}>
                  {[...Array(5)].map((_, j) => <div key={j} className="h-3 rounded-full" style={{ background: "#F1F5F9" }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-20 text-center">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF3C7" }}>
              <CalendarDays style={{ width: 24, height: 24, color: ACCENT }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: HEAD }}>No attendance records</p>
            <p className="text-xs mt-1 font-medium" style={{ color: MUTED }}>
              {isSelectedToday ? "Scans will appear here as students board and alight today." : "No scans were recorded on this date."}
            </p>
          </div>
        ) : (
          attendance.map((row, i) => {
            const { bg, fg } = palette(row.studentId);
            const isOnBus = row.boardScan && !row.alightScan;
            return (
              <div
                key={row.studentId}
                className="grid px-6 py-4 items-center"
                style={{
                  gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr",
                  borderBottom: i < attendance.length - 1 ? `1px solid #F1F5F9` : "none",
                  background: isOnBus ? "#FFFBEB" : "#fff",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: bg, color: fg }}>
                    {initials(row.studentName)}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: HEAD }}>{row.studentName}</span>
                </div>
                <StatusBadge row={row} />
                <TimeCell scan={row.boardScan} type="board" />
                <TimeCell scan={row.alightScan} type="alight" />
                <DurationBadge board={row.boardScan} alight={row.alightScan} />
                <NotifDots board={row.boardScan} alight={row.alightScan} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
