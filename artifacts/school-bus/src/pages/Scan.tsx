import { useEffect, useState } from "react";
import { useListScans } from "@workspace/api-client-react";
import { Activity, LogIn, LogOut, CheckCircle2, RefreshCw, Wifi, Clock, Fingerprint, Bus } from "lucide-react";
import { format, isToday } from "date-fns";
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

export default function ScanPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data: scans = [], isLoading, refetch, dataUpdatedAt } = useListScans({ limit: 100 });

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => refetch(), 8_000);
    return () => clearInterval(t);
  }, [autoRefresh, refetch]);

  const todayScans = scans.filter(s => isToday(new Date(s.scannedAt)));
  const boardCount = todayScans.filter(s => s.scanType === "board").length;
  const alightCount = todayScans.filter(s => s.scanType === "alight").length;
  const smsSentCount = todayScans.filter(s => s.smsSent).length;

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold" style={{ color: HEAD }}>Live Monitor</h1>
          <p className="text-[13px] mt-0.5 font-medium" style={{ color: MUTED }}>
            Real-time biometric scan feed from connected ZK devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-all"
            style={autoRefresh
              ? { background: "#DCFCE7", color: "#15803D", border: "1px solid #BBF7D0" }
              : { background: "#fff", color: MUTED, border: `1px solid ${BORDER}` }
            }
          >
            <RefreshCw style={{ width: 13, height: 13, animation: autoRefresh ? "spin 3s linear infinite" : "none" }} />
            {autoRefresh ? "Auto-refresh on" : "Auto-refresh"}
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "#fff", color: MUTED, border: `1px solid ${BORDER}` }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <RefreshCw style={{ width: 13, height: 13 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ZK device setup info */}
      <div className="flex items-start gap-3 px-5 py-3.5 rounded-2xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
        <Wifi style={{ width: 15, height: 15, color: "#D97706", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#92400E" }}>ZKTeco Device Setup</p>
          <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
            On your ZKTeco device go to <strong>Communication → ADMS</strong>, set the server IP and port <strong>8081</strong>, and enable real-time push. Scans will automatically appear here when students board or alight.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today's Scans", value: todayScans.length, icon: Fingerprint, bg: "#FEF3C7", color: "#92400E" },
          { label: "Boarded", value: boardCount, icon: LogIn, bg: "#DCFCE7", color: "#15803D" },
          { label: "Alighted", value: alightCount, icon: LogOut, bg: "#FFF1F2", color: "#BE123C" },
          { label: "Notifications Sent", value: smsSentCount, icon: CheckCircle2, bg: "#EEF2FF", color: "#4338CA" },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-2xl px-5 py-5 flex items-center gap-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon style={{ width: 18, height: 18, color }} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
              <p className="text-2xl font-black mt-0.5" style={{ color: HEAD }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <div className="flex items-center gap-2">
            <Activity style={{ width: 15, height: 15, color: ACCENT }} />
            <p className="text-sm font-bold" style={{ color: HEAD }}>Today's Scan Feed</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs flex items-center gap-1" style={{ color: MUTED }}>
                <Clock style={{ width: 11, height: 11 }} />
                Updated {format(lastUpdated, "h:mm:ss a")}
              </span>
            )}
            {autoRefresh && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#DCFCE7", color: "#15803D" }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                Live
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-xl shrink-0" style={{ background: "#F1F5F9" }} />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 rounded-full w-40" style={{ background: "#F1F5F9" }} />
                  <div className="h-2.5 rounded-full w-60" style={{ background: "#F1F5F9" }} />
                </div>
              </div>
            ))}
          </div>
        ) : todayScans.length === 0 ? (
          <div className="py-20 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF3C7" }}>
              <Bus style={{ width: 28, height: 28, color: ACCENT }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: HEAD }}>No scans yet today</p>
            <p className="text-xs mt-1 font-medium" style={{ color: MUTED }}>
              Scans from connected ZK devices will appear here automatically
            </p>
          </div>
        ) : (
          <div>
            {todayScans.map((scan: ScanEvent, i: number) => {
              const { bg, fg } = palette(scan.studentId);
              return (
                <div
                  key={scan.id}
                  className="px-6 py-4 flex items-center gap-4"
                  style={{ borderBottom: i < todayScans.length - 1 ? `1px solid #F1F5F9` : "none" }}
                >
                  {/* Type icon */}
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={scan.scanType === "board"
                      ? { background: "#DCFCE7" }
                      : { background: "#FFF1F2" }
                    }
                  >
                    {scan.scanType === "board"
                      ? <LogIn style={{ width: 16, height: 16, color: "#15803D" }} />
                      : <LogOut style={{ width: 16, height: 16, color: "#BE123C" }} />
                    }
                  </div>

                  {/* Student avatar */}
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: bg, color: fg }}>
                    {initials(scan.studentName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: HEAD }}>{scan.studentName}</span>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={scan.scanType === "board"
                          ? { background: "#DCFCE7", color: "#15803D" }
                          : { background: "#FFF1F2", color: "#BE123C" }
                        }
                      >
                        {scan.scanType === "board" ? "Boarded" : "Alighted"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {scan.smsSent
                        ? <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#15803D" }}>
                            <CheckCircle2 style={{ width: 10, height: 10 }} /> Notification sent to {scan.guardianPhone}
                          </span>
                        : <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>No notification sent</span>
                      }
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: HEAD }}>{format(new Date(scan.scannedAt), "h:mm a")}</p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>{format(new Date(scan.scannedAt), "d MMM")}</p>
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
