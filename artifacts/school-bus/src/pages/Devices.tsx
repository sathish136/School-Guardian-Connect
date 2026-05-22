import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDevices, useDeleteDevice, getListDevicesQueryKey } from "@workspace/api-client-react";
import type { Device } from "@workspace/api-client-react";
import { Cpu, Wifi, WifiOff, Trash2, RefreshCw, Fingerprint, Clock, Info } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ACCENT = "#5E6AD2";
const BORDER = "#E8E8EC";
const MUTED = "#8B8B99";
const HEAD = "#0A0A0B";

function DeviceRow({ device, onDelete }: { device: Device; onDelete: () => void }) {
  const lastSeen = new Date(device.lastSeen);
  const diff = Math.floor((Date.now() - lastSeen.getTime()) / 60000);
  const ago = diff < 1 ? "Just now" : diff < 60 ? `${diff}m ago` : lastSeen.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded flex items-center justify-center shrink-0" style={{ background: device.isOnline ? "#EEF2FF" : "#F4F4F5" }}>
            <Cpu style={{ width: 14, height: 14, color: device.isOnline ? ACCENT : MUTED }} />
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: HEAD }}>{device.deviceName ?? device.serialNumber}</p>
            <p className="text-[12px] font-mono" style={{ color: MUTED }}>{device.serialNumber}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        {device.ipAddress
          ? <span className="text-[12px] font-mono" style={{ color: "#52525B" }}>{device.ipAddress}</span>
          : <span style={{ color: MUTED }}>—</span>
        }
      </td>
      <td className="px-5 py-3">
        <span className="text-[12px]" style={{ color: MUTED }}>{ago}</span>
      </td>
      <td className="px-5 py-3">
        <span className="text-[13px] font-medium" style={{ color: "#52525B" }}>{device.totalPunches.toLocaleString()}</span>
      </td>
      <td className="px-5 py-3">
        {device.isOnline
          ? <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2 py-0.5 rounded" style={{ background: "#F0FDF4", color: "#15803D" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Online
            </span>
          : <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2 py-0.5 rounded" style={{ background: "#F4F4F5", color: MUTED }}>
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" /> Offline
            </span>
        }
      </td>
      <td className="px-4 py-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="h-7 w-7 rounded flex items-center justify-center hover:bg-red-50 transition-colors" style={{ color: "#EF4444" }}>
              <Trash2 style={{ width: 13, height: 13 }} />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove device?</AlertDialogTitle>
              <AlertDialogDescription>Remove <strong>{device.serialNumber}</strong>. It will reappear automatically when it reconnects.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  );
}

export default function Devices() {
  const qc = useQueryClient();
  const { data: devices = [], isLoading, refetch } = useListDevices();
  const del = useDeleteDevice();
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => refetch(), 10_000);
    return () => clearInterval(t);
  }, [auto, refetch]);

  const online = devices.filter(d => d.isOnline);
  const offline = devices.filter(d => !d.isOnline);
  const totalPunches = devices.reduce((s, d) => s + d.totalPunches, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ color: HEAD }}>Biometric Devices</h1>
          <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>ZK devices connect automatically via ADMS on port 8082</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAuto(v => !v)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium transition-colors"
            style={auto ? { border: `1px solid #C7D2FE`, background: "#EEF2FF", color: ACCENT } : { border: `1px solid ${BORDER}`, background: "#fff", color: MUTED }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: auto ? "spin 3s linear infinite" : "none" }} />
            {auto ? "Auto-refresh on" : "Auto-refresh"}
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium bg-white transition-colors hover:bg-gray-50"
            style={{ border: `1px solid ${BORDER}`, color: "#52525B" }}
          >
            <RefreshCw style={{ width: 13, height: 13 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total devices", value: devices.length, icon: Cpu, color: MUTED },
          { label: "Online now", value: online.length, icon: Wifi, color: "#16A34A" },
          { label: "Total punches", value: totalPunches.toLocaleString(), icon: Fingerprint, color: ACCENT },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-lg px-5 py-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
              <Icon style={{ width: 14, height: 14, color }} />
            </div>
            <p className="text-[26px] font-semibold tracking-tight" style={{ color: HEAD }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Setup hint */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg text-[13px]" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
        <Info style={{ width: 14, height: 14, color: "#D97706", flexShrink: 0, marginTop: 1 }} />
        <div style={{ color: "#92400E" }}>
          <span className="font-semibold">Setup:</span> On your ZKTeco device go to <strong>Communication → ADMS</strong>, set the server IP and port <strong>8082</strong>, enable real-time push. The device appears here automatically.
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg p-8 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: MUTED }}>Loading devices…</div>
      ) : devices.length === 0 ? (
        <div className="bg-white rounded-lg py-16 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <WifiOff style={{ width: 32, height: 32, color: "#E4E4E7", margin: "0 auto 12px" }} />
          <p className="text-[13px] font-medium" style={{ color: "#52525B" }}>No devices connected</p>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>Configure your ZKTeco device to point to port 8082</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFAFA" }}>
                {["Device", "IP Address", "Last seen", "Punches", "Status", ""].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <DeviceRow key={d.id} device={d} onDelete={() => del.mutate({ id: d.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListDevicesQueryKey() }) })} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
