import { useState } from "react";
import { useListStudents, useRecordScan } from "@workspace/api-client-react";
import { Fingerprint, LogIn, LogOut, CheckCircle2, XCircle, Search, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import type { ScanEvent } from "@workspace/api-client-react";

const ACCENT = "#5E6AD2";
const BORDER = "#E8E8EC";
const MUTED = "#8B8B99";
const HEAD = "#0A0A0B";

type ScanType = "board" | "alight";

interface ScanResult {
  event: ScanEvent;
  timestamp: Date;
}

export default function ScanPage() {
  const [biometricId, setBiometricId] = useState("");
  const [scanType, setScanType] = useState<ScanType>("board");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: students = [] } = useListStudents({});
  const record = useRecordScan();

  // Match biometric ID to student for preview
  const matched = students.find(s => s.biometricId.toLowerCase() === biometricId.toLowerCase());

  const handleScan = () => {
    if (!biometricId.trim()) return;
    setError(null);
    record.mutate(
      { data: { biometricId: biometricId.trim(), scanType } },
      {
        onSuccess: (event) => {
          setResults(prev => [{ event, timestamp: new Date() }, ...prev.slice(0, 19)]);
          setBiometricId("");
          setError(null);
        },
        onError: (err: unknown) => {
          const msg = err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Scan failed";
          setError(msg);
        },
      }
    );
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleScan();
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold" style={{ color: HEAD }}>Biometric Scan</h1>
        <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
          Simulate a biometric punch — enter an enrollment ID and submit to trigger the notification
        </p>
      </div>

      {/* Scanner card */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {/* Type selector */}
        <div className="grid grid-cols-2 divide-x" style={{ borderBottom: `1px solid ${BORDER}`, divideColor: BORDER }}>
          {(["board", "alight"] as ScanType[]).map(t => (
            <button
              key={t}
              onClick={() => setScanType(t)}
              className="flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold transition-colors"
              style={scanType === t
                ? { background: t === "board" ? "#EEF2FF" : "#FFF1F2", color: t === "board" ? ACCENT : "#BE123C" }
                : { background: "#FAFAFA", color: MUTED }
              }
            >
              {t === "board"
                ? <LogIn style={{ width: 15, height: 15 }} />
                : <LogOut style={{ width: 15, height: 15 }} />
              }
              {t === "board" ? "Board" : "Alight"}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="px-6 py-6">
          <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: MUTED }}>
            Biometric ID / Enrollment ID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Fingerprint
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: biometricId ? ACCENT : MUTED }}
              />
              <input
                type="text"
                className="w-full h-10 pl-9 pr-3 rounded-md text-[13px] font-mono outline-none transition-colors"
                style={{ border: `1px solid ${biometricId ? ACCENT : BORDER}`, color: HEAD, background: "#fff" }}
                placeholder="e.g. BIO-001"
                value={biometricId}
                onChange={e => { setBiometricId(e.target.value); setError(null); }}
                onKeyDown={handleKey}
                autoFocus
              />
            </div>
            <button
              onClick={handleScan}
              disabled={!biometricId.trim() || record.isPending}
              className="flex items-center gap-1.5 h-10 px-4 rounded-md text-[13px] font-semibold text-white transition-opacity"
              style={{ background: scanType === "board" ? ACCENT : "#BE123C", opacity: !biometricId.trim() || record.isPending ? 0.5 : 1 }}
            >
              {record.isPending ? "Scanning…" : (
                <>
                  {scanType === "board" ? <LogIn style={{ width: 14, height: 14 }} /> : <LogOut style={{ width: 14, height: 14 }} />}
                  {scanType === "board" ? "Board" : "Alight"}
                  <ArrowRight style={{ width: 13, height: 13 }} />
                </>
              )}
            </button>
          </div>

          {/* Student preview */}
          {biometricId && (
            <div className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: matched ? "#15803D" : MUTED }}>
              <Search style={{ width: 11, height: 11 }} />
              {matched
                ? <span>Matched: <strong>{matched.name}</strong> · {matched.grade} · Guardian: {matched.guardianName} ({matched.guardianPhone})</span>
                : <span>No student found for this ID</span>
              }
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-md text-[13px]" style={{ background: "#FFF1F2", border: "1px solid #FECDD3", color: "#BE123C" }}>
              <XCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="px-6 py-3 text-[12px]" style={{ background: "#FAFAFA", borderTop: `1px solid ${BORDER}`, color: MUTED }}>
          Press <kbd className="px-1.5 py-0.5 rounded text-[11px] font-mono" style={{ background: "#F4F4F5", border: `1px solid ${BORDER}`, color: "#52525B" }}>Enter</kbd> to submit · Real ZK device punches are processed automatically via ADMS on port 8082
        </div>
      </div>

      {/* Results log */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFAFA" }}>
            <p className="text-[13px] font-semibold" style={{ color: HEAD }}>Scan log</p>
            <span className="text-[12px]" style={{ color: MUTED }}>{results.length} scan{results.length !== 1 ? "s" : ""} this session</span>
          </div>
          <div>
            {results.map((r, i) => (
              <div
                key={r.event.id}
                className="px-5 py-3 flex items-center gap-3"
                style={{ borderBottom: i < results.length - 1 ? `1px solid #F4F4F5` : "none" }}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                  style={r.event.scanType === "board"
                    ? { background: "#EEF2FF", color: ACCENT }
                    : { background: "#FFF1F2", color: "#BE123C" }
                  }
                >
                  {r.event.scanType === "board"
                    ? <LogIn style={{ width: 14, height: 14 }} />
                    : <LogOut style={{ width: 14, height: 14 }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: HEAD }}>{r.event.studentName}</span>
                    <span
                      className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                      style={r.event.scanType === "board"
                        ? { background: "#EEF2FF", color: ACCENT }
                        : { background: "#FFF1F2", color: "#BE123C" }
                      }
                    >
                      {r.event.scanType === "board" ? "Boarded" : "Alighted"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[12px]" style={{ color: MUTED }}>
                    {r.event.smsSent
                      ? <span className="flex items-center gap-1" style={{ color: "#15803D" }}>
                          <CheckCircle2 style={{ width: 11, height: 11 }} /> Notification sent to {r.event.guardianPhone}
                        </span>
                      : <span className="flex items-center gap-1" style={{ color: "#EF4444" }}>
                          <XCircle style={{ width: 11, height: 11 }} /> Notification not sent
                        </span>
                    }
                  </div>
                </div>
                <span className="text-[12px] shrink-0 flex items-center gap-1" style={{ color: MUTED }}>
                  <Clock style={{ width: 11, height: 11 }} />
                  {format(r.timestamp, "h:mm:ss a")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick reference */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFAFA" }}>
          <p className="text-[13px] font-semibold" style={{ color: HEAD }}>Enrolled students — biometric IDs</p>
        </div>
        <div className="divide-y" style={{ borderColor: "#F4F4F5" }}>
          {students.length === 0 ? (
            <p className="px-5 py-4 text-[13px]" style={{ color: MUTED }}>No students enrolled yet</p>
          ) : students.map(s => (
            <button
              key={s.id}
              onClick={() => { setBiometricId(s.biometricId); setError(null); }}
              className="w-full px-5 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              style={{ opacity: s.isActive ? 1 : 0.5 }}
            >
              <div>
                <span className="text-[13px] font-medium" style={{ color: HEAD }}>{s.name}</span>
                <span className="text-[12px] ml-2" style={{ color: MUTED }}>{s.grade}</span>
              </div>
              <code className="text-[12px] font-mono px-2 py-0.5 rounded" style={{ background: "#F4F4F5", color: "#52525B" }}>
                {s.biometricId}
              </code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
