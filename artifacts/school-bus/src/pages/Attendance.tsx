import { useListScans } from "@workspace/api-client-react";
import { format, isToday, differenceInMinutes, startOfDay, endOfDay, subDays } from "date-fns";
import { LogIn, LogOut, CheckCircle2, Minus, Clock, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
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
      <div className="flex items-center gap-1.5" style={{ color: "#D1D5DB" }}>
        <Minus style={{ width: 11, height: 11 }} />
        <span className="text-[12px]">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      {type === "board"
        ? <LogIn style={{ width: 12, height: 12, color: ACCENT }} />
        : <LogOut style={{ width: 12, height: 12, color: "#BE123C" }} />
      }
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: HEAD }}>
        {format(new Date(scan.scannedAt), "h:mm a")}
      </span>
    </div>
  );
}

function DurationBadge({ board, alight }: { board: ScanEvent | null; alight: ScanEvent | null }) {
  if (!board || !alight) return <span style={{ color: "#D1D5DB" }}>—</span>;
  const mins = differenceInMinutes(new Date(alight.scannedAt), new Date(board.scannedAt));
  if (mins <= 0) return <span style={{ color: "#D1D5DB" }}>—</span>;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (
    <span className="text-[12px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#F4F4F5", color: "#52525B" }}>
      {h > 0 ? `${h}h ${m}m` : `${m} min`}
    </span>
  );
}

function StatusBadge({ row }: { row: AttendanceRow }) {
  if (row.boardScan && row.alightScan) {
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#15803D" }}>
        Completed
      </span>
    );
  }
  if (row.boardScan) {
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit" style={{ background: "#FEF9C3", color: "#854D0E" }}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500" />
        </span>
        On bus
      </span>
    );
  }
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
      Alight only
    </span>
  );
}

function NotifDots({ board, alight }: { board: ScanEvent | null; alight: ScanEvent | null }) {
  const scans = [board, alight].filter(Boolean) as ScanEvent[];
  if (scans.length === 0) return <span style={{ color: "#D1D5DB" }}>—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {scans.map((s, i) => (
        <div key={i} className="flex items-center gap-1 text-[11px]">
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: scans = [], isLoading } = useListScans({ limit: 500 });

  const attendance = buildAttendance(scans, selectedDate);
  const isSelectedToday = isToday(selectedDate);

  const totalBoarded = attendance.filter(r => r.boardScan).length;
  const totalAlighted = attendance.filter(r => r.alightScan).length;
  const onBus = attendance.filter(r => r.boardScan && !r.alightScan).length;

  function prevDay() { setSelectedDate(d => subDays(d, 1)); }
  function nextDay() {
    const next = subDays(selectedDate, -1);
    if (next <= new Date()) setSelectedDate(next);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold" style={{ color: HEAD }}>Attendance</h1>
        <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>Board and alight times per student</p>
      </div>

      {/* Date picker + summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2" style={{ border: `1px solid ${BORDER}` }}>
          <button onClick={prevDay} className="p-0.5 rounded hover:bg-gray-100 transition-colors">
            <ChevronLeft style={{ width: 14, height: 14, color: MUTED }} />
          </button>
          <div className="flex items-center gap-1.5 px-1">
            <CalendarDays style={{ width: 13, height: 13, color: ACCENT }} />
            <span className="text-[13px] font-semibold" style={{ color: HEAD }}>
              {isSelectedToday ? "Today — " : ""}{format(selectedDate, "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <button
            onClick={nextDay}
            disabled={isSelectedToday}
            className="p-0.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-30"
          >
            <ChevronRight style={{ width: 14, height: 14, color: MUTED }} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {[
            { label: "Boarded", value: totalBoarded, color: ACCENT, bg: "#EEF2FF" },
            { label: "Alighted", value: totalAlighted, color: "#BE123C", bg: "#FFF1F2" },
            { label: "On bus", value: onBus, color: "#854D0E", bg: "#FEF9C3" },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: stat.bg, color: stat.color }}>
              <span className="text-[15px] font-bold">{stat.value}</span>
              {stat.label}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {/* Table head */}
        <div
          className="grid px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr", borderBottom: `1px solid ${BORDER}`, background: "#FAFAFA", color: MUTED }}
        >
          <span>Student</span>
          <span>Status</span>
          <span>Boarded</span>
          <span>Alighted</span>
          <span>Duration</span>
          <span>Notification</span>
        </div>

        {isLoading ? (
          <div className="divide-y" style={{ borderColor: "#F4F4F5" }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex gap-4 animate-pulse">
                <div className="h-7 w-7 rounded-full shrink-0" style={{ background: "#F4F4F5" }} />
                <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr" }}>
                  {[...Array(5)].map((_, j) => <div key={j} className="h-3 rounded" style={{ background: "#F4F4F5" }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-16 text-center">
            <Clock style={{ width: 28, height: 28, color: "#E4E4E7", margin: "0 auto 12px" }} />
            <p className="text-[14px] font-medium" style={{ color: "#52525B" }}>No attendance records</p>
            <p className="text-[12px] mt-1" style={{ color: MUTED }}>
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
                className="grid px-5 py-3 items-center"
                style={{
                  gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr",
                  borderBottom: i < attendance.length - 1 ? "1px solid #F4F4F5" : "none",
                  background: isOnBus ? "#FFFEF0" : "#fff",
                }}
              >
                {/* Student */}
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: bg, color: fg }}>
                    {initials(row.studentName)}
                  </div>
                  <span className="text-[13px] font-medium" style={{ color: HEAD }}>{row.studentName}</span>
                </div>

                {/* Status */}
                <StatusBadge row={row} />

                {/* Boarded */}
                <TimeCell scan={row.boardScan} type="board" />

                {/* Alighted */}
                <TimeCell scan={row.alightScan} type="alight" />

                {/* Duration */}
                <DurationBadge board={row.boardScan} alight={row.alightScan} />

                {/* Notification */}
                <NotifDots board={row.boardScan} alight={row.alightScan} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
